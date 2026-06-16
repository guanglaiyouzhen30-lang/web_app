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
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [previewUrl, setPreviewUrl] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState<boolean>(false);
const [result, setResult] = useState<AnalysisResult | null>(null);
const [error, setError] = useState<string | null>(null);

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
}
};

const handleUpload = async () => {
if (!selectedFile) return;

setIsLoading(true);
setError(null);

const formData = new FormData();
formData.append('image', selectedFile);

try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/receipts/upload/`, {
    method: 'POST',
    body: formData,
    });

    if (!response.ok) {
    throw new Error('レシートの解析に失敗しました。');
    }

    const data: AnalysisResult = await response.json();
    setResult(data);
} catch (err: any) {
    setError(err.message || 'エラーが発生しました。');
} finally {
    setIsLoading(false);
}
};

return (
<div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-20 selection:bg-cyan-500/30">
    <div className="max-w-2xl mx-auto px-4 pt-8">
    
    {/* ヘッダー */}
    <Link to="/receipts" className="text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors tracking-widest uppercase mb-6 inline-block">
        &lt; BACK TO DASHBOARD
    </Link>
    <h2 className="text-3xl font-extrabold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
        AI Receipt Scanner
    </h2>

    {/* 1. ファイル選択エリア（ドラッグ＆ドロップ風のモダンな領域） */}
    {!previewUrl && !result && (
        <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <label 
            htmlFor="receipt-input" 
            className="relative flex flex-col items-center justify-center w-full h-64 bg-slate-800/80 backdrop-blur-sm border-2 border-dashed border-slate-600 hover:border-cyan-400/80 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden"
        >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className="w-16 h-16 mb-4 rounded-full bg-slate-900/50 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                📸
            </div>
            <p className="mb-2 text-sm text-slate-300 font-bold tracking-wide">タップしてレシート画像をアップロード</p>
            <p className="text-xs text-slate-500 tracking-widest uppercase">JPG, PNG format</p>
            </div>
            <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            id="receipt-input"
            className="hidden"
            />
        </label>
        </div>
    )}

    {/* 2. 画像プレビュー & 3. 解析実行ボタン */}
    {previewUrl && !result && (
        <div className="animate-fadeIn">
        <div className="relative rounded-2xl overflow-hidden mb-6 border border-slate-700/50 shadow-2xl bg-slate-800/30">
            <img src={previewUrl} alt="Preview" className={`w-full h-auto max-h-[60vh] object-contain ${isLoading ? 'opacity-50 blur-sm scale-105' : ''} transition-all duration-700`} />
            
            {/* スキャン中のサイバーなエフェクト */}
            {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="absolute top-0 w-full h-1 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-scan"></div>
                <div className="text-cyan-400 font-bold tracking-widest text-lg animate-pulse bg-slate-900/80 px-6 py-2 rounded-full border border-cyan-500/30">
                SCANNING...
                </div>
            </div>
            )}
        </div>

        <div className="flex gap-4">
            <label htmlFor="receipt-input-re" className="flex-1 text-center py-4 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 hover:text-white font-bold text-sm rounded-xl cursor-pointer transition-all border border-slate-700/50">
            選び直す
            <input type="file" accept="image/*" onChange={handleFileChange} id="receipt-input-re" className="hidden" disabled={isLoading} />
            </label>
            <button 
            onClick={handleUpload} 
            disabled={isLoading}
            className="flex-[2] py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-extrabold text-sm rounded-xl cursor-pointer transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] disabled:opacity-50 disabled:cursor-not-allowed tracking-widest uppercase"
            >
            {isLoading ? 'PROCESSING...' : 'ANALYZE DATA'}
            </button>
        </div>
        </div>
    )}

    {/* 4. エラー表示 */}
    {error && (
        <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-sm font-bold tracking-wide flex items-center">
        <span className="mr-2">⚠️</span> {error}
        </div>
    )}

    {/* 5. 解析結果表示（レシート風の美しいカードデザイン） */}
    {result && (
        <div className="mt-8 animate-fadeIn">
        <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            {/* カード上部のアクセント */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500"></div>
            
            <div className="text-center mb-8 pb-6 border-b border-slate-700/50 hover:border-cyan-500/30 transition-colors duration-300">
            <div className="text-xs text-slate-400 tracking-widest uppercase mb-2">Analyzed Result</div>
            <h3 className="text-2xl md:text-3xl font-bold text-white tracking-wide mb-1">{result.store_name}</h3>
            <div className="text-sm font-mono text-cyan-400/80">{result.date}</div>
            </div>
            
            <div className="mb-6 text-xs text-slate-500 tracking-widest uppercase font-semibold">Purchased Items</div>
            
            <div className="flex flex-col gap-3 mb-8">
            {result.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between group">
                <div className="flex flex-col">
                    <span className="text-slate-200 font-bold text-sm group-hover:text-cyan-300 transition-colors">{item.item_name}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">{item.category_name}</span>
                </div>
                <div className="text-slate-100 font-mono font-bold">
                    ¥{item.price.toLocaleString()}
                </div>
                </div>
            ))}
            </div>
            
            <div className="pt-6 border-t border-slate-700/50 flex justify-between items-end mb-8">
            <div className="text-sm text-slate-400 font-bold tracking-widest uppercase">Total Amount</div>
            <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-mono">
                <span className="text-lg mr-1 text-slate-400 font-sans font-normal">¥</span>
                {result.total_amount.toLocaleString()}
            </div>
            </div>

            <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl text-center text-xs font-bold tracking-widest uppercase flex items-center justify-center">
            <span className="mr-2">✅</span> Successfully registered
            </div>
        </div>

        <button 
            onClick={() => {
            setResult(null);
            setSelectedFile(null);
            setPreviewUrl(null);
            }}
            className="w-full mt-6 py-4 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white font-bold text-sm rounded-xl cursor-pointer transition-all border border-slate-700/50 tracking-widest uppercase"
        >
            Scan Another Receipt
        </button>
        </div>
    )}
    </div>
</div>
);
};