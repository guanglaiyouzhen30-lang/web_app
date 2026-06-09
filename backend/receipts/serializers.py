from rest_framework import serializers
from .models import Category, Receipt, ReceiptItem

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class ReceiptItemSerializer(serializers.ModelSerializer):
    # カテゴリの文字列表現（例: "食費"）を読み取り専用で追加
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = ReceiptItem
        fields = ['id', 'category', 'category_name', 'item_name', 'price']

class ReceiptSerializer(serializers.ModelSerializer):
    # 親であるReceiptを返す時、紐づく子（items）も一緒にリストで返す
    items = ReceiptItemSerializer(many=True, read_only=True)

    class Meta:
        model = Receipt
        fields = ['id', 'store_name', 'date', 'total_amount', 'items', 'created_at']