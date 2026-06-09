import React, { useState } from 'react';
import { Link } from 'react-router-dom'; 

interface ReceiptItem {
item_name: string;
price: number;
category_name: string;
}

interface AnalysisResult {
message: string;
store_name: string;
date: string;
total_amount: number;
items: ReceiptItem[];
}

export const Receipts: React.FC = () => {
// 状態（State）の管理
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [previewUrl, setPreviewUrl] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState<boolean>(false);
const [result, setResult] = useState<AnalysisResult | null>(null);
const [error, setError] = useState<string | null>(null);

// ファイルが選択されたときの処理
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    setSelectedFile(file);
    
    // 画面に選択した画像のプレビューを表示するためのURLを生成
    setPreviewUrl(URL.createObjectURL(file));
    // 新しいファイルが選ばれたら、前回の結果をクリア
    setResult(null);
    setError(null);
}
};

// アップロード（AI解析）ボタンが押されたときの処理
const handleUpload = async () => {
if (!selectedFile) return;

setIsLoading(true);
setError(null);


const formData = new FormData();
formData.append('image', selectedFile);

try {
    // DjangoのAPIエンドポイントを呼び出し
    const response = await fetch('http://127.0.0.1:8000/api/receipts/upload/', {
    method: 'POST',
    body: formData,
    });

    if (!response.ok) {
    throw new Error('レシートの解析に失敗しました。');
    }

    const data: AnalysisResult = await response.json();
    setResult(data); // 解析結果を保存
} catch (err: any) {
    setError(err.message || 'エラーが発生しました。');
} finally {
    setIsLoading(false); // ローディング終了
}
};

return (
<> {/* 👈 修正2: 全体をフラグメントで囲む */}
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h2>家計簿レシート登録 (Receipts)</h2>
        
        {/* 1. ファイル選択エリア */}
        <div style={{ marginBottom: '20px', border: '2px dashed #ccc', padding: '20px', textAlign: 'center' }}>
        <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            id="receipt-input"
            style={{ display: 'none' }}
        />
        <label htmlFor="receipt-input" style={{ cursor: 'pointer', color: '#0066cc' }}>
            {selectedFile ? '別の画像を選択する' : 'レシート画像を選択してください'}
        </label>
        {selectedFile && <p style={{ fontSize: '12px', marginTop: '5px' }}>{selectedFile.name}</p>}
        </div>

        {/* 2. 画像プレビュー */}
        {previewUrl && (
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} />
        </div>
        )}

        {/* 3. 解析実行ボタン */}
        {selectedFile && !result && (
        <button 
            onClick={handleUpload} 
            disabled={isLoading}
            style={{
            width: '100%', padding: '12px', backgroundColor: '#0066cc', color: 'white',
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
            }}
        >
            {isLoading ? 'AI解析中...' : 'AIレシート解析を実行'}
        </button>
        )}

        {/* 4. エラー表示 */}
        {error && <div style={{ color: 'red', marginTop: '20px' }}>{error}</div>}

        {/* 5. 解析結果表示（非表示 ➡️ 解析完了後に表示） */}
        {result && (
        <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
            <h3>📊 解析結果（確認）</h3>
            <p><strong>店舗名:</strong> {result.store_name}</p>
            <p><strong>購入日:</strong> {result.date}</p>
            
            <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>【品目明細】</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>品目名</th>
                <th style={{ padding: '8px' }}>カテゴリ</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>金額</th>
                </tr>
            </thead>
            <tbody>
                {result.items.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{item.item_name}</td>
                    <td style={{ padding: '8px' }}>
                    <span style={{ backgroundColor: '#e0e0e0', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                        {item.category_name}
                    </span>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{item.price}円</td>
                </tr>
                ))}
            </tbody>
            </table>
            
            <div style={{ marginTop: '20px', textAlign: 'right', fontSize: '18px', fontWeight: 'bold' }}>
            合計金額: {result.total_amount}円
            </div>

        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}>
        ✅ 家計簿への自動登録が完了しました！
        </div>
        <button 
        onClick={() => {
            setResult(null);
            setSelectedFile(null);
            setPreviewUrl(null);
        }}
        style={{
            width: '100%', marginTop: '10px', padding: '10px', backgroundColor: '#6c757d', color: 'white',
            border: 'none', borderRadius: '4px', cursor: 'pointer'
        }}
        >
        続けて別のレシートを登録する
        </button>
        </div>
        )}
    </div>
    
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
    <Link to="/">← ホームに戻る</Link>
    </div>
</>
);
};