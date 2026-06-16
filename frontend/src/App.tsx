import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ReceiptsHome } from './pages/ReceiptsHome';
import { Receipts } from './pages/Receipts';
import { Categories } from './pages/Categories';
import { ReceiptsReport } from './pages/ReceiptsReport';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// @ts-ignore
import CalendarPage from './pages/CalendarPage';

const queryClient = new QueryClient();

function Home() {
  return (
    /* 背景を深いスレート（ネイビー系）にし、文字色を明るく設定 */
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 md:p-12 box-border">
      <div className="max-w-4xl mx-auto">
        
        {/* ヘッダーセクション */}
        <div className="mb-16 text-center mt-8 md:mt-12">
          {/* テキストにグラデーションを適用してスタイリッシュに */}
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
            My Life OS
          </h1>
          <p className="text-slate-400 text-sm md:text-base tracking-widest uppercase">
            Personal Data Integration System
          </p>
        </div>
        
        {/* メインナビゲーション（グリッド配置） */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. 家計簿システム（アクティブなカード） */}
          <Link to="/receipts" className="block group">
            <div className="h-full bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 transition-all duration-300 hover:bg-slate-800 hover:border-cyan-500/50 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)] hover:-translate-y-1 relative overflow-hidden">
              {/* ホバー時に左端に現れるアクセントライン */}
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="text-4xl mb-6">💰</div>
              <h2 className="text-xl font-bold text-white mb-2 tracking-wide">家計簿ダッシュボード</h2>
              <p className="text-slate-400 text-sm leading-relaxed">レシートのAI解析と支出の自動集計を行います。</p>
            </div>
          </Link>

          {/* 2. カレンダー（アクティブなカード） */}
          <Link to="/calendar" className="block group">
            <div className="h-full bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 transition-all duration-300 hover:bg-slate-800 hover:border-cyan-500/50 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)] hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="text-4xl mb-6">📅</div>
              <h2 className="text-xl font-bold text-white mb-2 tracking-wide">スケジュール管理</h2>
              <p className="text-slate-400 text-sm leading-relaxed">グループ共有カレンダーと予定管理を行います。</p>
            </div>
          </Link>

          {/* 3. TODO (準備中) */}
          <div className="h-full bg-slate-800/20 border border-slate-800 rounded-2xl p-8 cursor-not-allowed opacity-60">
            <div className="text-4xl mb-6 grayscale">✅</div>
            <h2 className="text-xl font-bold text-slate-300 mb-2 tracking-wide">タスクマネジメント</h2>
            <p className="text-slate-500 text-sm leading-relaxed">今後のフェーズで実装予定です。</p>
          </div>

        </div>

        {/* フッター */}
        <div className="mt-20 text-center text-slate-600 text-xs tracking-widest">
          &copy; 2026 My Life OS Project. All Rights Reserved.
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/receipts" element={<ReceiptsHome />} />
          <Route path="/receipts/upload" element={<Receipts />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/receipts/report" element={<ReceiptsReport />} />
          <Route path="/calendar" element={<CalendarPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;