import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// カテゴリの型定義
interface Category {
id: string;
name: string;
}

export const Categories: React.FC = () => {
const [categories, setCategories] = useState<Category[]>([]);
const [newCategoryName, setNewCategoryName] = useState<string>('');
const [isLoading, setIsLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);

// コンポーネントが読み込まれた時にカテゴリ一覧を取得する
useEffect(() => {
fetchCategories();
}, []);

const fetchCategories = async () => {
try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/receipts/categories/`);
    if (!response.ok) throw new Error('カテゴリの取得に失敗しました');
    const data = await response.json();
    setCategories(data);
} catch (err: any) {
    setError(err.message);
}
};

// 新しいカテゴリを追加する処理
const handleAddCategory = async () => {
if (!newCategoryName.trim()) return;
setIsLoading(true);
setError(null);

try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/receipts/categories/`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: newCategoryName.trim() }),
    });

    if (!response.ok) throw new Error('追加に失敗しました。すでに存在する名前の可能性があります。');
    
    setNewCategoryName(''); // 入力欄をクリア
    fetchCategories();      // リストを再取得して画面を更新
} catch (err: any) {
    setError(err.message);
} finally {
    setIsLoading(false);
}
};

// カテゴリを削除する処理
const handleDeleteCategory = async (id: string, name: string) => {
if (!window.confirm(`カテゴリ「${name}」を削除してもよろしいですか？\n※このカテゴリを使っている明細は「未分類」になります。`)) {
    return;
}

try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/receipts/categories/${id}/`, {
    method: 'DELETE',
    });

    if (!response.ok) throw new Error('削除に失敗しました');
    fetchCategories(); // リストを再取得して画面を更新
} catch (err: any) {
    setError(err.message);
}
};

return (
<>
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
    <h2>🏷️ カテゴリ設定 (Categories)</h2>
    <p style={{ color: '#666' }}>AIによるレシート解析時に使用される分類マスタです。</p>

    {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

    {/* 新規追加フォーム */}
    <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input
        type="text"
        value={newCategoryName}
        onChange={(e) => setNewCategoryName(e.target.value)}
        placeholder="新しいカテゴリ名 (例: サプリメント)"
        style={{ flex: 1, padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button
        onClick={handleAddCategory}
        disabled={isLoading || !newCategoryName.trim()}
        style={{
            padding: '10px 20px', backgroundColor: '#28a745', color: 'white',
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
        }}
        >
        追加
        </button>
    </div>

    {/* カテゴリ一覧表示 */}
    <ul style={{ listStyle: 'none', padding: 0 }}>
        {categories.map((category) => (
        <li 
            key={category.id} 
            style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            padding: '12px 15px', borderBottom: '1px solid #eee', backgroundColor: '#fff' 
            }}
        >
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{category.name}</span>
            <button
            onClick={() => handleDeleteCategory(category.id, category.name)}
            style={{
                padding: '6px 12px', backgroundColor: '#dc3545', color: 'white',
                border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
            }}
            >
            削除
            </button>
        </li>
        ))}
        {categories.length === 0 && (
        <li style={{ color: '#999', textAlign: 'center', padding: '20px' }}>カテゴリが登録されていません</li>
        )}
    </ul>
    </div>

    <div style={{ textAlign: 'center', marginTop: '30px' }}>
    <Link to="/">← ホームに戻る</Link>
    </div>
</>
);
};