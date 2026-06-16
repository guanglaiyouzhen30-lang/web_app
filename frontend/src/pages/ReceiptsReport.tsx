import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface CategorySummary {
name: string;
amount: number;
}

interface SummaryResponse {
year: number;
month: number;
monthly_total: number;
category_summary: CategorySummary[];
}

export const ReceiptsReport: React.FC = () => {
const [summary, setSummary] = useState<SummaryResponse | null>(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
const fetchSummary = async () => {
    try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/receipts/summary/`);
    if (!response.ok) throw new Error('データの取得に失敗しました');
    const data = await response.json();
    setSummary(data);
    } catch (error) {
    console.error(error);
    } finally {
    setIsLoading(false);
    }
};
fetchSummary();
}, []);

// サイバーで透明感のあるモダンなカラーパレット
const COLORS = [
'#22d3ee', // Cyan
'#3b82f6', // Blue
'#8b5cf6', // Violet
'#d946ef', // Fuchsia
'#f43f5e', // Rose
'#f59e0b', // Amber
'#10b981', // Emerald
];

if (isLoading) {
return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 font-sans tracking-widest text-sm">
    <div className="animate-pulse">ANALYZING DATA...</div>
    </div>
);
}

return (
<div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-24 selection:bg-cyan-500/30">
    <div className="max-w-2xl mx-auto px-4 pt-8">
    
    {/* ヘッダーエリア */}
    <div className="mb-8">
        <Link to="/receipts" className="text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors tracking-widest uppercase mb-4 inline-block">
        &lt; BACK TO DASHBOARD
        </Link>
        <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-white">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            {summary?.year}.{String(summary?.month).padStart(2, '0')}
        </span> Analysis
        </h2>
        <div className="text-sm text-slate-400 tracking-widest uppercase">Category Expense Report</div>
    </div>

    {/* 円グラフと合計金額のグラスモーフィズムカード */}
    <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 md:p-8 shadow-2xl mb-8 relative overflow-hidden">
        
        <div className="text-center mb-8">
        <div className="text-xs text-slate-400 tracking-widest uppercase mb-2">Total Monthly Spend</div>
        <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-mono">
            <span className="text-lg mr-1 text-slate-400 font-sans font-normal">¥</span>
            {summary?.monthly_total.toLocaleString()}
        </div>
        </div>

        {summary && summary.category_summary.length > 0 ? (
        <div className="w-full h-[280px] relative">
            <ResponsiveContainer>
            <PieChart>
                <Pie
                data={summary.category_summary}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={80} // ドーナツの穴を大きくしてスタイリッシュに
                outerRadius={110}
                paddingAngle={4} // グラフの隙間を少し空けて抜け感を出す
                stroke="none"
                >
                {summary.category_summary.map((_, index) => (
                    <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    className="hover:opacity-80 transition-opacity duration-300 outline-none cursor-pointer" 
                    />
                ))}
                </Pie>
                {/* ツールチップ（マウスオーバー時のポップアップ）もダークテーマに合わせる */}
                <Tooltip 
                formatter={(value: any) => `¥${Number(value).toLocaleString()}`}
                contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    backdropFilter: 'blur(8px)',
                    borderColor: '#334155', 
                    borderRadius: '12px', 
                    color: '#f8fafc', 
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(34, 211, 238, 0.2)'
                }}
                itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                />
            </PieChart>
            </ResponsiveContainer>
            
            {/* ドーナツグラフの中央にアイコンを配置する装飾 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-600/50 text-4xl pointer-events-none">
            <i className="fa-solid fa-chart-pie"></i>
            </div>
        </div>
        ) : (
        <div className="py-20 text-center text-slate-500 text-xs tracking-widest uppercase border border-dashed border-slate-700 rounded-xl bg-slate-800/20">
            No Data Available
        </div>
        )}
    </div>

    {/* 金額順ランキングリスト */}
    <div className="animate-fadeIn">
        <div className="text-sm font-bold mb-4 text-slate-300 tracking-wide flex items-center">
        <div className="w-1.5 h-4 bg-cyan-400 rounded-full mr-3 shadow-[0_0_10px_#22d3ee]"></div>
        EXPENSE RANKING
        </div>
        
        <div className="flex flex-col gap-3">
        {summary?.category_summary.map((cat, idx) => {
            const color = COLORS[idx % COLORS.length];
            return (
            <div key={idx} className="flex items-center bg-slate-800/30 backdrop-blur-sm border border-slate-800 rounded-xl p-4 hover:border-slate-700/80 transition-all group">
                {/* カテゴリごとのカラーインジケーター（光るエフェクト付き） */}
                <div 
                className="w-3 h-3 rounded-full mr-4 shadow-sm group-hover:scale-125 transition-transform" 
                style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}80` }}
                ></div>
                <div className="flex-1 text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{cat.name}</div>
                <div className="text-base font-bold text-slate-100 font-mono">
                ¥{cat.amount.toLocaleString()}
                </div>
            </div>
            );
        })}
        </div>
    </div>

    </div>
</div>
);
};