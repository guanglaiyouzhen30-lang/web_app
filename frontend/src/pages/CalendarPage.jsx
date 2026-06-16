// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import jaLocale from '@fullcalendar/core/locales/ja';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, groupsApi, eventsApi, templatesApi } from '../services/calendarApi';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Users, 
  Copy, 
  Check, 
  Edit2, 
  Trash2, 
  X, 
  ChevronDown, 
  FileText, 
  User, 
  Clock, 
  FolderPlus, 
  Link,
  ChevronRight,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';

// 表示・シミュレーション用の固定アクターリスト
const MOCK_USERS = [
  { id: 1, name: "ヒロ（あなた）", email: "hiro@example.com", avatar: "ヒ" },
  { id: 2, name: "田中 アリス", email: "alice@example.com", avatar: "ア" },
  { id: 3, name: "ボブ・スミス", email: "bob@example.com", avatar: "ボ" },
];

// datetime-localインプット用に日付文字列を YYYY-MM-DDTHH:MM 形式にするヘルパー
const formatDateForInput = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const tzoffset = date.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
  return localISOTime;
};

export default function CalendarPage() {
  const queryClient = useQueryClient();

  // シミュレーション用の操作アクター
  const [currentUser, setCurrentUser] = useState(MOCK_USERS[0]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // アクティブなグループID管理
  const [activeGroupId, setActiveGroupId] = useState(null);

  // トースト状態
  const [toastMessage, setToastMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // モーダル表示状態
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [joinGroupModalOpen, setJoinGroupModalOpen] = useState(false);
  const [createTemplateModalOpen, setCreateTemplateModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [viewEventModalOpen, setViewEventModalOpen] = useState(false);

  // フォーム項目
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateDuration, setTemplateDuration] = useState(60);

  // 予定フォーム項目
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [eventEnd, setEventEnd] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventColor, setEventColor] = useState('#22d3ee');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const calendarRef = useRef(null);

  // トースト表示ヘルパー
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // 操作ユーザー切り替え時のJWT自動認証ログイン
  useEffect(() => {
    const username = currentUser.id === 1 ? 'hiro' : currentUser.id === 2 ? 'alice' : 'bob';
    setAuthInitialized(false);
    authApi.login(username, 'password123')
      .then(() => {
        setAuthInitialized(true);
        queryClient.invalidateQueries();
      })
      .catch((err) => {
        console.error("JWT認証失敗:", err);
        showToast("認証エラーが発生しました。");
      });
  }, [currentUser, queryClient]);

  // グループリストのクエリ取得
  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.list,
    enabled: authInitialized,
  });

  // ログインユーザー情報のクエリ取得
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
    enabled: authInitialized,
  });

  // グループ一覧ロード時、最初のグループを自動選択
  useEffect(() => {
    if (groups.length > 0 && (!activeGroupId || !groups.some(g => g.id === activeGroupId))) {
      setActiveGroupId(groups[0].id);
    }
  }, [groups, activeGroupId]);

  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0] || { name: 'スペース読込中...', invite_code: '', description: '', members_details: [] };
  const activeMembers = activeGroup.members_details || [];

  // 予定リストのクエリ取得
  const { data: serverEvents = [] } = useQuery({
    queryKey: ['events', activeGroupId],
    queryFn: () => eventsApi.list(activeGroupId),
    enabled: authInitialized && !!activeGroupId,
  });

  // テンプレートリストのクエリ取得
  const { data: serverTemplates = [] } = useQuery({
    queryKey: ['templates', activeGroupId],
    queryFn: () => templatesApi.list(activeGroupId),
    enabled: authInitialized && !!activeGroupId,
  });

  // ミューテーション: グループ作成
  const createGroupMutation = useMutation({
    mutationFn: groupsApi.create,
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setActiveGroupId(newGroup.id);
      showToast(`共有スペース「${newGroup.name}」を作成しました！`);
    },
    onError: (err) => {
      showToast(`作成エラー: ${err.response?.data?.error || '通信エラー'}`);
    }
  });

  // ミューテーション: グループへの参加
  const joinGroupMutation = useMutation({
    mutationFn: groupsApi.join,
    onSuccess: (joinedGroup) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setActiveGroupId(joinedGroup.id);
      showToast(`「${joinedGroup.name}」に参加しました！`);
    },
    onError: (err) => {
      showToast(err.response?.data?.error || '無効な招待コードです。');
    }
  });

  // ミューテーション: テンプレート作成
  const createTemplateMutation = useMutation({
    mutationFn: templatesApi.create,
    onSuccess: (newTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['templates', activeGroupId] });
      showToast(`テンプレート「${newTemplate.name}」を共有しました！`);
    },
    onError: (err) => {
      showToast(`作成エラー: ${err.response?.data?.error || '通信エラー'}`);
    }
  });

  // ミューテーション: 予定の作成
  const createEventMutation = useMutation({
    mutationFn: eventsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', activeGroupId] });
      showToast("カレンダーに新しい予定を追加しました！");
    },
    onError: (err) => {
      showToast(`作成エラー: ${err.response?.data?.detail || '通信エラー'}`);
    }
  });

  // ミューテーション: 予定の更新
  const updateEventMutation = useMutation({
    mutationFn: eventsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', activeGroupId] });
      showToast("予定を更新しました！");
    },
    onError: (err) => {
      showToast(`更新エラー: ${err.response?.data?.detail || '通信エラー'}`);
    }
  });

  // ミューテーション: 予定の削除
  const deleteEventMutation = useMutation({
    mutationFn: eventsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', activeGroupId] });
      showToast("予定を削除しました。");
    },
    onError: (err) => {
      showToast(`削除エラー: ${err.response?.data?.detail || '通信エラー'}`);
    }
  });

  // 招待コードのコピー
  const copyInviteCode = () => {
    if (!activeGroup.invite_code) return;
    navigator.clipboard.writeText(activeGroup.invite_code);
    setCopied(true);
    showToast("招待コードをクリップボードにコピーしました！");
    setTimeout(() => setCopied(false), 2000);
  };

  // 操作ユーザーの切り替え
  const handleUserChange = (user) => {
    setCurrentUser(user);
    setUserDropdownOpen(false);
  };

  // 共有スペースの作成処理
  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    createGroupMutation.mutate({ name: newGroupName, description: newGroupDesc });
    setNewGroupName('');
    setNewGroupDesc('');
    setCreateGroupModalOpen(false);
  };

  // 招待コード参加処理
  const handleJoinGroup = (e) => {
    e.preventDefault();
    if (!joinInviteCode.trim()) return;
    joinGroupMutation.mutate(joinInviteCode.trim());
    setJoinInviteCode('');
    setJoinGroupModalOpen(false);
  };

  // テンプレート共有処理
  const handleCreateTemplate = (e) => {
    e.preventDefault();
    if (!templateName.trim() || !templateTitle.trim()) return;
    createTemplateMutation.mutate({
      name: templateName,
      title_template: templateTitle,
      description_template: templateDesc,
      default_duration_minutes: parseInt(templateDuration) || 60,
      group: activeGroupId
    });
    setTemplateName('');
    setTemplateTitle('');
    setTemplateDesc('');
    setTemplateDuration(60);
    setCreateTemplateModalOpen(false);
  };

  // テンプレート内容をフォームに展開
  const applyTemplateToForm = (tempId) => {
    const temp = serverTemplates.find(t => t.id === parseInt(tempId));
    if (!temp) return;
    setEventTitle(temp.title_template);
    setEventDesc(temp.description_template);
    
    if (eventStart) {
      const startDate = new Date(eventStart);
      const endDate = new Date(startDate.getTime() + temp.default_duration_minutes * 60000);
      
      const tzoffset = endDate.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(endDate - tzoffset)).toISOString().slice(0, 16);
      setEventEnd(localISOTime);
    }
    showToast(`テンプレート「${temp.name}」を適用しました`);
  };

  // 日付セル選択時のダイアログ表示
  const handleDateSelect = (selectInfo) => {
    setEditingEventId(null);
    setSelectedTemplateId('');
    setEventTitle('');
    setEventDesc('');
    setEventColor('#22d3ee');
    
    let start = selectInfo.startStr;
    let end = selectInfo.endStr;
    if (selectInfo.allDay) {
      start = `${start}T10:00`;
      end = `${selectInfo.startStr}T11:00`;
    } else {
      start = start.slice(0, 16);
      end = end.slice(0, 16);
    }
    setEventStart(start);
    setEventEnd(end);
    setEventModalOpen(true);
  };

  // カレンダーの予定クリック時
  const handleEventClick = (clickInfo) => {
    const eventId = parseInt(clickInfo.event.id);
    const foundEvent = serverEvents.find(e => e.id === eventId);
    if (foundEvent) {
      setEditingEventId(foundEvent.id);
      setEventTitle(foundEvent.title);
      setEventStart(formatDateForInput(foundEvent.start_time));
      setEventEnd(formatDateForInput(foundEvent.end_time));
      setEventDesc(foundEvent.description || '');
      setEventColor(foundEvent.color || '#22d3ee');
      setSelectedTemplateId('');
      setViewEventModalOpen(true);
    }
  };

  // 予定の保存処理 (作成 / 編集)
  const handleSaveEvent = (e) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const eventData = {
      title: eventTitle,
      start_time: new Date(eventStart).toISOString(),
      end_time: new Date(eventEnd).toISOString(),
      description: eventDesc,
      color: eventColor,
      group: activeGroupId
    };

    if (editingEventId) {
      updateEventMutation.mutate({ id: editingEventId, ...eventData });
    } else {
      createEventMutation.mutate(eventData);
    }

    setEventModalOpen(false);
    setViewEventModalOpen(false);
  };

  // 予定の削除処理
  const handleDeleteEvent = () => {
    if (!editingEventId) return;
    deleteEventMutation.mutate(editingEventId);
    setViewEventModalOpen(false);
  };

  // テンプレートからカレンダーへ即時クイック追加処理
  const handleQuickApplyTemplate = (template) => {
    setSelectedTemplateId(template.id.toString());
    setEditingEventId(null);
    setEventTitle(template.title_template);
    setEventDesc(template.description_template);
    setEventColor('#22d3ee');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const datePart = tomorrow.toISOString().split('T')[0];
    const start = `${datePart}T10:00`;
    
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + template.default_duration_minutes * 60000);
    const tzoffset = endDate.getTimezoneOffset() * 60000;
    const end = (new Date(endDate - tzoffset)).toISOString().slice(0, 16);

    setEventStart(start);
    setEventEnd(end);
    setEventModalOpen(true);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f172a] text-slate-100 font-sans">
      
      {/* トースト表示 */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 border border-cyan-500/30 text-cyan-400 px-4 py-3 rounded-xl shadow-2xl pulse-glow animate-fade-in transition duration-300">
          <Sparkles className="w-4 h-4 animate-spin-slow" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 左サイドバー */}
      <aside className="w-80 flex flex-col bg-[#1e293b]/40 backdrop-blur-lg border-r border-slate-800/80 shrink-0">
        
        {/* ロゴ */}
        <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-600 to-cyan-400 rounded-xl shadow-lg shadow-cyan-500/20">
              <CalendarIcon className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-slate-50 to-slate-200 bg-clip-text text-transparent">ChronoShare</h1>
              <p className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-widest">API Connected</p>
            </div>
          </div>
        </div>

        {/* グループ切り替え＆コントロール */}
        <div className="p-4 border-b border-slate-800/40">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2 px-1">アクティブスペース</label>
          <div className="space-y-2">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGroupId(g.id)}
                className={`w-full text-left px-3.5 py-3 rounded-xl transition duration-200 flex items-center justify-between border ${
                  g.id === activeGroupId
                    ? 'bg-slate-800/80 border-cyan-500/40 text-cyan-400'
                    : 'bg-transparent border-transparent hover:bg-slate-800/30 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${g.id === activeGroupId ? 'bg-cyan-400 shadow-glow shadow-cyan-400/50' : 'bg-slate-600'}`} />
                  <span className="font-semibold text-sm truncate">{g.name}</span>
                </div>
                {g.id === activeGroupId && <ChevronRight className="w-4 h-4 shrink-0" />}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button 
              onClick={() => setCreateGroupModalOpen(true)}
              className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold bg-slate-880 hover:bg-slate-700/80 text-slate-300 rounded-xl transition duration-205 border border-slate-700/60"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              新規グループ
            </button>
            <button 
              onClick={() => setJoinGroupModalOpen(true)}
              className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold bg-slate-850 hover:bg-slate-800 text-cyan-400 rounded-xl transition duration-205 border border-cyan-500/20 hover:border-cyan-500/40"
            >
              <Link className="w-3.5 h-3.5" />
              コードで参加
            </button>
          </div>
        </div>

        {/* グループ詳細＆参加メンバー */}
        <div className="p-5 border-b border-slate-800/40 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">共有用 招待コード</span>
              <button 
                onClick={copyInviteCode}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-0.5 rounded-md hover:bg-cyan-500/10 transition"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                コピー
              </button>
            </div>
            <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl text-center font-mono text-sm tracking-widest text-slate-300 select-all">
              {activeGroup.invite_code || '------'}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                参加メンバー ({activeMembers.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {activeMembers.length === 0 ? (
                <span className="text-xs text-slate-500">メンバーデータがありません。</span>
              ) : (
                activeMembers.map((member) => (
                  <div 
                    key={member.id} 
                    title={member.email}
                    className="flex items-center gap-2 bg-slate-900/60 border border-slate-855 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 font-medium"
                  >
                    <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan-600 to-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">
                      {member.avatar}
                    </div>
                    <span>{member.first_name || member.username}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 共有予定テンプレート一覧 */}
        <div className="p-5 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3 h-3 text-cyan-400" />
              共有テンプレート
            </span>
            <button 
              onClick={() => setCreateTemplateModalOpen(true)}
              className="p-1 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 rounded-lg transition"
              title="テンプレートを追加"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5">
            {serverTemplates.length === 0 ? (
              <div className="text-center py-6 px-4 bg-slate-900/30 rounded-xl border border-dashed border-slate-800/80">
                <Info className="w-5 h-5 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">登録されているテンプレートはありません。</p>
              </div>
            ) : (
              serverTemplates.map((temp) => {
                const tempCreator = MOCK_USERS.find(u => u.id === temp.created_by);
                return (
                  <div 
                    key={temp.id}
                    className="p-3 bg-slate-900/40 border border-slate-800 hover:border-slate-700/80 rounded-xl transition group duration-200"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-slate-200 truncate pr-2" title={temp.name}>
                        {temp.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {tempCreator && (
                          <span 
                            className="w-4 h-4 rounded bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-[9px] border border-slate-700" 
                            title={`作成者: ${tempCreator.name}`}
                          >
                            {tempCreator.avatar}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-505 flex items-center gap-1 font-medium bg-slate-850 px-1.5 py-0.5 rounded">
                          <Clock className="w-2.5 h-2.5" />
                          {temp.default_duration_minutes}分
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mb-2">
                      {temp.title_template}
                    </p>
                    <button
                      onClick={() => handleQuickApplyTemplate(temp)}
                      className="w-full text-center py-1.5 bg-cyan-950/40 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-500/10 hover:border-cyan-400 text-cyan-400 text-[10px] font-bold rounded-lg transition-all duration-200"
                    >
                      予定をクイック作成
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </aside>

      {/* メインカレンダーエリア */}
      <main className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-[#0f172a] via-[#111827] to-[#0f172a]">
        
        {/* トップヘッダー */}
        <header className="h-20 border-b border-slate-800/60 flex items-center justify-between px-8 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-50">{activeGroup.name}</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-cyan-400 rounded-full border border-slate-700/50">
                共有スペース
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5 max-w-lg">{activeGroup.description || 'グループの説明はありません。'}</p>
          </div>

          {/* 操作ユーザーシミュレーター */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-3 bg-slate-900/60 border border-slate-855 px-4 py-2.5 rounded-xl hover:bg-slate-800/50 transition duration-200 text-left"
            >
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center text-xs text-slate-950 font-bold">
                {me?.avatar || currentUser.avatar}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold leading-none text-slate-200">{me?.first_name || me?.username || currentUser.name}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{me?.email || currentUser.email}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-2 overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">操作ユーザーを切り替え</p>
                </div>
                {MOCK_USERS.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserChange(user)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition duration-150 flex items-center justify-between ${
                      user.id === currentUser.id 
                        ? 'bg-cyan-500/10 text-cyan-400' 
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span>{user.name}</span>
                    {user.id === currentUser.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* カレンダー表示エリア */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="glass-panel p-6 rounded-2xl shadow-2xl shadow-black/40 border border-slate-855 flex flex-col min-h-[780px]">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              initialDate="2026-06-14"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              locales={[jaLocale]}
              locale="ja"
              events={serverEvents.map(e => ({
                id: e.id.toString(),
                title: e.title,
                start: e.start_time,
                end: e.end_time,
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                extendedProps: {
                  description: e.description,
                  createdBy: e.created_by,
                  color: e.color || '#22d3ee'
                }
              }))}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={false}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventContent={(eventInfo) => {
                const createdById = eventInfo.event.extendedProps.createdBy;
                const color = eventInfo.event.extendedProps.color || '#22d3ee';
                const creator = MOCK_USERS.find(u => u.id === createdById);
                const bgStyle = {
                  backgroundColor: `${color}1a`, // Hex plus 10% opacity
                  borderLeft: `3px solid ${color}`,
                  color: color
                };
                return (
                  <div 
                    className="flex items-center gap-1.5 text-xs overflow-hidden truncate w-full py-1.5 px-2 rounded font-medium"
                    style={bgStyle}
                  >
                    {creator && (
                      <span 
                        className="w-3.5 h-3.5 rounded bg-slate-900/60 text-slate-100 font-bold flex items-center justify-center text-[8px] border border-white/10 shrink-0" 
                        title={`作成者: ${creator.name}`}
                      >
                        {creator.avatar}
                      </span>
                    )}
                    <span className="font-semibold truncate">{eventInfo.event.title}</span>
                  </div>
                );
              }}
              height="auto"
            />
          </div>
        </div>

      </main>

      {/* 予定新規追加モーダル */}
      {eventModalOpen && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up">
            
            <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-50 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-cyan-400" />
                予定の追加
              </h3>
              <button 
                onClick={() => setEventModalOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
              
              {/* 操作ユーザーインジケーター */}
              <div className="bg-slate-900/40 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">予定の作成者</span>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-955">
                    {me?.avatar || currentUser.avatar}
                  </div>
                  <span className="text-xs font-semibold text-slate-350">{me?.first_name || me?.username || currentUser.name}</span>
                </div>
              </div>

              {/* テンプレート適用 */}
              {serverTemplates.length > 0 && (
                <div className="bg-slate-900/50 border border-slate-800 p-3.5 rounded-xl">
                  <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mb-1.5">
                    共有テンプレートから自動入力
                  </label>
                  <div className="relative">
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => {
                        setSelectedTemplateId(e.target.value);
                        applyTemplateToForm(e.target.value);
                      }}
                      className="w-full bg-slate-900 border border-slate-855 text-slate-200 text-xs rounded-lg p-2.5 pr-8 focus:ring-1 focus:ring-cyan-500 focus:outline-none appearance-none"
                    >
                      <option value="">-- テンプレートを選択する --</option>
                      {serverTemplates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.default_duration_minutes}分)</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 px-1">予定タイトル</label>
                <input
                  type="text"
                  required
                  placeholder="例：進捗ミーティング..."
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 px-1">開始日時</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 px-1">終了日時</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 px-1">説明 / メモ</label>
                <textarea
                  placeholder="アジェンダ、開催場所、Web会議 of リンクなど..."
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  rows="3"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition font-sans"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5 px-1">ハイライトカラー</label>
                <div className="flex gap-2">
                  {['#22d3ee', '#38bdf8', '#818cf8', '#a78bfa', '#f472b6', '#34d399'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setEventColor(col)}
                      className={`w-8 h-8 rounded-full border-2 transition ${
                        eventColor === col ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-755 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-505 hover:bg-cyan-400 text-slate-955 text-xs font-bold transition shadow-lg shadow-cyan-500/20"
                >
                  予定を作成
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 予定詳細確認 / 編集モーダル */}
      {viewEventModalOpen && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up">
            
            <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-50 flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                予定の詳細
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDeleteEvent}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  title="予定を削除する"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
                <button 
                  onClick={() => setViewEventModalOpen(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
              
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 px-1">予定タイトル</label>
                <input
                  type="text"
                  required
                  placeholder="タイトルを入力してください..."
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 px-1">開始日時</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 px-1">終了日時</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 px-1">説明 / メモ</label>
                <textarea
                  placeholder="アジェンダ、開催場所、Web会議のリンクなど..."
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  rows="4"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition font-sans"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5 px-1">ハイライトカラー</label>
                <div className="flex gap-2">
                  {['#22d3ee', '#38bdf8', '#818cf8', '#a78bfa', '#f472b6', '#34d399'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setEventColor(col)}
                      className={`w-8 h-8 rounded-full border-2 transition ${
                        eventColor === col ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              {/* 予定作成者 */}
              {editingEventId && (() => {
                const eventCreator = MOCK_USERS.find(u => u.id === (serverEvents.find(ev => ev.id === editingEventId)?.created_by));
                if (!eventCreator) return null;
                return (
                  <div className="bg-slate-900/50 border border-slate-805 p-3 rounded-xl flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">予定の作成者</span>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                        {eventCreator.avatar}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-200">{eventCreator.name}</span>
                        {eventCreator.id === (me?.id || currentUser.id) && (
                          <span className="text-[9px] text-cyan-400 font-bold bg-cyan-950/40 border border-cyan-800/30 px-1.5 py-0.2 rounded-md">あなた</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button
                  type="button"
                  onClick={() => setViewEventModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-755 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-slate-950 text-xs font-bold transition"
                >
                  変更を保存
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 新規テンプレート共有モーダル */}
      {createTemplateModalOpen && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up">
            
            <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-50 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                新規テンプレートを共有
              </h3>
              <button 
                onClick={() => setCreateTemplateModalOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="p-6 space-y-4">
              
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 px-1">テンプレート名 (管理用)</label>
                <input
                  type="text"
                  required
                  placeholder="例：週次ミーティング、夕礼など"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 px-1">予定のデフォルトタイトル</label>
                <input
                  type="text"
                  required
                  placeholder="例：週次進捗同期ミーティング 🔄"
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 px-1">所要時間 (分)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={templateDuration}
                    onChange={(e) => setTemplateDuration(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                  />
                </div>
                <div className="flex items-end text-xs text-slate-400 pb-3 font-medium">
                  分（予定の初期所要時間）
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 px-1">説明のデフォルトテンプレート</label>
                <textarea
                  placeholder="例：あらかじめ登録しておきたいチェックリストやアジェンダ等..."
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  rows="4"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button
                  type="button"
                  onClick={() => setCreateTemplateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-755 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-cyan-500/20"
                >
                  テンプレートを保存
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 共有スペース新規作成モーダル */}
      {createGroupModalOpen && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up">
            
            <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-50 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-cyan-400" />
                共有スペースを作成
              </h3>
              <button 
                onClick={() => setCreateGroupModalOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 px-1">スペース名</label>
                <input
                  type="text"
                  required
                  placeholder="例：デザイン分科会、経営会議..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 px-1">説明</label>
                <textarea
                  placeholder="スペースの目的や対象メンバーを簡潔に入力してください..."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  rows="3"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button
                  type="button"
                  onClick={() => setCreateGroupModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-755 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-cyan-500/20"
                >
                  スペースを作成
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 招待コード参加モーダル */}
      {joinGroupModalOpen && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up">
            
            <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-50 flex items-center gap-2">
                <Link className="w-5 h-5 text-cyan-400" />
                共有スペースに参加
              </h3>
              <button 
                onClick={() => setJoinGroupModalOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJoinGroup} className="p-6 space-y-4">
              
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1 px-1">招待コード</label>
                <input
                  type="text"
                  required
                  placeholder="例：DEV-SYNC-88"
                  value={joinInviteCode}
                  onChange={(e) => setJoinInviteCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-center text-sm font-mono tracking-widest rounded-xl p-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition uppercase"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button
                  type="button"
                  onClick={() => setJoinGroupModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-755 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-cyan-500/20"
                >
                  参加する
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
