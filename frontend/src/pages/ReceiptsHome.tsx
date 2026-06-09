import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// APIから受け取るデータの型定義
interface ReceiptItem {
name: string;
price: number;
category: string;
}

interface DailyData {
total: number;
items: ReceiptItem[];
}

interface SummaryResponse {
year: number;
month: number;
monthly_total: number;
daily_data: { [key: string]: DailyData }; // APIからのキーは文字列になります
}

export const ReceiptsHome: React.FC = () => {
// 現在の日付を基準に初期化
const today = new Date();
const [year, setYear] = useState(today.getFullYear());
const [month, setMonth] = useState(today.getMonth() + 1);
const [selectedDate, setSelectedDate] = useState<number | null>(today.getDate());

const [summary, setSummary] = useState<SummaryResponse | null>(null);
const [isLoading, setIsLoading] = useState(true);

// 年・月が変わるたびにDjangoのAPIからデータを取得する
useEffect(() => {
const fetchSummary = async () => {
    setIsLoading(true);
    try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/receipts/summary/?year=${year}&month=${month}`);
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
}, [year, month]);

// 月を切り替える関数
const handlePrevMonth = () => {
if (month === 1) {
    setYear(year - 1);
    setMonth(12);
} else {
    setMonth(month - 1);
}
setSelectedDate(null); // 月を移動したら選択状態をリセット
};

const handleNextMonth = () => {
if (month === 12) {
    setYear(year + 1);
    setMonth(1);
} else {
    setMonth(month + 1);
}
setSelectedDate(null);
};

if (isLoading && !summary) {
return <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>データを読み込み中...</div>;
}

const daysInMonth = new Date(year, month, 0).getDate();
const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

const emptyCells = Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} style={cellStyle}></div>);

const dayCells = Array.from({ length: daysInMonth }).map((_, i) => {
const day = i + 1;
// Djangoから送られてきた daily_data はキーが文字列 ("1", "2"...) になっているため String(day) でアクセス
const dayData = summary?.daily_data[String(day)];
const isSelected = selectedDate === day;

return (
    <div 
    key={day} 
    onClick={() => setSelectedDate(day)}
    style={{
        ...cellStyle,
        backgroundColor: isSelected ? '#fdf2f2' : 'transparent',
        cursor: 'pointer',
        border: isSelected ? '1px solid #e60012' : '1px solid transparent',
        borderRight: '1px solid #e5e5e5',
        borderBottom: '1px solid #e5e5e5',
    }}
    >
    <div style={{
        display: 'inline-block',
        width: '24px', height: '24px',
        lineHeight: '24px', textAlign: 'center',
        backgroundColor: isSelected ? '#e60012' : 'transparent',
        color: isSelected ? '#fff' : '#333', 
        fontSize: '14px', marginBottom: '4px',
        fontWeight: isSelected ? 'bold' : 'normal',
        borderRadius: '2px'
    }}>
        {day}
    </div>
    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#111' }}>
        {dayData ? `¥${dayData.total.toLocaleString()}` : ''}
    </div>
    </div>
);
});

const selectedData = selectedDate ? summary?.daily_data[String(selectedDate)] : null;

return (
<div style={{ padding: '0', maxWidth: '600px', margin: '0 auto', backgroundColor: '#f5f5f5', minHeight: '100vh', fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif' }}>
    
    {/* 1. コーポレートスタイルのヘッダー */}
    <div style={{ 
    position: 'relative',
    backgroundColor: '#fff', 
    color: '#111', 
    padding: '40px 20px 30px',
    textAlign: 'center', 
    borderTop: '6px solid #e60012', 
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
    <Link to="/" style={{ 
        position: 'absolute', 
        top: '20px', 
        left: '20px', 
        textDecoration: 'none', 
        color: '#666', 
        fontSize: '13px',
        fontWeight: 'bold',
        letterSpacing: '1px'
    }}>
        &lt; ポータルへ
    </Link>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <span onClick={handlePrevMonth} style={{ cursor: 'pointer', color: '#666', fontSize: '14px', padding: '10px' }}>&lt; 先月</span>
        <h2 style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>{year}年 {month}月</h2>
        <span onClick={handleNextMonth} style={{ cursor: 'pointer', color: '#666', fontSize: '14px', padding: '10px' }}>来月 &gt;</span>
    </div>
    <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px', letterSpacing: '1px' }}>今月の支出合計</div>
    <div style={{ fontSize: '38px', fontWeight: 'bold', color: '#e60012', fontFamily: 'Arial, sans-serif' }}>
        <span style={{ fontSize: '20px', marginRight: '4px', color: '#111' }}>¥</span>
        {summary?.monthly_total ? summary.monthly_total.toLocaleString() : '0'}
    </div>
    </div>

    {/* 2. シャープなカレンダーエリア */}
    <div style={{ margin: '20px', backgroundColor: '#fff', border: '1px solid #ddd', padding: '10px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '12px', color: '#666', paddingBottom: '10px', borderBottom: '2px solid #111' }}>
        <div style={{color: '#e60012'}}>日</div><div>月</div><div>火</div><div>水</div><div>木</div><div>金</div><div style={{color: '#0066cc'}}>土</div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid #e5e5e5', borderLeft: '1px solid #e5e5e5' }}>
        {emptyCells}
        {dayCells}
    </div>
    </div>

    {/* 3. クリーンな明細リスト */}
    {selectedDate && (
    <div style={{ padding: '0 20px 120px' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '15px', color: '#111', borderBottom: '1px solid #ccc', paddingBottom: '10px', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '4px', height: '16px', backgroundColor: '#e60012', marginRight: '10px' }}></div>
        {month}月{selectedDate}日 の明細
        </div>
        
        {selectedData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedData.items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: '15px', border: '1px solid #e5e5e5', transition: 'background-color 0.2s' }}>
                <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px', display: 'inline-block', border: '1px solid #ccc', padding: '2px 6px' }}>{item.category}</div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#111' }}>{item.name}</div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#111', fontFamily: 'Arial, sans-serif' }}>
                ¥{item.price.toLocaleString()}
                </div>
            </div>
            ))}
        </div>
        ) : (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999', fontSize: '13px', backgroundColor: '#fff', border: '1px solid #e5e5e5' }}>
            データがありません
        </div>
        )}
    </div>
    )}

    {/* 4. アプリ風ボトムナビゲーション (3分割メニュー) */}
    <div style={{ position: 'fixed', bottom: '0', left: '0', width: '100%', backgroundColor: '#fff', borderTop: '1px solid #ddd', padding: '10px 15px', boxSizing: 'border-box', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', gap: '10px', height: '56px' }}>
        
        <Link to="/receipts/report" style={{ flex: '1', textDecoration: 'none' }}>
        <button style={{
            width: '100%', height: '100%', backgroundColor: '#f8f8f8', color: '#111',
            border: '1px solid #ccc', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{ fontSize: '18px', marginBottom: '2px' }}>📊</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold' }}>レポート</div>
        </button>
        </Link>

        <Link to="/receipts/upload" style={{ flex: '2', textDecoration: 'none' }}>
        <button style={{
            width: '100%', height: '100%', backgroundColor: '#e60012', color: 'white',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            letterSpacing: '1px', boxShadow: '0 2px 4px rgba(230,0,18,0.2)'
        }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>＋ 登録</span>
        </button>
        </Link>

        <Link to="/categories" style={{ flex: '1', textDecoration: 'none' }}>
        <button style={{
            width: '100%', height: '100%', backgroundColor: '#f8f8f8', color: '#111',
            border: '1px solid #ccc', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{ fontSize: '18px', marginBottom: '2px' }}>🏷️</div>
            <div style={{ fontSize: '10px', fontWeight: 'bold' }}>カテゴリ</div>
        </button>
        </Link>

    </div>
    </div>

</div>
);
};

const cellStyle: React.CSSProperties = {
height: '70px',
display: 'flex',
flexDirection: 'column',
alignItems: 'center',
paddingTop: '8px',
boxSizing: 'border-box'
};