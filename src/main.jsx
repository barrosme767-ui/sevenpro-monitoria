import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './supabase';
import './estilos.css';
import {
  ChevronDown, ShieldCheck, Settings, CircleHelp, Menu, Bell, LogOut,
  CircleAlert, LockKeyhole, LayoutDashboard, PhoneCall, Users, TriangleAlert,
  FileBarChart, Search, RefreshCw, Wifi, WifiOff, X, Clock, CheckCircle2,
  AlertTriangle, Headphones, UserCog, Eye, EyeOff
} from 'lucide-react';

const nav = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'calls', label: 'Chamadas', icon: PhoneCall },
  { id: 'operators', label: 'Operadores', icon: Users },
  { id: 'alerts', label: 'Alertas', icon: TriangleAlert, badge: null },
  { id: 'reports', label: 'Relatórios', icon: FileBarChart },
];

function BrandMark({ large = false }) {
  return <div className={`brand-mark${large ? ' large' : ''}`}>S</div>;
}

function Login({ login, setLogin, password, setPassword, onSubmit, error, loading, configured }) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="login-page">
      <section className="login-left">
        <div className="login-brand">
          <BrandMark />
          <div><div className="brand-name">SEVENPRO</div><div className="brand-sub">MONITORIA INTELIGENTE</div></div>
        </div>
        <div className="login-pitch">
          <div className="eyebrow"><span /> PLATAFORMA CORPORATIVA</div>
          <h1>Qualidade em cada <span>conversa.</span></h1>
          <p>Centralize a monitoria, acompanhe indicadores e transforme cada atendimento em uma oportunidade de evolução.</p>
          <div className="login-feature-list">
            <div><span><Headphones size={19} /></span><div><b>Monitoria organizada</b><small>Chamadas e avaliações em um só lugar.</small></div></div>
            <div><span><ShieldCheck size={19} /></span><div><b>Acesso protegido</b><small>Permissões conforme o perfil de cada usuário.</small></div></div>
          </div>
        </div>
        <div className="login-left-footer">SEVENPRO <span>•</span> ME7 PROMOTORA</div>
        <div className="login-decoration" /><div className="login-decoration decor-two" />
      </section>
      <section className="login-right">
        <div className="mobile-login-brand"><BrandMark /><div><div className="brand-name">SEVENPRO</div><div className="brand-sub">MONITORIA INTELIGENTE</div></div></div>
        <div className="login-form-wrap">
          <div className="form-heading"><div className="form-kicker">BEM-VINDO DE VOLTA</div><h2>Acesse sua conta</h2><p>Entre com suas credenciais corporativas.</p></div>
          {!configured && <div className="notice warning"><AlertTriangle size={17} /><div><b>Configuração pendente</b><p>Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente do Netlify.</p></div></div>}
          {error && <div className="login-error"><CircleAlert size={16} />{error}</div>}
          <form onSubmit={onSubmit}>
            <label htmlFor="email">E-mail corporativo</label>
            <div className="input-wrap"><Users size={16} /><input id="email" type="email" autoComplete="username" placeholder="seu.email@empresa.com" value={login} onChange={e => setLogin(e.target.value)} required /></div>
            <label htmlFor="password">Senha</label>
            <div className="input-wrap"><LockKeyhole size={16} /><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Digite sua senha" value={password} onChange={e => setPassword(e.target.value)} required /><button type="button" className="icon-button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
            <div className="form-options"><span><ShieldCheck size={12} /> Conexão protegida</span><span>Use seu acesso cadastrado</span></div>
            <button className="primary-button login-submit" type="submit" disabled={loading || !configured}>{loading ? 'Entrando...' : 'Entrar na plataforma'} <ChevronDown size={15} style={{ transform: 'rotate(-90deg)' }} /></button>
          </form>
          <div className="login-divider"><span /><small>ACESSO CORPORATIVO</small><span /></div>
          <div className="login-help"><CircleHelp size={19} /><div><b>Precisa de acesso?</b><p>Entre em contato com a Diretoria da ME7 para cadastrar ou liberar sua conta.</p></div></div>
          <p className="login-legal">O acesso é monitorado e depende das permissões vinculadas ao seu perfil.</p>
        </div>
        <div className="login-right-footer">© 2026 SEVENPRO MONITORIA</div>
      </section>
    </div>
  );
}

function PageTitle({ eyebrow = 'SEVENPRO MONITORIA', title, subtitle, children }) {
  return <div className="page-title-row"><div><div className="section-eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{children && <div className="title-actions">{children}</div>}</div>;
}
function EmptyState({ icon: Icon = PhoneCall, title, text }) {
  return <div className="empty-state" style={{ padding: '44px 20px' }}><Icon size={28} style={{ display: 'block', margin: '0 auto 12px', opacity: .65 }} /><b style={{ display: 'block', color: '#ddd', marginBottom: 7 }}>{title}</b><span>{text}</span></div>;
}
function Overview({ setPage }) {
  return <>
    <PageTitle title="Visão geral" subtitle="Resumo da operação de monitoria e qualidade." />
    <div className="notice info"><CircleAlert size={18} /><div><b>Dados aguardando integração</b><p>A estrutura visual está pronta, mas os indicadores reais serão exibidos quando a fonte de dados da monitoria estiver configurada.</p></div></div>
    <div className="metrics-grid">
      {[['Chamadas monitoradas','—',PhoneCall,'red'],['Operadores ativos','—',Users,'purple'],['Alertas pendentes','—',TriangleAlert,'amber'],['Qualidade média','—',CheckCircle2,'green']].map(([label,value,Icon,color]) => <div className="metric-card" key={label}><div className="metric-top"><span>{label}</span><span className={`metric-icon ${color}`}><Icon size={18}/></span></div><div className="metric-value">{value}</div><div className="metric-bottom">Aguardando conexão com os dados</div></div>)}
    </div>
    <div className="dashboard-grid">
      <section className="panel quality-panel"><div className="panel-heading"><div><h3>Monitoria de chamadas</h3><p>Visão geral das avaliações registradas</p></div></div><EmptyState title="Nenhum dado carregado" text="Conecte a fonte de chamadas para exibir o histórico e os indicadores." /></section>
      <section className="panel alerts-panel"><div className="panel-heading"><div><h3>Alertas recentes</h3><p>Acompanhamento de ocorrências</p></div><button className="text-button" onClick={() => setPage('alerts')}>Ver alertas</button></div><EmptyState icon={ShieldCheck} title="Sem alertas disponíveis" text="Os alertas aparecerão aqui quando houver dados integrados." /></section>
    </div>
    <section className="panel recent-panel"><div className="panel-heading"><div><h3>Chamadas recentes</h3><p>Registros mais recentes da monitoria</p></div><button className="text-button" onClick={() => setPage('calls')}>Abrir chamadas →</button></div><EmptyState title="Nenhuma chamada para exibir" text="Nenhuma chamada foi carregada. Os dados não serão inventados." /></section>
  </>;
}
function Calls({ search, setSearch, filter, setFilter }) {
  return <>
    <PageTitle title="Chamadas" subtitle="Pesquise e acompanhe as chamadas monitoradas." />
    <section className="panel calls-panel">
      <div className="filter-toolbar"><div className="search-box"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar por ID, operador ou equipe..." /></div><label className="filter-select"><span>Status</span><select value={filter} onChange={e => setFilter(e.target.value)}><option>Todas</option><option>Revisão necessária</option><option>Aprovado</option><option>Em análise</option></select></label><button className="secondary-button" onClick={() => {setSearch('');setFilter('Todas');}}><RefreshCw size={14}/> Limpar</button></div>
      <EmptyState title="Nenhuma chamada encontrada" text="A tela está pronta para receber dados, mas ainda não existe uma fonte de chamadas configurada." />
    </section>
  </>;
}
function Operators() {
  return <><PageTitle title="Operadores" subtitle="Acompanhamento dos operadores monitorados." /><section className="panel"><EmptyState icon={Users} title="Dados de operadores indisponíveis" text="A lista será exibida após a configuração da fonte de dados e das permissões." /></section></>;
}
function Alerts() {
  return <><PageTitle title="Alertas" subtitle="Ocorrências e itens que precisam de acompanhamento." /><section className="panel"><EmptyState icon={TriangleAlert} title="Nenhum alerta carregado" text="Não há registros disponíveis para mostrar neste momento." /></section></>;
}
function Reports() {
  return <><PageTitle title="Relatórios" subtitle="Consulte os indicadores e resultados da monitoria." /><section className="panel report-placeholder"><div className="report-icon"><FileBarChart size={24}/></div><h3>Relatórios aguardando dados</h3><p>Os relatórios serão habilitados quando a base de chamadas e avaliações estiver conectada. Nenhum resultado fictício será apresentado.</p></section></>;
}
function UserManagement() {
  return <><PageTitle title="Gestão de usuários" subtitle="O cadastro e as permissões dependem da tabela de perfis no Supabase." /><div className="notice info"><UserCog size={18}/><div><b>Controle de acesso ativo</b><p>O sistema consulta o perfil autenticado em <code>profiles</code>. A edição de usuários ainda precisa de uma rotina administrativa segura antes de ser habilitada.</p></div></div><section className="panel"><EmptyState icon={Users} title="Gerenciamento de usuários não configurado" text="Para evitar alterações indevidas, esta versão não cria nem altera usuários automaticamente." /></section></>;
}
function Restricted() {
  return <div className="panel restricted"><div className="restricted-icon"><LockKeyhole size={24}/></div><h3>Acesso restrito</h3><p>Seu perfil não tem permissão para acessar esta área. Se precisar de acesso, solicite à Diretoria.</p></div>;
}
function SettingsPage({ argusStatus, onTestArgus, session }) {
  return <>
    <PageTitle title="Configurações" subtitle="Estado das integrações e do ambiente." />
    <div className="settings-grid">
      <div className="panel setting-card"><div className="setting-icon"><ShieldCheck size={20}/></div><h3>Supabase</h3><p>Autenticação e consulta do perfil conectado.</p><div className="setup-status"><i/> Autenticação utilizada nesta sessão</div></div>
      <div className="panel setting-card"><div className="setting-icon"><Headphones size={20}/></div><h3>Argus</h3><p>Teste a função de consulta de campanhas configurada no Netlify.</p><button className="secondary-button" onClick={onTestArgus} disabled={argusStatus.loading}>{argusStatus.loading ? <RefreshCw size={14}/> : <Wifi size={14}/>} {argusStatus.loading ? 'Testando...' : 'Testar conexão'}</button><div className="setup-status"><i style={{background:argusStatus.connected ? '#3bc98b' : '#e8ad50'}}/> {argusStatus.message}</div></div>
      <div className="panel setting-card"><div className="setting-icon"><LockKeyhole size={20}/></div><h3>Permissões</h3><p>O acesso administrativo é concedido conforme o perfil registrado no Supabase.</p><div className="setup-status"><i/> Perfil: Diretoria</div></div>
    </div>
    <div className="notice warning"><AlertTriangle size={18}/><div><b>Integração de gravações</b><p>A consulta de campanhas é testada por esta tela. A listagem de gravações ainda requer a função e o formato de resposta confirmados do Argus.</p></div></div>
  </>;
}

function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState('overview');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todas');
  const [mobileNav, setMobileNav] = useState(false);
  const [realData, setRealData] = useState(null);
  const [dataError, setDataError] = useState('');
  const [argusStatus, setArgusStatus] = useState({loading:false, connected:false, message:'Conexão ainda não testada.'});
  const [argusCampaigns, setArgusCampaigns] = useState([]);

  useEffect(() => {
    let mounted = true;
    if (!supabase) { setAuthReady(true); return undefined; }
    supabase.auth.getSession().then(({data,error}) => {
      if (!mounted) return;
      if (error) setLoginError('Não foi possível recuperar a sessão.');
      setSession(data?.session ?? null);
      setAuthReady(true);
    }).catch(() => {
      if (mounted) { setLoginError('Falha ao verificar a sessão. Confira a configuração do Supabase.'); setAuthReady(true); }
    });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setRealData(null);
      setDataError('');
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      setRealData(null); setDataError('');
      if (!session || !supabase) return;
      try {
        const {data,error} = await supabase.from('profiles').select('display_name, role, manager_id, supervisor_id, active').eq('id',session.user.id).single();
        if (cancelled) return;
        if (error || !data) { setDataError('Não foi possível carregar seu perfil. Confira o cadastro na tabela profiles e as permissões (RLS) do Supabase.'); return; }
        if (!data.active) { setLoginError('Conta desativada. Entre em contato com a Diretoria.'); await supabase.auth.signOut(); return; }
        setRealData(data);
      } catch {
        if (!cancelled) setDataError('Falha ao consultar o perfil. Tente novamente.');
      }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, [session]);

  async function checkArgus() {
    if (!session || !realData || realData.role !== 'director' || !realData.active) {
      setArgusStatus({loading:false,connected:false,message:'A consulta está disponível somente para a Diretoria.'});
      setArgusCampaigns([]);
      return;
    }
    setArgusStatus({loading:true,connected:false,message:'Testando a conexão com o Argus...'});
    try {
      const response = await fetch('/.netlify/functions/argus-list-campaigns',{method:'GET',headers:{Authorization:'Bearer '+session.access_token}});
      let result;
      try { result = await response.json(); } catch { throw new Error('O servidor retornou uma resposta inválida.'); }
      if (!response.ok) throw new Error(result?.error || `Falha na consulta ao Argus. Código HTTP: ${response.status}`);
      const payload = result?.data ?? result;
      const campaigns = Array.isArray(payload?.campanhas) ? payload.campanhas : Array.isArray(payload?.data?.campanhas) ? payload.data.campanhas : [];
      setArgusCampaigns(campaigns);
      setArgusStatus({loading:false,connected:true,message:campaigns.length ? `Conexão validada. ${campaigns.length} campanha(s) retornada(s).` : 'O servidor respondeu, mas nenhuma campanha foi retornada.'});
    } catch(error) {
      setArgusStatus({loading:false,connected:false,message:error?.message || 'Não foi possível consultar o servidor do Argus.'});
      setArgusCampaigns([]);
    }
  }

  async function handleLogin(event) {
    event.preventDefault(); setLoginError('');
    if (!supabase) { setLoginError('O sistema ainda não foi configurado. Confira VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Netlify.'); return; }
    setLoading(true);
    try {
      const {error} = await supabase.auth.signInWithPassword({email:login.trim(),password});
      if (error) setLoginError('Não foi possível entrar. Confira suas credenciais ou procure a Diretoria.');
    } catch { setLoginError('Falha de conexão durante o login.'); }
    finally { setLoading(false); }
  }
  async function logout() {
    if (supabase) await supabase.auth.signOut();
    setSession(null); setRealData(null); setArgusCampaigns([]); setDataError('');
  }

  if (!authReady) return <div className="loading-screen"><BrandMark/><span>Preparando ambiente seguro...</span></div>;
  if (!session) return <Login login={login} setLogin={setLogin} password={password} setPassword={setPassword} onSubmit={handleLogin} error={loginError} loading={loading} configured={!!supabase}/>;

  const role = realData?.role || 'pending';
  const roleLabel = ({director:'Diretoria',manager:'Gerente',supervisor:'Supervisor'})[role] || 'Acesso pendente';
  const visibleNav = nav;
  const pageLabel = visibleNav.find(item => item.id === page)?.label || ({users:'Gestão de usuários',settings:'Configurações'})[page] || 'Visão geral';

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <div className="brand"><BrandMark/><div><div className="brand-name">SEVENPRO</div><div className="brand-sub">MONITORIA INTELIGENTE</div></div><button className="close-nav" aria-label="Fechar menu" onClick={() => setMobileNav(false)}><X size={20}/></button></div>
      <div className="workspace"><span className="workspace-dot"/><div><b>ME7 Promotora</b><small>Ambiente corporativo</small></div><ChevronDown size={15}/></div>
      <div className="nav-label">MENU PRINCIPAL</div>
      <nav>{visibleNav.map(item => <button key={item.id} className={`nav-item ${page===item.id?'active':''}`} onClick={() => {setPage(item.id);setMobileNav(false);}}><item.icon size={18}/><span>{item.label}</span></button>)}</nav>
      {role === 'director' && <><div className="nav-label management-label">ADMINISTRAÇÃO</div><button className={`nav-item ${page==='users'?'active':''}`} onClick={() => {setPage('users');setMobileNav(false);}}><ShieldCheck size={18}/><span>Gestão de usuários</span></button><button className={`nav-item ${page==='settings'?'active':''}`} onClick={() => {setPage('settings');setMobileNav(false);}}><Settings size={18}/><span>Configurações</span></button></>}
      <div className="sidebar-bottom"><div className="secure-card"><div className="secure-icon"><ShieldCheck size={17}/></div><div><b>Ambiente protegido</b><small>Acesso monitorado</small></div><span className="online-dot"/></div><button className="nav-item help-item" onClick={() => alert('Para suporte, procure a Diretoria da ME7.')}><CircleHelp size={18}/><span>Central de ajuda</span></button><div className="sidebar-version">SEVENPRO MONITORIA <span>v0.2 • MVP</span></div></div>
    </aside>
    {mobileNav && <div className="nav-scrim" onClick={() => setMobileNav(false)}/>}
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu" aria-label="Abrir menu" onClick={() => setMobileNav(true)}><Menu size={20}/></button><div className="breadcrumbs"><span>SEVENPRO</span><b>/</b><strong>{pageLabel}</strong></div><div className="top-actions"><div className="system-status"><span/>Sistema operacional</div><button className="icon-button" aria-label="Notificações" title="Notificações"><Bell size={18}/><i/></button><div className="top-divider"/><div className="user-chip"><div className="user-avatar">{(realData?.display_name || session.user.email || 'U').slice(0,1).toUpperCase()}</div><div className="user-meta"><b>{realData?.display_name || session.user.email}</b><small>{roleLabel}</small></div><button className="logout-button" onClick={logout} title="Sair" aria-label="Sair"><LogOut size={16}/></button></div></div></header>
      <section className="content-area">
        {dataError && <div className="notice error"><CircleAlert size={17}/><div>{dataError}</div></div>}
        {role==='pending' && <div className="notice error"><LockKeyhole size={18}/><div><b>Seu perfil ainda não está autorizado.</b><p>Peça à Diretoria para concluir seu cadastro e definir sua hierarquia. Nenhum dado de monitoria será exibido até a validação do perfil.</p></div></div>}
        {page==='overview' && <Overview setPage={setPage}/>}
        {page==='calls' && <Calls search={search} setSearch={setSearch} filter={filter} setFilter={setFilter}/>}
        {page==='operators' && <Operators/>}
        {page==='alerts' && <Alerts/>}
        {page==='reports' && <Reports/>}
        {page==='users' && (role==='director' ? <UserManagement/> : <Restricted/>)}
        {page==='settings' && (role==='director' ? <SettingsPage argusStatus={argusStatus} onTestArgus={checkArgus} session={session}/> : <Restricted/>)}
        <footer className="page-footer"><span>© 2026 SEVENPRO MONITORIA</span><span><ShieldCheck size={13}/>Dados protegidos • Acesso conforme permissões</span></footer>
      </section>
    </main>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
