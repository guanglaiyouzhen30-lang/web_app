import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
daily_data: { [key: string]: DailyData };
}

export const ReceiptsHome: React.FC = () => {
const today = new Date();
const [year, setYear] = useState(today.getFullYear());
const [month, setMonth] = useState(today.getMonth() + 1);
const [selectedDate, setSelectedDate] = useState<number | null>(today.getDate());

const [summary, setSummary] = useState<SummaryResponse | null>(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
const fetchSummary = async () => {
    setIsLoading(true);
    try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/receipts/summary/?year=${year}&month=${month}`);
    
    if (!response.ok) {
        setSummary({ year, month, monthly_total: 0, daily_data: {} });
        return;
    }
    
    const data = await response.json();
    setSummary(data);
    } catch (error) {
    console.error(error);
    // 👇 ネットワークエラーなどの場合も画面をリセットする
    setSummary({ year, month, monthly_total: 0, daily_data: {} });
    } finally {
    setIsLoading(false);
    }
};
fetchSummary();
}, [year, month]);

const handlePrevMonth = () => {
if (month === 1) {

    setYear(year - 1);
    setMonth(12);
} else {
    setMonth(month - 1);
}
setSelectedDate(null);
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
return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 font-sans tracking-widest text-sm">
    <div className="animate-pulse">LOADING DATA...</div>
    </div>
);
}

const daysInMonth = new Date(year, month, 0).getDate();
const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

// 空白セルの生成
const emptyCells = Array.from({ length: firstDayOfWeek }).map((_, i) => (
<div key={`empty-${i}`} className="h-20 border-b border-r border-slate-800/30"></div>
));

// 日付セルの生成
const dayCells = Array.from({ length: daysInMonth }).map((_, i) => {
const day = i + 1;
const dayData = summary?.daily_data[String(day)];
const isSelected = selectedDate === day;

return (
    <div 
    key={day} 
    onClick={() => setSelectedDate(day)}
    className={`h-20 p-2 flex flex-col justify-between border-b border-r border-slate-800/50 cursor-pointer transition-all duration-200 select-none
        ${isSelected 
        ? 'bg-cyan-500/10 relative after:absolute after:inset-0 after:border after:border-cyan-500/60 after:rounded-lg' 
        : 'hover:bg-slate-800/40'
        }`}
    >
    <div className={`w-6 h-6 flex items-center justify-center text-xs rounded font-medium tracking-tighter
        ${isSelected ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
    >
        {day}
    </div>
    <div className={`text-[11px] font-bold text-right tracking-tight transition-colors
        ${isSelected ? 'text-cyan-400' : 'text-slate-200'}`}
    >
        {dayData ? `¥${dayData.total.toLocaleString()}` : ''}
    </div>
    </div>
);
});

const selectedData = selectedDate ? summary?.daily_data[String(selectedDate)] : null;

return (
<div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-32 box-border selection:bg-cyan-500/30">
    <div className="max-w-2xl mx-auto px-4 pt-8">
        <div className="mb-4">
        <Link to="/" className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-white transition-all tracking-widest uppercase bg-slate-800/50 hover:bg-slate-700/50 px-4 py-2.5 rounded-xl border border-slate-700/50 hover:border-cyan-500/50 shadow-sm">
        <span className="text-base mr-2 opacity-80">🏠</span>
        My Life OS Portal
        </Link>
    </div>
    
    {/* 1. 高級感のあるグラスモーフィズムヘッダー */}
    <div className="relative bg-slate-800/40 backdrop-blur-md border border-slate-700/30 rounded-2xl p-6 mb-6 shadow-xl">

        <div className="flex justify-between items-center mb-6 mt-4">
        <button onClick={handlePrevMonth} className="text-xs font-bold text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/30 transition-all select-none">&lt; PREV</button>
        <h2 className="text-xl font-bold tracking-widest text-white">{year} / {String(month).padStart(2, '0')}</h2>
        <button onClick={handleNextMonth} className="text-xs font-bold text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/30 transition-all select-none">NEXT &gt;</button>
        </div>
        
        <div className="text-center">
        <div className="text-xs text-slate-400 mb-1 tracking-widest uppercase">Monthly Total Expenditure</div>
        <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-mono">
            <span className="text-lg mr-1 text-slate-300 font-sans font-normal">¥</span>
            {summary?.monthly_total ? summary.monthly_total.toLocaleString() : '0'}
        </div>
        </div>
    </div>

    {/* 2. ミニマルでシャープなカレンダーエリア */}
    <div className="bg-slate-800/20 border border-slate-800/60 rounded-2xl p-4 mb-8 shadow-inner">
        <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider pb-3 mb-2 border-b border-slate-800">
        <div className="text-rose-400/80">SUN</div>
        <div>MON</div>
        <div>TUE</div>
        <div>WED</div>
        <div>THU</div>
        <div>FRI</div>
        <div className="text-cyan-400/80">SAT</div>
        </div>
        <div className="grid grid-cols-7 border-t border-l border-slate-800/50 rounded-lg overflow-hidden bg-slate-900/30">
        {emptyCells}
        {dayCells}
        </div>
    </div>

    {/* 3. 洗練された明細リスト */}
    {selectedDate && (
        <div className="mb-12 animate-fadeIn">
        <div className="text-sm font-bold mb-4 text-slate-300 tracking-wide flex items-center">
            <div className="w-1.5 h-4 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full mr-3"></div>
            {month}月{selectedDate}日 の明細
        </div>
        
        {selectedData ? (
            <div className="flex flex-col gap-3">
            {selectedData.items.map((item, idx) => (
                <div key={idx} className="flex items-center bg-slate-800/30 backdrop-blur-sm border border-slate-800 rounded-xl p-4 transition-all hover:border-slate-700/60">
                <div className="flex-1 min-w-0 pr-4">
                    <div className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded inline-block mb-1.5">
                    {item.category}
                    </div>
                    <div className="text-sm font-bold text-slate-200 truncate">{item.name}</div>
                </div>
                <div className="text-base font-bold text-slate-100 font-mono whitespace-nowrap">
                    ¥{item.price.toLocaleString()}
                </div>
                </div>
            ))}
            </div>
        ) : (
            <div className="text-center py-10 text-xs text-slate-500 bg-slate-800/10 border border-dashed border-slate-800 rounded-xl tracking-wider">
            NO DATA RECORDED
            </div>
        )}
        </div>
    )}

    {/* 4. 浮遊感のある未来的ボトムナビゲーション */}
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-slate-950/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-2 box-border shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50">
        <div className="flex gap-2 h-12">
        
        <Link to="/receipts/report" className="flex-1 min-w-0">
            <button className="w-full h-full bg-transparent hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 border-none rounded-xl cursor-pointer flex flex-col items-center justify-center transition-all">
            <span className="text-lg mb-0.5">📊</span>
            <span className="text-[9px] font-bold tracking-widest uppercase">Report</span>
            </button>
        </Link>

        <Link to="/receipts/upload" className="flex-[1.5] min-w-0">
            <button className="w-full h-full bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 font-extrabold border-none rounded-xl cursor-pointer flex items-center justify-center tracking-widest shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98]">
            ＋ SCAN RECEIPT
            </button>
        </Link>

        <Link to="/categories" className="flex-1 min-w-0">
            <button className="w-full h-full bg-transparent hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 border-none rounded-xl cursor-pointer flex flex-col items-center justify-center transition-all">
            <span className="text-lg mb-0.5">🏷️</span>
            <span className="text-[9px] font-bold tracking-widest uppercase">Category</span>
            </button>
        </Link>

        </div>
    </div>

    </div>
</div>
);
};