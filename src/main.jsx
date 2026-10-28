```jsx
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
    loading: false,
    connected: false,
    message: 'Conexão ainda não testada.',
  });

  const [argusCampaigns, setArgusCampaigns] = useState([]);
  const [argusRecordings, setArgusRecordings] = useState([]);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [recordingsError, setRecordingsError] = useState('');

  // Recupera a sessão e acompanha o login/logout.
  useEffect(() => {
    let mounted = true;

    if (!supabase) {
      setAuthReady(true);
      return undefined;
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) {
        setLoginError('Não foi possível recuperar a sessão.');
      }

      setSession(data?.session ?? null);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setRealData(null);
      setDataError('');
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Carrega o perfil autorizado do usuário conectado.
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setRealData(null);
      setDataError('');

      if (!session || !supabase) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(
            'display_name, role, manager_id, supervisor_id, active'
          )
          .eq('id', session.user.id)
          .single();

        if (cancelled) return;

        if (error || !data) {
          setDataError(
            'Não foi possível carregar seu perfil. Confira o cadastro no Supabase e as permissões.'
          );
          return;
        }

        if (!data.active) {
          await supabase.auth.signOut();

          if (!cancelled) {
            setLoginError(
              'Conta desativada. Entre em contato com a Diretoria.'
            );
          }

          return;
        }

        setRealData(data);
      } catch {
        if (!cancelled) {
          setDataError(
            'Falha ao consultar o perfil. Tente novamente.'
          );
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [session]);

  // Verifica a conexão com o Argus para usuários da Diretoria.
  useEffect(() => {
    let cancelled = false;

    async function checkArgus() {
      if (
        !session ||
        !realData ||
        realData.role !== 'director' ||
        !realData.active
      ) {
        setArgusStatus({
          loading: false,
          connected: false,
          message:
            'A consulta está disponível somente para a Diretoria.',
        });

        setArgusCampaigns([]);
        return;
      }

      setArgusStatus({
        loading: true,
        connected: false,
        message: 'Testando a conexão com o Argus...',
      });

      try {
        const response = await fetch(
          '/.netlify/functions/argus-list-campaigns',
          {
            method: 'GET',
            headers: {
              Authorization: 'Bearer ' + session.access_token,
            },
          }
        );

        let result;

        try {
          result = await response.json();
        } catch {
          throw new Error(
            'O servidor retornou uma resposta inválida.'
          );
        }

        if (cancelled) return;

        if (!response.ok) {
          setArgusStatus({
            loading: false,
            connected: false,
            message:
              result?.error ||
              `Falha na consulta ao Argus (HTTP ${response.status}).`,
          });

          setArgusCampaigns([]);
          return;
        }
```

        const payload = result?.data ?? result;

        const campaigns = Array.isArray(payload?.campanhas)
          ? payload.campanhas
          : Array.isArray(payload?.data?.campanhas)
            ? payload.data.campanhas
            : [];

        setArgusCampaigns(campaigns);

        setArgusStatus({
          loading: false,
          connected: true,
          message: campaigns.length
            ? `Conexão validada. ${campaigns.length} campanha(s) retornada(s).`
            : 'O servidor respondeu, mas nenhuma campanha foi retornada.',
        });
      } catch (error) {
        if (cancelled) return;

        setArgusStatus({
          loading: false,
          connected: false,
          message:
            error?.message ||
            'Não foi possível consultar o servidor do Argus.',
        });

        setArgusCampaigns([]);
      }
    }

    checkArgus();

    return () => {
      cancelled = true;
    };
  }, [session, realData]);

  // Login.
  async function handleLogin(event) {
    event.preventDefault();
    setLoginError('');

    if (!supabase) {
      setLoginError(
        'O sistema ainda não foi configurado. Confira VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
      );
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: login.trim(),
        password,
      });

      if (error) {
        setLoginError(
          'Não foi possível entrar. Confira suas credenciais ou procure a Diretoria.'
        );
      }
    } catch {
      setLoginError('Falha de conexão durante o login.');
    } finally {
      setLoading(false);
    }
  }

  // Logout.
  async function logout() {
    if (supabase) {
      await supabase.auth.signOut();
    }

    setSession(null);
    setRealData(null);
    setSelectedCall(null);
    setArgusCampaigns([]);
    setArgusRecordings([]);
    setRecordingsError('');
    setDataError('');
  }

  if (!authReady) {
    return (
      <div className="loading-screen">
        <div className="brand-mark">S</div>
        <span>Preparando ambiente seguro...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <Login
        login={login}
        setLogin={setLogin}
        password={password}
        setPassword={setPassword}
        onSubmit={handleLogin}
        error={loginError}
        loading={loading}
        configured={!!supabase}
      />
    );
  }

  const role = realData?.role || 'pending';

  const roleLabel = {
    director: 'Diretoria',
    manager: 'Gerente',
    supervisor: 'Supervisor',
  }[role] || 'Acesso pendente';

  const visibleCalls = sampleCalls.filter((call) => {
    const matchesSearch = `${call.id} ${call.operator} ${call.team}`
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      filter === 'Todas' ||
      (filter === 'Revisão necessária'
        ? call.status === 'Revisão necessária'
        : call.compliance === filter);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">S</div>

          <div>
            <div className="brand-name">SEVENPRO</div>
            <div className="brand-sub">MONITORIA INTELIGENTE</div>
          </div>

          <button
            className="close-nav"
            onClick={() => setMobileNav(false)}
          >
            ×
          </button>
        </div>

        <div className="workspace">
          <span className="workspace-dot" />

          <div>
            <b>ME7 Promotora</b>
            <small>Ambiente corporativo</small>
          </div>

          <ChevronDown size={15} />
        </div>

        <div className="nav-label">MENU PRINCIPAL</div>

        <nav>
          {nav.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${
                page === item.id ? 'active' : ''
              }`}
              onClick={() => {
                setPage(item.id);
                setMobileNav(false);
              }}
            >
              <item.icon size={18} />
              <span>{item.label}</span>

              {item.badge && <em>{item.badge}</em>}
            </button>
          ))}
        </nav>

        {role === 'director' && (
          <>
            <div className="nav-label management-label">
              ADMINISTRAÇÃO
            </div>

            <button
              className={`nav-item ${
                page === 'users' ? 'active' : ''
              }`}
              onClick={() => {
                setPage('users');
                setMobileNav(false);
              }}
            >
              <ShieldCheck size={18} />
              <span>Gestão de usuários</span>
            </button>

            <button
              className={`nav-item ${
                page === 'settings' ? 'active' : ''
              }`}
              onClick={() => {
                setPage('settings');
                setMobileNav(false);
              }}
            >
              <Settings size={18} />
              <span>Configurações</span>
            </button>
          </>
        )}

        <div className="sidebar-bottom">
          <div className="secure-card">
            <div className="secure-icon">
              <ShieldCheck size={17} />
            </div>

            <div>
              <b>Ambiente protegido</b>
              <small>Acesso monitorado</small>
            </div>

            <span className="online-dot" />
          </div>

          <button
            className="nav-item help-item"
            onClick={() =>
              alert('Para suporte, procure a Diretoria da ME7.')
            }
          >
            <CircleHelp size={18} />
            <span>Central de ajuda</span>
          </button>

          <div className="sidebar-version">
            SEVENPRO MONITORIA <span>v0.1 • MVP</span>
          </div>
        </div>
      </aside>

      {mobileNav && (
        <div
          className="nav-scrim"
          onClick={() => setMobileNav(false)}
        />
      )}

      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileNav(true)}
          >
            <Menu size={20} />
          </button>

          <div className="breadcrumbs">
            <span>SEVENPRO</span>
            <b>/</b>
            <strong>
              {nav.find((item) => item.id === page)?.label ||
                {
                  users: 'Gestão de usuários',
                  settings: 'Configurações',
                }[page] ||
                'Visão geral'}
            </strong>
          </div>

          <div className="top-actions">
            <div className="system-status">
              <span />
              Sistema operacional
            </div>

            <button
              className="icon-button"
              aria-label="Notificações"
            >
              <Bell size={18} />
              <i />
            </button>

            <div className="top-divider" />

            <div className="user-chip">
              <div className="user-avatar">
                {(
                  realData?.display_name ||
                  session.user.email ||
                  'D'
                )
                  .slice(0, 1)
                  .toUpperCase()}
              </div>

              <div className="user-meta">
                <b>
                  {realData?.display_name || session.user.email}
                </b>
                <small>{roleLabel}</small>
              </div>

              <button
                className="logout-button"
                onClick={logout}
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <section className="content-area">
          {dataError && (
            <div className="notice error">
              <CircleAlert size={17} />
              {dataError}
            </div>
          )}

          {role === 'pending' && (
            <div className="notice error">
              <LockKeyhole size={18} />

              <div>
                <b>Seu perfil ainda não está autorizado.</b>
                <p>
                  Peça à Diretoria para concluir seu cadastro e
                  definir sua hierarquia. Nenhum dado de monitoria
                  será exibido até a validação do perfil.
                </p>
              </div>
            </div>
          )}

          {page === 'overview' && (
            <Overview
              setPage={setPage}
              setSelectedCall={setSelectedCall}
            />
          )}

          {page === 'calls' && (
            <Calls
              calls={visibleCalls}
              search={search}
              setSearch={setSearch}
              filter={filter}
              setFilter={setFilter}
              setSelectedCall={setSelectedCall}
            />
          )}

          {page === 'operators' && <Operators />}

          {page === 'alerts' && (
            <Alerts setSelectedCall={setSelectedCall} />
          )}

          {page === 'reports' && <Reports />}

          {page === 'users' &&
            (role === 'director' ? (
              <UserManagement />
            ) : (
              <Restricted />
            ))}

          {page === 'settings' &&
            (role === 'director' ? (
              <SettingsPage argusStatus={argusStatus} />
            ) : (
              <Restricted />
            ))}

          <footer className="page-footer">
            <span>© 2026 SEVENPRO MONITORIA</span>
            <span>
              <ShieldCheck size={13} />
              Dados protegidos • Acesso conforme permissões
            </span>
          </footer>
        </section>
      </main>

      {selectedCall && (
        <CallModal
          call={selectedCall}
          close={() => setSelectedCall(null)}
        />
      )}
    </div>
  );
}
```
