import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// APIから受け取るデータの型定義
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

// コンポーネント読み込み時にDjango APIからデータを取得
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

// コーポレートデザインに合わせたシックなカラーパレット（CTCレッドとモノトーン）
const COLORS = ['#e60012', '#333333', '#666666', '#999999', '#cccccc', '#ececec'];

if (isLoading) {
return <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>データを読み込み中...</div>;
}

return (
<div style={{ padding: '0', maxWidth: '600px', margin: '0 auto', backgroundColor: '#f5f5f5', minHeight: '100vh', fontFamily: '"Noto Sans JP", sans-serif' }}>
    
    {/* 1. ヘッダーエリア */}
    <div style={{ 
    position: 'relative', backgroundColor: '#fff', color: '#111', padding: '40px 20px 30px',
    textAlign: 'center', borderTop: '6px solid #e60012', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
    <Link to="/receipts" style={{ 
        position: 'absolute', top: '20px', left: '20px', textDecoration: 'none', color: '#666', fontSize: '13px', fontWeight: 'bold'
    }}>
        &lt; カレンダーへ
    </Link>
    <h2 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>
        {summary?.year}年 {summary?.month}月 支出分析
    </h2>
    <div style={{ fontSize: '13px', color: '#666' }}>カテゴリ別集計レポート</div>
    </div>

    {/* 2. 円グラフエリア */}
    <div style={{ margin: '20px', backgroundColor: '#fff', border: '1px solid #ddd', padding: '30px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    
    {/* 中央の合計金額表記 */}
    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>支出合計</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111', fontFamily: 'Arial, sans-serif' }}>
        <span style={{ fontSize: '18px', marginRight: '4px' }}>¥</span>
        {summary?.monthly_total.toLocaleString()}
        </div>
    </div>

    {summary && summary.category_summary.length > 0 ? (
        <div style={{ width: '100%', height: '300px' }}>
        <ResponsiveContainer>
            <PieChart>
            <Pie
                data={summary.category_summary}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70} // ドーナツ型にする設定
                outerRadius={100}
                paddingAngle={2}
                stroke="none"
            >
                {summary.category_summary.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
            </Pie>
            <Tooltip 
                formatter={(value: any) => `¥${Number(value).toLocaleString()}`}
                contentStyle={{ border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                />
            <Legend verticalAlign="bottom" height={36} iconType="square" />
            </PieChart>
        </ResponsiveContainer>
        </div>
    ) : (
        <div style={{ padding: '50px 0', color: '#999', fontSize: '14px' }}>今月のデータはありません</div>
    )}
    </div>

    {/* 3. 金額順ランキングリスト */}
    <div style={{ padding: '0 20px 120px' }}>
    <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '15px', color: '#111', borderBottom: '1px solid #ccc', paddingBottom: '10px', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '4px', height: '16px', backgroundColor: '#111', marginRight: '10px' }}></div>
        支出ランキング
    </div>
    
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {summary?.category_summary.map((cat, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: '15px', border: '1px solid #e5e5e5' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: COLORS[idx % COLORS.length], marginRight: '15px' }}></div>
            <div style={{ flex: 1, fontSize: '15px', fontWeight: 'bold', color: '#111' }}>{cat.name}</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#111', fontFamily: 'Arial, sans-serif' }}>
            ¥{cat.amount.toLocaleString()}
            </div>
        </div>
        ))}
    </div>
    </div>

</div>
);
};