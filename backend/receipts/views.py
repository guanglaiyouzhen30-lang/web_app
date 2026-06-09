from django.shortcuts import render
from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Category, Receipt, ReceiptItem
from .serializers import CategorySerializer, ReceiptSerializer, ReceiptItemSerializer
from google import genai
from google.genai import types
import os
import json
# Create your views here.
class CategoryViewSet(viewsets.ModelViewSet):
    """
    カテゴリ一覧を取得するAPI（Reactのセレクトボックス等で使用）
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class ReceiptViewSet(viewsets.ModelViewSet):
    """
    レシート一覧を取得・作成・更新・削除するAPI
    """
    queryset = Receipt.objects.all()
    serializer_class = ReceiptSerializer

class ReceiptUploadView(APIView):
    """
    レシート画像をアップロードして、OCRでテキストを抽出し、レシートと明細を作成するAPI
    """
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'error': '画像ファイルが必要です。'}, status=status.HTTP_400_BAD_REQUEST)
        
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            return Response({'error': 'APIキーが設定されてないです。'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        client = genai.Client(api_key=api_key)

        image_bytes = image_file.read()
        image_input = types.Part.from_bytes(
            data=image_bytes,
            mime_type=image_file.content_type or 'image/jpeg',
        )

        categories = Category.objects.all()
        category_names = [category.name for category in categories]
        
        # もしカテゴリが1つも登録されていなかった場合の保険
        if not category_names:
            category_names_str = "未分類"
        else:
            category_names_str = ", ".join(category_names)

        prompt = f"""
        このレシート画像を解析し、以下のキーを持つJSONフォーマットで出力してください。
        マークダウンの```jsonや```などは含めず、純粋なJSON文字列のみを返してください。

        【重要】
        カテゴリ（category_name）は、必ず以下の「選択可能なカテゴリリスト」の中から最も適切なものを1つ選んで割り当ててください。
        リストに当てはまるものがない場合や、リストが空の場合は「未分類」としてください。

        選択可能なカテゴリリスト: [{category_names_str}]

        期待するフォーマット:
        {{
            "message": "AIによる解析が完了しました",
            "store_name": "店舗名",
            "date": "YYYY-MM-DD",
            "total_amount": 1000,
            "items": [
                {{"item_name": "商品名1", "price": 500, "category_name": "食費"}},
                {{"item_name": "商品名2", "price": 500, "category_name": "日用品"}}
            ]
        }}
        """

        try:
            # 4. Gemini 2.5 Flashで解析を実行
            # response_mime_type を指定することで、確実なJSON形式での出力を強制します
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[image_input, prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )

            # 5. 返ってきたJSON文字列をPythonの辞書（ディクショナリ）に変換
            result_data = json.loads(response.text)

            with transaction.atomic():
                
                # 1. 親テーブル (Receipt) の保存
                # AIが判定した日付が正しいフォーマット（YYYY-MM-DD）であることを期待して保存します
                receipt = Receipt.objects.create(
                    store_name=result_data.get("store_name"),
                    date=result_data.get("date"),
                    total_amount=result_data.get("total_amount")
                )

                # 2. 子テーブル (ReceiptItem) の一括保存用のリスト
                items_to_create = []
                
                # AIから返ってきた品目リストを1行ずつループ処理
                for item in result_data.get("items", []):
                    category_name = item.get("category_name")
                    
                    # AIが選んだカテゴリ名から、データベース内のCategoryオブジェクトを検索
                    category_obj = Category.objects.filter(name=category_name).first()
                    
                    # 検索で見つからなかった場合は、category_obj は None (未分類) になります
                    
                    # 保存するデータのオブジェクト（身代わり）を作ってリストに溜める
                    items_to_create.append(
                        ReceiptItem(
                            receipt=receipt,          # 先ほど作った親レシートを紐付ける
                            category=category_obj,    # 見つかったカテゴリ（またはNone）
                            item_name=item.get("item_name"),
                            price=item.get("price")
                        )
                    )
                
                ReceiptItem.objects.bulk_create(items_to_create)

            serializer = ReceiptSerializer(receipt)

            return Response(serializer.data, status=status.HTTP_200_OK)

        except json.JSONDecodeError:
            return Response({'error': 'AIによる解析に失敗しました。'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ReceiptSummaryView(APIView):
    """
    指定された年月の家計簿データを集計して返すAPI
    """
    def get(self, request, *args, **kwargs):
        # 1. リクエストから年月を取得（指定がなければ現在の年月を使用）
        now = timezone.now()
        year = int(request.query_params.get('year', now.year))
        month = int(request.query_params.get('month', now.month))

        # 2. 対象年月の「明細 (ReceiptItem)」をデータベースから取得
        # receipt__date__year のようにアンダースコア2つで親テーブル(Receipt)の日付を条件にできます
        # select_related を使うことで、親のReceiptとCategoryのデータを一度の通信で効率よく取得します（N+1問題の防止）
        items = ReceiptItem.objects.filter(
            receipt__date__year=year,
            receipt__date__month=month
        ).select_related('receipt', 'category')

        # 3. データをフロントエンドが使いやすい形に整理する
        monthly_total = 0
        daily_data = {}
        category_summary = {}

        for item in items:
            day = item.receipt.date.day
            price = item.price
            category_name = item.category.name if item.category else "未分類"

            # ① 今月の合計に加算
            monthly_total += price

            # ② 日ごとのデータに整理（カレンダー用）
            if day not in daily_data:
                daily_data[day] = {'total': 0, 'items': []}
            
            daily_data[day]['total'] += price
            daily_data[day]['items'].append({
                'name': item.item_name,
                'price': price,
                'category': category_name
            })

            # ③ カテゴリごとの集計（円グラフ用）
            if category_name not in category_summary:
                category_summary[category_name] = 0
            category_summary[category_name] += price

        # 円グラフで扱いやすいように、カテゴリ集計を配列にして金額が大きい順に並び替え
        category_list = [{'name': k, 'amount': v} for k, v in category_summary.items()]
        category_list.sort(key=lambda x: x['amount'], reverse=True)

        # 4. JSONとしてフロントエンドに返す
        return Response({
            'year': year,
            'month': month,
            'monthly_total': monthly_total,
            'daily_data': daily_data,
            'category_summary': category_list
        }, status=status.HTTP_200_OK)