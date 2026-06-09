import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ReceiptsHome } from './pages/ReceiptsHome';  // 家計簿ダッシュボード
import { Receipts } from './pages/Receipts';          // アップロード画面
import { Categories } from './pages/Categories';      // カテゴリ設定画面
import { ReceiptsReport } from './pages/ReceiptsReport';

function Home() {
  return (
    <div style={{ 
      padding: '60px 20px', 
      maxWidth: '800px', 
      margin: '0 auto', 
      fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif',
      color: '#111',
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>
      {/* コーポレートアイデンティティを象徴するヘッダーセクション */}
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '40px 30px', 
        textAlign: 'center',
        border: '1px solid #e5e5e5',    // ① まず全体の枠線を細いグレーで引く
        borderTop: '6px solid #e60012', // ② 上の線だけ太い赤で「上書き」する
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        marginBottom: '40px'
      }}>
        <h1 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '28px', 
          fontWeight: 'bold', 
          letterSpacing: '3px',
          color: '#111'
        }}>
          My Life OS
        </h1>
        <p style={{ 
          margin: '0', 
          fontSize: '14px', 
          color: '#666', 
          letterSpacing: '1px' 
        }}>
          パーソナルデータの統合一元管理システム
        </p>
      </div>
      
      {/* メインナビゲーション（グリッド配置） */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '20px',
        marginBottom: '40px'
      }}>
        
        {/* 1. 家計簿システム */}
        <Link to="/receipts" style={{ textDecoration: 'none' }}>
          <button style={{ 
            ...buttonBaseStyle,
            backgroundColor: '#fff', 
            color: '#111', 
            border: '1px solid #ddd',
            borderLeft: '4px solid #e60012', // ボタンの左側に赤いアクセントライン
          }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>💰</div>
            <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '1px' }}>家計簿ダッシュボード</div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>レシート自動解析・支出集計</div>
          </button>
        </Link>

        {/* 3. カレンダー (準備中) */}
        <button disabled style={{ 
          ...buttonBaseStyle,
          backgroundColor: '#eaeaea', 
          color: '#999', 
          border: '1px solid #d5d5d5',
          cursor: 'not-allowed'
        }}>
          <div style={{ fontSize: '20px', marginBottom: '8px', opacity: 0.5 }}>📅</div>
          <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '1px' }}>スケジュール管理</div>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>今後のフェーズで実装予定</div>
        </button>

        {/* 4. TODO (準備中) */}
        <button disabled style={{ 
          ...buttonBaseStyle,
          backgroundColor: '#eaeaea', 
          color: '#999', 
          border: '1px solid #d5d5d5',
          cursor: 'not-allowed'
        }}>
          <div style={{ fontSize: '20px', marginBottom: '8px', opacity: 0.5 }}>✅</div>
          <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '1px' }}>タスクマネジメント</div>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>今後のフェーズで実装予定</div>
        </button>

      </div>

      {/* フッター */}
      <div style={{ textAlign: 'center', fontSize: '12px', color: '#999', letterSpacing: '1px' }}>
        &copy; 2026 My Life OS Project. All Rights Reserved.
      </div>
    </div>
  );
}

// ボタンの共通スタイル（シャープな長方形、均一な余白）
const buttonBaseStyle: React.CSSProperties = {
  width: '100%',
  padding: '25px 20px',
  textAlign: 'left', // コーポレートサイト風に左寄せ
  border: 'none',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* 家計簿関連のルーティング */}
        <Route path="/receipts" element={<ReceiptsHome />} />         {/* ダッシュボード */}
        <Route path="/receipts/upload" element={<Receipts />} />      {/* 登録画面 */}
        <Route path="/categories" element={<Categories />} />         {/* マスタ管理 */}
        <Route path="/receipts/report" element={<ReceiptsReport />} /> {/* レポート分析 */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;