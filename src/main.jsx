import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { Activity, AudioLines, Bell, ChevronDown, CircleHelp, Clock3, Download, FileAudio, Headphones, LayoutDashboard, LogOut, Search, Settings, ShieldCheck, SlidersHorizontal, Users, Waves, Zap, Menu, LockKeyhole, ArrowUpRight, Play, Eye, CircleAlert, CheckCircle2, CalendarDays } from 'lucide-react';
import './styles.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const sampleCalls = [
  { id: 'SP-10482', operator: 'Mariana Costa', team: 'Equipe Brenda', date: '28/10/2026 13:42', duration: '04:32', score: 94, voice: 'Envolvente', compliance: 'Aprovada', status: 'Analisada', initials: 'MC' },
  { id: 'SP-10481', operator: 'Lucas Ferreira', team: 'Equipe Thaina', date: '28/10/2026 13:39', duration: '03:18', score: 58, voice: 'Monótona', compliance: 'Revisar', status: 'Revisão necessária', initials: 'LF' },
  { id: 'SP-10480', operator: 'Camila Santos', team: 'Equipe Brenda', date: '28/10/2026 13:35', duration: '05:47', score: 86, voice: 'Clara', compliance: 'Aprovada', status: 'Analisada', initials: 'CS' },
  { id: 'SP-10479', operator: 'Rafael Oliveira', team: 'Equipe Thaina', date: '28/10/2026 13:31', duration: '02:51', score: 41, voice: 'Baixa variação', compliance: 'Revisar', status: 'Revisão necessária', initials: 'RO' },
  { id: 'SP-10478', operator: 'Beatriz Lima', team: 'Equipe Brenda', date: '28/10/2026 13:27', duration: '06:04', score: 91, voice: 'Boa energia', compliance: 'Aprovada', status: 'Analisada', initials: 'BL' },
];
const nav = [
  { label: 'Visão geral', icon: LayoutDashboard, id: 'overview' },
  { label: 'Todas as ligações', icon: Headphones, id: 'calls' },
  { label: 'Operadores', icon: Users, id: 'operators' },
  { label: 'Alertas de qualidade', icon: Bell, id: 'alerts', badge: '12' },
  { label: 'Relatórios', icon: Activity, id: 'reports' },
];
function scoreClass(n) { return n >= 85 ? 'good' : n >= 70 ? 'medium' : 'bad'; }
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
  const [selectedCall, setSelectedCall] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [realData, setRealData] = useState(null);
const [dataError, setDataError] = useState('');

const [argusStatus, setArgusStatus] = useState({
  const [argusCampaigns, setArgusCampaigns] = useState([]);
const [argusRecordings, setArgusRecordings] = useState([]);
const [recordingsLoading, setRecordingsLoading] = useState(false);
const [recordingsError, setRecordingsError] = useState('');
  loading: false,
  connected: false,
  message: 'Conexão ainda não testada.'
});

  useEffect(() => {
    if (!supabase) { setAuthReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !supabase) return;
    (async () => {
      const { data, error } = await supabase.from('profiles').select('display_name, role, manager_id, supervisor_id, active').eq('id', session.user.id).single();
      if (error) { setDataError('Não foi possível carregar seu perfil. Confirme a configuração do banco e das permissões.'); return; }
      if (!data?.active) { await supabase.auth.signOut(); setLoginError('Conta desativada. Fale com a Diretoria.'); return; }
      setRealData(data);
    })();
  }, [session]);
useEffect(() => {
  if (
    !session ||
    !realData ||
    realData.role !== 'director' ||
    !realData.active
  ) {
    return;
  }

  let cancelled = false;

  async function checkArgus() {
    setArgusStatus({
      loading: true,
      connected: false,
      message: 'Testando conexão com o Argus...'
    });

    try {
      const response = await fetch(
        '/.netlify/functions/argus-list-campaigns',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error('O servidor retornou uma resposta inválida.');
      }

      if (cancelled) return;

      if (!response.ok) {
        setArgusStatus({
          loading: false,
          connected: false,
          message:
            result.error ||
            `Falha na consulta ao Argus (HTTP ${response.status}).`
        });

        return;
      }

      setArgusStatus({
        loading: false,
        connected: true,
        message:
          'O servidor respondeu à consulta de campanhas do Argus.'
      });
    } catch (error) {
      if (cancelled) return;

      setArgusStatus({
        loading: false,
        connected: false,
        message:
          error.message ||
          'Não foi possível consultar o servidor do Argus.'
      });
    }
  }

  checkArgus();

  return () => {
    cancelled = true;
  };
}, [session, realData]);
  
  async function handleLogin(e) {
    e.preventDefault(); setLoginError('');
    if (!supabase) { setLoginError('O sistema ainda não foi configurado. Configure o Supabase e as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: login.trim(), password });
    if (error) setLoginError('Não foi possível entrar. Confira suas credenciais ou procure a Diretoria.');
    setLoading(false);
  }
  async function logout() { if (supabase) await supabase.auth.signOut(); setSession(null); setRealData(null); }

  if (!authReady) return <div className="loading-screen"><div className="brand-mark">S</div><span>Preparando ambiente seguro...</span></div>;
  if (!session) return <Login login={login} setLogin={setLogin} password={password} setPassword={setPassword} onSubmit={handleLogin} error={loginError} loading={loading} configured={!!supabase} />;

  const role = realData?.role || 'pending';
  const roleLabel = ({ director: 'Diretoria', manager: 'Gerente', supervisor: 'Supervisor' })[role] || 'Acesso pendente';
  const visibleCalls = sampleCalls.filter(c => `${c.id} ${c.operator} ${c.team}`.toLowerCase().includes(search.toLowerCase()) && (filter === 'Todas' || (filter === 'Revisão necessária' ? c.status === filter : c.compliance === filter)));
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark">S</div><div><div className="brand-name">SEVENPRO</div><div className="brand-sub">MONITORIA INTELIGENTE</div></div><button className="close-nav" onClick={() => setMobileNav(false)}>×</button></div>
      <div className="workspace"><span className="workspace-dot"/><div><b>ME7 Promotora</b><small>Ambiente corporativo</small></div><ChevronDown size={15}/></div>
      <div className="nav-label">MENU PRINCIPAL</div>
      <nav>{nav.map(item => <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => { setPage(item.id); setMobileNav(false); }}><item.icon size={18}/><span>{item.label}</span>{item.badge && <em>{item.badge}</em>}</button>)}</nav>
      {role === 'director' && <><div className="nav-label management-label">ADMINISTRAÇÃO</div><button className={`nav-item ${page === 'users' ? 'active' : ''}`} onClick={() => {setPage('users');setMobileNav(false)}}><ShieldCheck size={18}/><span>Gestão de usuários</span></button><button className={`nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => {setPage('settings');setMobileNav(false)}}><Settings size={18}/><span>Configurações</span></button></>}
      <div className="sidebar-bottom"><div className="secure-card"><div className="secure-icon"><ShieldCheck size={17}/></div><div><b>Ambiente protegido</b><small>Acesso monitorado</small></div><span className="online-dot"/></div><button className="nav-item help-item" onClick={() => alert('Para suporte, procure a Diretoria da ME7.') }><CircleHelp size={18}/><span>Central de ajuda</span></button><div className="sidebar-version">SEVENPRO MONITORIA <span>v0.1 • MVP</span></div></div>
    </aside>
    {mobileNav && <div className="nav-scrim" onClick={() => setMobileNav(false)} />}
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)}><Menu size={20}/></button><div className="breadcrumbs"><span>SEVENPRO</span><b>/</b><strong>{nav.find(n => n.id === page)?.label || ({users:'Gestão de usuários',settings:'Configurações'})[page] || 'Visão geral'}</strong></div><div className="top-actions"><div className="system-status"><span/> Sistema operacional</div><button className="icon-button" aria-label="Notificações"><Bell size={18}/><i/></button><div className="top-divider"/><div className="user-chip"><div className="user-avatar">{(realData?.display_name || session.user.email || 'D').slice(0,1).toUpperCase()}</div><div className="user-meta"><b>{realData?.display_name || session.user.email}</b><small>{roleLabel}</small></div><button className="logout-button" onClick={logout} title="Sair"><LogOut size={16}/></button></div></div></header>
      <section className="content-area">
        {dataError && <div className="notice error"><CircleAlert size={17}/>{dataError}</div>}
        {role === 'pending' && <div className="notice error"><LockKeyhole size={18}/><div><b>Seu perfil ainda não está autorizado.</b><p>Peça à Diretoria para concluir seu cadastro e definir sua hierarquia. Nenhum dado de monitoria será exibido até a validação do perfil.</p></div></div>}
        {page === 'overview' && <Overview setPage={setPage} setSelectedCall={setSelectedCall} />}
        {page === 'calls' && <Calls calls={visibleCalls} search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} setSelectedCall={setSelectedCall}/>} 
        {page === 'operators' && <Operators/>}
        {page === 'alerts' && <Alerts setSelectedCall={setSelectedCall}/>}
        {page === 'reports' && <Reports/>}
        {page === 'users' && (role === 'director' ? <UserManagement/> : <Restricted/>)}
        {page === 'settings' && (
  role === 'director'
    ? <SettingsPage argusStatus={argusStatus} />
    : <Restricted />
)}
        <footer className="page-footer"><span>© 2026 SEVENPRO MONITORIA</span><span><ShieldCheck size={13}/> Dados protegidos • Acesso conforme permissões</span></footer>
      </section>
    </main>
    {selectedCall && <CallModal call={selectedCall} close={() => setSelectedCall(null)}/>}
  </div>;
}
function Login({login,setLogin,password,setPassword,onSubmit,error,loading,configured}) {
 return <div className="login-page"><div className="login-decoration decor-one"/><div className="login-decoration decor-two"/><div className="login-left"><div className="login-brand"><div className="brand-mark large">S</div><div><div className="brand-name">SEVENPRO</div><div className="brand-sub">MONITORIA INTELIGENTE</div></div></div><div className="login-pitch"><div className="eyebrow"><span/> INTELIGÊNCIA DE QUALIDADE</div><h1>Excelência em cada<br/><span>conversa.</span></h1><p>Transforme ligações em decisões inteligentes. Acompanhe qualidade, comunicação e conformidade em um único lugar.</p><div className="login-feature-list"><div><span><AudioLines size={18}/></span><div><b>Análise inteligente de voz</b><small>Indicadores vocais e de comunicação</small></div></div><div><span><Activity size={18}/></span><div><b>Visão completa da operação</b><small>Indicadores e monitoria centralizados</small></div></div><div><span><ShieldCheck size={18}/></span><div><b>Controle por hierarquia</b><small>Acesso conforme cargo e equipe</small></div></div></div></div><div className="login-left-footer">SEVENPRO MONITORIA <span>•</span> ME7 PROMOTORA</div></div><div className="login-right"><div className="login-form-wrap"><div className="mobile-login-brand"><div className="brand-mark">S</div><div><div className="brand-name">SEVENPRO</div><div className="brand-sub">MONITORIA</div></div></div><div className="form-heading"><div className="form-kicker">BEM-VINDO(A) DE VOLTA</div><h2>Acesse sua conta</h2><p>Entre com as credenciais fornecidas pela Diretoria.</p></div><form onSubmit={onSubmit}><label htmlFor="login">E-mail corporativo</label><div className="input-wrap"><span>@</span><input id="login" type="email" autoComplete="username" placeholder="seu.email@empresa.com.br" value={login} onChange={e=>setLogin(e.target.value)} required/></div><label htmlFor="password">Senha</label><div className="input-wrap"><LockKeyhole size={17}/><input id="password" type="password" autoComplete="current-password" placeholder="Digite sua senha" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8}/></div><div className="form-options"><span><ShieldCheck size={14}/> Conexão protegida</span><span>Cadastro somente pela Diretoria</span></div>{error && <div className="login-error"><CircleAlert size={16}/>{error}</div>}<button className="primary-button login-submit" type="submit" disabled={loading}>{loading?'Verificando acesso...':'Entrar com segurança'} <ArrowUpRight size={17}/></button></form><div className="login-divider"><span/> <small>ACESSO CORPORATIVO</small> <span/></div><div className="login-help"><LockKeyhole size={18}/><div><b>Precisa de acesso?</b><p>Solicite a criação da sua conta diretamente à Diretoria.</p></div></div><div className="login-legal">Ao entrar, você concorda com as políticas internas de segurança e tratamento de dados.</div>{!configured && <div className="setup-warning"><b>Configuração inicial necessária</b><p>Conecte o Supabase e configure as variáveis de ambiente antes de publicar para uso real.</p></div>}</div><div className="login-right-footer">© 2026 SEVENPRO MONITORIA <span>•</span> ME7 PROMOTORA</div></div></div>
}
function PageTitle({eyebrow,title,description,actions}) { return <div className="page-title-row"><div><div className="section-eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{actions && <div className="title-actions">{actions}</div>}</div> }
function Metric({label,value,delta,icon,sub,kind='neutral'}) { const Icon=icon; return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className={`metric-icon ${kind}`}><Icon size={18}/></span></div><div className="metric-value">{value}</div><div className="metric-bottom"><span className={delta?.startsWith('+')?'delta-up':'delta-neutral'}>{delta}</span><span>{sub}</span></div></div> }
function Overview({setPage,setSelectedCall}) {
 return <><PageTitle eyebrow="PAINEL EXECUTIVO" title="Visão geral" description="Acompanhe a qualidade dos atendimentos e os principais indicadores da operação." actions={<><button className="secondary-button" onClick={()=>setPage('reports')}><Download size={16}/> Exportar relatório</button><button className="primary-button" onClick={()=>setPage('calls')}><Headphones size={16}/> Ver ligações</button></>}/><div className="demo-banner"><span className="demo-pulse"/><div><b>Prévia visual do sistema</b><span>Os números exibidos são ilustrativos. Os dados reais aparecerão após configurar o banco e integrar o Argus.</span></div><span className="demo-tag">MODO DEMONSTRAÇÃO</span></div><div className="metrics-grid"><Metric label="Ligações registradas" value="1.284" delta="+12,8%" sub="vs. período anterior" icon={Headphones} kind="red"/><Metric label="Analisadas pela IA" value="1.106" delta="86,1%" sub="do total registrado" icon={AudioLines} kind="purple"/><Metric label="Nota média de qualidade" value="84,7" delta="+3,2 pts" sub="de 100 pontos" icon={Activity} kind="green"/><Metric label="Revisões necessárias" value="38" delta="2,9%" sub="das ligações" icon={CircleAlert} kind="amber"/></div><div className="dashboard-grid"><div className="panel quality-panel"><div className="panel-heading"><div><h3>Qualidade dos atendimentos</h3><p>Evolução da nota média</p></div><button className="period-select">Últimos 7 dias <ChevronDown size={14}/></button></div><div className="chart-legend"><span><i className="legend-line red-line"/> Nota média</span><span><i className="legend-line gray-line"/> Meta de qualidade (85)</span></div><div className="chart-area"><div className="chart-y-labels"><span>100</span><span>90</span><span>80</span><span>70</span><span>60</span></div><div className="chart-plot"><div className="chart-gridline l1"/><div className="chart-gridline l2"/><div className="chart-gridline l3"/><div className="chart-gridline l4"/><div className="goal-line"><span>Meta 85</span></div><svg viewBox="0 0 700 205" preserveAspectRatio="none" className="quality-chart"><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ed3547" stopOpacity=".22"/><stop offset="100%" stopColor="#ed3547" stopOpacity="0"/></linearGradient></defs><path d="M0,130 C40,120 55,108 100,112 S160,89 200,100 S255,72 300,82 S355,96 400,66 S465,72 500,58 S560,70 600,42 S660,50 700,28 L700,205 L0,205Z" fill="url(#chartFill)"/><path d="M0,130 C40,120 55,108 100,112 S160,89 200,100 S255,72 300,82 S355,96 400,66 S465,72 500,58 S560,70 600,42 S660,50 700,28" fill="none" stroke="#ed3547" strokeWidth="3" vectorEffect="non-scaling-stroke"/><circle cx="200" cy="100" r="4" fill="#ed3547" stroke="#19191f" strokeWidth="2"/><circle cx="400" cy="66" r="4" fill="#ed3547" stroke="#19191f" strokeWidth="2"/><circle cx="600" cy="42" r="4" fill="#ed3547" stroke="#19191f" strokeWidth="2"/></svg><div className="chart-x-labels"><span>Qui, 22</span><span>Sex, 23</span><span>Sáb, 24</span><span>Dom, 25</span><span>Seg, 26</span><span>Ter, 27</span><span>Qua, 28</span></div></div></div></div><div className="panel alerts-panel"><div className="panel-heading"><div><h3>Alertas prioritários</h3><p>Ocorrências que merecem atenção</p></div><button className="text-button" onClick={()=>setPage('alerts')}>Ver todos <ArrowUpRight size={14}/></button></div><div className="alert-item"><span className="alert-symbol red"><CircleAlert size={17}/></span><div className="alert-copy"><b>Possível falha de conformidade</b><span>Lucas Ferreira • Equipe Thaina</span><small>Há 8 minutos</small></div><span className="priority high">Alta</span></div><div className="alert-item"><span className="alert-symbol amber"><Waves size={17}/></span><div className="alert-copy"><b>Baixa variação vocal</b><span>Rafael Oliveira • Equipe Thaina</span><small>Há 12 minutos</small></div><span className="priority medium-p">Média</span></div><div className="alert-item"><span className="alert-symbol purple"><AudioLines size={17}/></span><div className="alert-copy"><b>Transcrição incompleta</b><span>Operador não identificado</span><small>Há 17 minutos</small></div><span className="priority medium-p">Média</span></div><div className="alert-footer"><span><span className="status-dot red-dot"/> 12 alertas pendentes de revisão</span><button onClick={()=>setPage('alerts')}>Abrir fila <ArrowUpRight size={14}/></button></div></div></div><div className="panel recent-panel"><div className="panel-heading"><div><h3>Ligações recentes</h3><p>Últimas chamadas processadas pela monitoria</p></div><button className="text-button" onClick={()=>setPage('calls')}>Ver todas as ligações <ArrowUpRight size={14}/></button></div><CallTable calls={sampleCalls.slice(0,4)} setSelectedCall={setSelectedCall}/></div></>;
}
function Calls({calls,search,setSearch,filter,setFilter,setSelectedCall}) { return <><PageTitle eyebrow="CENTRAL DE MONITORIA" title="Todas as ligações" description="Pesquise chamadas, consulte notas e revise os resultados da análise." actions={<button className="secondary-button" onClick={()=>alert('A exportação estará disponível após conectar os dados reais.') }><Download size={16}/> Exportar</button>}/><div className="panel calls-panel"><div className="filter-toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por operador, equipe ou ID..."/></div><div className="filter-select"><SlidersHorizontal size={16}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option>Todas</option><option>Aprovada</option><option>Revisar</option><option>Revisão necessária</option></select></div><button className="secondary-button date-button"><CalendarDays size={16}/> 28 out, 2026 <ChevronDown size={14}/></button></div><CallTable calls={calls} setSelectedCall={setSelectedCall}/><div className="table-pagination"><span>Exibindo <b>{calls.length}</b> de <b>1.284</b> ligações <span className="muted">(amostra demonstrativa)</span></span><div><button disabled>‹</button><button className="current-page">1</button><button>2</button><button>3</button><button>…</button><button>129</button><button>›</button></div></div></div></> }
function CallTable({calls,setSelectedCall}) { return <div className="table-scroll"><table className="calls-table"><thead><tr><th>ID DA LIGAÇÃO</th><th>OPERADOR</th><th>DATA / HORA</th><th>DURAÇÃO</th><th>NOTA IA</th><th>ANÁLISE VOCAL</th><th>CONFORMIDADE</th><th></th></tr></thead><tbody>{calls.map(c=><tr key={c.id}><td><span className="call-id">{c.id}</span></td><td><div className="operator-cell"><span className="operator-avatar">{c.initials}</span><div><b>{c.operator}</b><small>{c.team}</small></div></div></td><td className="date-cell">{c.date}</td><td><span className="duration"><Clock3 size={13}/>{c.duration}</span></td><td><span className={`score-pill ${scoreClass(c.score)}`}>{c.score}<small>/100</small></span></td><td><span className={`voice-pill ${c.voice==='Monótona'||c.voice==='Baixa variação'?'voice-warn':'voice-good'}`}><Waves size={13}/>{c.voice}</span></td><td><span className={`compliance ${c.compliance==='Aprovada'?'approved':'review'}`}><span/>{c.compliance}</span></td><td><button className="row-action" onClick={()=>setSelectedCall(c)} title="Ver detalhes"><Eye size={16}/></button></td></tr>)}</tbody></table>{calls.length===0&&<div className="empty-state">Nenhuma ligação corresponde aos filtros.</div>}</div> }
function Operators() { return <><PageTitle eyebrow="DESEMPENHO INDIVIDUAL" title="Operadores" description="Acompanhe a evolução da qualidade por operador e equipe."/><div className="notice info"><Activity size={18}/><div><b>Ranking ilustrativo</b><p>Os dados reais serão carregados após configurar a integração com o Argus e o banco de dados.</p></div></div><div className="metrics-grid"><Metric label="Operadores monitorados" value="50" delta="Equipe ativa" sub="estimativa inicial" icon={Users} kind="red"/><Metric label="Nota média" value="84,7" delta="+3,2 pts" sub="no período" icon={Activity} kind="green"/><Metric label="Precisam de atenção" value="7" delta="14%" sub="dos operadores" icon={CircleAlert} kind="amber"/><Metric label="Em evolução" value="31" delta="62%" sub="melhoraram a nota" icon={Zap} kind="purple"/></div><div className="panel recent-panel"><div className="panel-heading"><div><h3>Melhores notas — demonstração</h3><p>Exemplo visual, não representa dados reais</p></div></div><CallTable calls={[sampleCalls[0],sampleCalls[2],sampleCalls[4],sampleCalls[1]]} setSelectedCall={()=>{}}/></div></> }
function Alerts({setSelectedCall}) { return <><PageTitle eyebrow="CENTRAL DE ATENÇÃO" title="Alertas de qualidade" description="Revise possíveis problemas identificados pela IA antes de tomar qualquer decisão."/><div className="notice info"><CircleAlert size={18}/><div><b>Alerta não é conclusão automática</b><p>As ocorrências são sugestões de revisão. A Diretoria ou a liderança autorizada deve ouvir o trecho e registrar a conclusão.</p></div></div><div className="alert-list-large">{sampleCalls.filter(c=>c.score<70).map(c=><div className="panel alert-large" key={c.id}><div className="alert-large-icon"><CircleAlert size={20}/></div><div className="alert-large-content"><div className="alert-large-title"><b>{c.compliance==='Revisar'?'Possível falha de conformidade':'Indicador vocal para revisão'}</b><span className="priority high">Prioridade alta</span></div><p>{c.operator} • {c.team} • {c.date}</p><div className="alert-evidence"><b>Motivo sugerido pela IA</b><span>Nota de qualidade {c.score}/100 e indicadores que precisam ser verificados por uma pessoa.</span></div><button className="text-button" onClick={()=>setSelectedCall(c)}>Revisar ligação <ArrowUpRight size={14}/></button></div></div>)}</div></> }
function Reports() { return <><PageTitle eyebrow="INTELIGÊNCIA DE NEGÓCIO" title="Relatórios" description="Consolide resultados de qualidade por período, gerente, supervisor e operador."/><div className="metrics-grid"><Metric label="Nota média" value="84,7" delta="+3,2 pts" sub="vs. período anterior" icon={Activity} kind="green"/><Metric label="Conformidade" value="96,2%" delta="+1,4%" sub="das chamadas revisadas" icon={ShieldCheck} kind="purple"/><Metric label="Tempo médio" value="04:18" delta="-0:12" sub="por ligação analisada" icon={Clock3} kind="red"/><Metric label="Cobertura da IA" value="86,1%" delta="+8,4%" sub="das gravações disponíveis" icon={AudioLines} kind="amber"/></div><div className="panel report-placeholder"><div className="report-icon"><Activity size={23}/></div><h3>Relatórios gerenciais</h3><p>Os relatórios reais serão habilitados após a conexão com o banco de dados. Poderão ser filtrados por período, gerente, supervisor e operador.</p><button className="secondary-button" onClick={()=>alert('Configure a integração com o Argus para habilitar a exportação real.') }><Download size={16}/> Exportação indisponível na prévia</button></div></> }
function UserManagement() { return <><PageTitle eyebrow="CONTROLE DE ACESSO" title="Gestão de usuários" description="Apenas a Diretoria poderá criar contas e definir a hierarquia de acesso."/><div className="notice info"><ShieldCheck size={18}/><div><b>Cadastro protegido</b><p>O cadastro público permanece desativado. A criação de usuários deve ocorrer por uma função administrativa autenticada no servidor.</p></div></div><div className="metrics-grid"><Metric label="Diretoria" value="1" delta="Acesso total" sub="conta inicial a configurar" icon={ShieldCheck} kind="red"/><Metric label="Gerentes" value="2" delta="Duas equipes" sub="vincular na configuração" icon={Users} kind="purple"/><Metric label="Supervisores" value="—" delta="A cadastrar" sub="por gerente" icon={Users} kind="green"/><Metric label="Contas bloqueadas" value="0" delta="—" sub="status a consultar no banco" icon={LockKeyhole} kind="amber"/></div><div className="panel hierarchy-panel"><div className="panel-heading"><div><h3>Hierarquia organizacional</h3><p>Modelo de permissões definido para a ME7</p></div></div><div className="hierarchy-tree"><div className="tree-node director-node"><ShieldCheck size={17}/><div><b>Diretoria</b><small>Visão global • gerencia usuários e permissões</small></div><span>1 nível</span></div><div className="tree-branches"><div className="tree-branch"><div className="tree-node manager-node"><Users size={17}/><div><b>Gerente 1</b><small>Equipes vinculadas pela Diretoria</small></div></div><div className="tree-child"><div className="tree-node supervisor-node"><Users size={15}/><div><b>Supervisor 1</b><small>Operadores da equipe</small></div></div><div className="tree-node supervisor-node"><Users size={15}/><div><b>Supervisor 2</b><small>Operadores da equipe</small></div></div></div></div><div className="tree-branch"><div className="tree-node manager-node"><Users size={17}/><div><b>Gerente 2</b><small>Equipes vinculadas pela Diretoria</small></div></div><div className="tree-child"><div className="tree-node supervisor-node"><Users size={15}/><div><b>Supervisor 3</b><small>Operadores da equipe</small></div></div><div className="tree-node supervisor-node"><Users size={15}/><div><b>Supervisor 4</b><small>Operadores da equipe</small></div></div></div></div></div></div></div></> }
function SettingsPage({ argusStatus }) {
  const statusText = argusStatus.loading
    ? 'Testando conexão...'
    : argusStatus.connected
      ? 'Conexão validada'
      : 'Conexão não validada';

  const statusClass = argusStatus.loading
    ? 'pending'
    : argusStatus.connected
      ? 'connected'
      : 'error';

  return (
    <>
      <PageTitle
        eyebrow="ADMINISTRAÇÃO DO SISTEMA"
        title="Configurações"
        description="Configure integrações e critérios de monitoria em ambiente protegido."
      />

      <div className="settings-grid">
        <div className="panel setting-card">
          <div className="setting-icon">
            <Activity size={20} />
          </div>

          <h3>Integração com Argus</h3>

          <p>
            Consulte o estado da integração com o servidor Argus.
          </p>

          <span className={`setup-status ${statusClass}`}>
            <i />
            {statusText}
          </span>

          <p className="integration-message" role="status">
            {argusStatus.message}
          </p>
        </div>

        <div className="panel setting-card">
          <div className="setting-icon">
            <AudioLines size={20} />
          </div>

          <h3>Critérios da IA</h3>

          <p>
            Defina os pesos de clareza, transparência, roteiro,
            cordialidade e indicadores vocais.
          </p>

          <span className="setup-status">
            <i />
            Critérios iniciais pendentes
          </span>
        </div>

        <div className="panel setting-card">
          <div className="setting-icon">
            <ShieldCheck size={20} />
          </div>

          <h3>Segurança e auditoria</h3>

          <p>
            Gerencie sessões, política de acesso, retenção e consulta
            de eventos administrativos.
          </p>

          <span className="setup-status">
            <i />
            Revisão de implantação necessária
          </span>
        </div>
      </div>

      <div className="notice warning">
        <CircleAlert size={18} />

        <div>
          <b>Não cole tokens nesta tela.</b>

          <p>
            As chaves do Argus e do banco devem ser armazenadas
            como variáveis secretas no ambiente de hospedagem.
          </p>
        </div>
      </div>
    </>
  );
}function Restricted() { return <div className="panel restricted"><div className="restricted-icon"><LockKeyhole size={25}/></div><h3>Acesso restrito</h3><p>Esta área é exclusiva da Diretoria. Se precisar de acesso, solicite autorização ao administrador do SEVENPRO.</p></div> }
function CallModal({call,close}) { return <div className="modal-backdrop" onClick={close}><div className="call-modal" onClick={e=>e.stopPropagation()}><div className="modal-header"><div><div className="section-eyebrow">DETALHES DA MONITORIA</div><h2>Ligação {call.id}</h2></div><button className="modal-close" onClick={close}>×</button></div><div className="modal-person"><span className="operator-avatar large-avatar">{call.initials}</span><div><b>{call.operator}</b><span>{call.team} • {call.date}</span></div><span className={`score-pill ${scoreClass(call.score)}`}>{call.score}<small>/100</small></span></div><div className="modal-audio"><div className="audio-icon"><FileAudio size={21}/></div><div className="audio-info"><b>Gravação da chamada</b><span>Áudio real disponível após configurar o Argus</span></div><button className="play-button" disabled title="Integração pendente"><Play size={16} fill="currentColor"/></button></div><div className="modal-metrics"><div><span>Nota geral</span><b className={scoreClass(call.score)}>{call.score}/100</b></div><div><span>Indicador vocal</span><b>{call.voice}</b></div><div><span>Conformidade</span><b>{call.compliance}</b></div><div><span>Duração</span><b>{call.duration}</b></div></div><div className="transcript-box"><div className="transcript-heading"><h3>Transcrição</h3><span className="pending-badge">Pendente de IA</span></div><p>A transcrição será gerada automaticamente após conectar o Argus e configurar o serviço de reconhecimento de fala. As notas demonstrativas desta tela não representam avaliação real.</p></div><div className="modal-footer"><span><ShieldCheck size={14}/> A revisão humana será registrada no histórico.</span><button className="primary-button" onClick={close}>Fechar detalhes</button></div></div></div> }

createRoot(document.getElementById('root')).render(<App/>);
