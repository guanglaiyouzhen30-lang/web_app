import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Category {
id: string;
name: string;
}

export const Categories: React.FC = () => {
const [categories, setCategories] = useState<Category[]>([]);
const [newCategoryName, setNewCategoryName] = useState<string>('');
const [isLoading, setIsLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);

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
    
    setNewCategoryName('');
    fetchCategories();
} catch (err: any) {
    setError(err.message);
} finally {
    setIsLoading(false);
}
};

const handleDeleteCategory = async (id: string, name: string) => {
if (!window.confirm(`カテゴリ「${name}」を削除してもよろしいですか？\n※このカテゴリを使っている明細は「未分類」になります。`)) {
    return;
}

try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/receipts/categories/${id}/`, {
    method: 'DELETE',
    });

    if (!response.ok) throw new Error('削除に失敗しました');
    fetchCategories();
} catch (err: any) {
    setError(err.message);
}
};

return (
<div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-24 selection:bg-cyan-500/30">
    <div className="max-w-2xl mx-auto px-4 pt-8">
    
    {/* ヘッダーエリア */}
    <div className="mb-8">
        <Link to="/receipts" className="text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors tracking-widest uppercase mb-4 inline-block">
        &lt; BACK TO DASHBOARD
        </Link>
        <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-white">
        Category <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Management</span>
        </h2>
        <div className="text-sm text-slate-400 tracking-widest uppercase">AI Classification Master Data</div>
    </div>

    {/* エラー表示 */}
    {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-sm font-bold tracking-wide flex items-center animate-fadeIn">
        <span className="mr-2">⚠️</span> {error}
        </div>
    )}

    {/* 新規追加フォーム（グラスモーフィズム） */}
    <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl mb-8">
        <div className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4 flex items-center">
        <div className="w-1.5 h-4 bg-cyan-400 rounded-full mr-3"></div>
        Add New Category
        </div>
        <div className="flex gap-3">
        <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="新しいカテゴリ名 (例: サプリメント)"
            className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
        />
        <button
            onClick={handleAddCategory}
            disabled={isLoading || !newCategoryName.trim()}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-extrabold text-sm rounded-xl cursor-pointer transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:cursor-not-allowed tracking-widest uppercase whitespace-nowrap"
        >
            {isLoading ? 'ADDING...' : 'ADD'}
        </button>
        </div>
    </div>

    {/* カテゴリ一覧リスト */}
    <div className="animate-fadeIn">
        <div className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4 pl-2">
        Registered Categories ({categories.length})
        </div>
        
        <ul className="flex flex-col gap-3">
        {categories.map((category) => (
            <li 
            key={category.id} 
            className="flex justify-between items-center bg-slate-800/30 backdrop-blur-sm border border-slate-800 rounded-xl p-4 hover:border-slate-700/80 transition-all group"
            >
            <div className="flex items-center">
                <span className="text-lg mr-3 text-slate-500 group-hover:text-cyan-400 transition-colors">🏷️</span>
                <span className="text-base font-bold text-slate-200 group-hover:text-white transition-colors">{category.name}</span>
            </div>
            <button
                onClick={() => handleDeleteCategory(category.id, category.name)}
                className="px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-transparent hover:border-rose-500/30 rounded-lg text-xs font-bold tracking-widest uppercase transition-all"
            >
                Delete
            </button>
            </li>
        ))}
        
        {categories.length === 0 && (
            <li className="py-12 text-center text-slate-500 text-xs tracking-widest uppercase border border-dashed border-slate-700 rounded-xl bg-slate-800/20">
            No Categories Found
            </li>
        )}
        </ul>
    </div>

    </div>
</div>
);
};