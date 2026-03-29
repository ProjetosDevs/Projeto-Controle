import { useState, useRef, useEffect } from 'react';
import { useStore, StoreProvider } from './store/StoreContext';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Dashboard } from './components/Dashboard';
import { ExpensesList } from './components/ExpensesList';
import { Reports } from './components/Reports';
import { LayoutDashboard, FileText, PieChart, Search, Bell, Settings, User as UserIcon, LogOut, AlertCircle, Clock } from 'lucide-react';

const Sidebar = ({ currentView, setView }: { currentView: string, setView: (v: string) => void }) => {
  const { user, logout } = useStore();

  const roleNames = {
    admin: 'Administrador',
    financeiro: 'Financeiro',
    gestor: 'Gestor (Leitura)',
  };

  return (
    <aside className="w-[280px] m-4 mr-0 rounded-2xl glass-card flex flex-col h-[calc(100vh-32px)] shrink-0 z-20 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      <div className="p-8 flex flex-col gap-2 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent to-accent-hover flex items-center justify-center shadow-[0_0_20px_var(--tw-shadow-color)] shadow-accent/40">
            <PieChart className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Financeiro<span className="text-accent font-light">Corp</span></span>
        </div>
      </div>

      <nav className="flex-1 p-5 space-y-2 overflow-y-auto">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { id: 'expenses', icon: FileText, label: 'Despesas' },
          { id: 'reports', icon: PieChart, label: 'Faturamento' },
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all group ${
              currentView === item.id 
                ? 'bg-accent/20 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] border border-accent/20' 
                : 'text-text-secondary hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${currentView === item.id ? 'text-accent-hover' : 'text-text-muted'}`} /> 
            {item.label}
          </button>
        ))}
      </nav>

      <div className="m-5 p-4 rounded-xl bg-black/20 border border-border/50 backdrop-blur-md flex items-center justify-between mt-auto shadow-inner">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center text-accent-hover border border-accent/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <UserIcon className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white tracking-wide truncate max-w-[100px]">{user?.username}</span>
            <span className="text-[11px] text-accent/80 uppercase tracking-widest font-bold">{roleNames[user?.role || 'admin']}</span>
          </div>
        </div>
        <button 
          onClick={logout}
          className="p-2.5 rounded-lg text-text-muted hover:bg-status-dangerBg hover:text-status-danger hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all"
          title="Sair"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};

const Topbar = () => {
  const { expenses, user } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Fecha os dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const overdue = expenses.filter(e => e.situacao === 'Atrasado');
  const pending = expenses.filter(e => e.situacao === 'Pendente');
  const totalNotifs = overdue.length + pending.length;

  return (
    <header className="h-[80px] px-8 flex items-center justify-between sticky top-0 z-50 shrink-0 w-full backdrop-blur-md bg-transparent border-b border-border/10">
      <div className="flex items-center bg-black/40 border border-white/5 rounded-full px-5 py-2.5 w-[350px] shadow-inner focus-within:border-accent/50 focus-within:bg-black/60 transition-all group">
        <Search className="w-4 h-4 text-text-muted mr-3 group-focus-within:text-accent" />
        <input 
          type="text" 
          placeholder="Pesquisar por transação, unidade..." 
          className="bg-transparent border-none text-white text-sm w-full focus:outline-none placeholder:text-text-muted" 
        />
      </div>
      
      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => { setShowNotifications(!showNotifications); setShowSettings(false); }}
            className={`relative p-2.5 text-text-secondary hover:text-white hover:bg-white/10 rounded-full transition-colors border ${showNotifications ? 'border-accent/50 text-accent bg-accent/10' : 'border-transparent hover:border-white/10'}`}
          >
            <Bell className="w-5 h-5" />
            {totalNotifs > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-status-danger rounded-full border border-bg-main animate-pulse"></span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 glass-card rounded-2xl shadow-xl border border-white/10 overflow-hidden transform opacity-100 scale-100 transition-all origin-top-right z-50">
              <div className="p-4 border-b border-white/10 bg-black/40">
                <h3 className="text-white font-semibold text-sm">Notificações</h3>
                <p className="text-xs text-text-muted mt-1">Você tem {totalNotifs} contas pedindo atenção.</p>
              </div>
              <div className="max-h-[300px] overflow-y-auto p-2">
                {overdue.map(exp => (
                  <div key={exp.id} className="flex items-start gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors">
                    <AlertCircle className="w-4 h-4 text-status-danger shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-white">Conta Atrasada - {exp.fornecedor}</span>
                      <span className="text-[11px] text-text-muted mt-0.5">{exp.unidade} • Venceu em {new Date(exp.dtPagto).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {pending.map(exp => (
                  <div key={exp.id} className="flex items-start gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors">
                    <Clock className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-white">Vencimento Próximo - {exp.fornecedor}</span>
                      <span className="text-[11px] text-text-muted mt-0.5">Vence em {new Date(exp.dtPagto).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {totalNotifs === 0 && (
                   <div className="p-6 text-center text-text-muted text-sm italic">Nenhuma notificação nova.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings Dropdown */}
        <div className="relative" ref={settingsRef}>
          <button 
            onClick={() => { setShowSettings(!showSettings); setShowNotifications(false); }}
            className={`p-2.5 text-text-secondary hover:text-white hover:bg-white/10 rounded-full transition-colors border ${showSettings ? 'border-accent/50 text-accent bg-accent/10' : 'border-transparent hover:border-white/10'}`}
          >
            <Settings className="w-5 h-5" />
          </button>
          
          {showSettings && (
             <div className="absolute right-0 mt-2 w-56 glass-card rounded-2xl shadow-xl border border-white/10 overflow-hidden transform opacity-100 scale-100 transition-all origin-top-right z-50">
                <div className="p-4 border-b border-white/10 bg-black/40">
                  <span className="block text-sm font-semibold text-white">{user?.username}</span>
                  <span className="block text-xs text-text-muted uppercase tracking-wider mt-0.5">{user?.role}</span>
                </div>
                <div className="p-2 space-y-1">
                  <button className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-colors">Editar Perfil</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-colors">Preferências</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-colors">Exportar Dados</button>
                </div>
             </div>
          )}
        </div>
      </div>
    </header>
  );
};

const AppContent = () => {
  const { user } = useStore();
  const [currentView, setView] = useState('dashboard');
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  if (!user) {
    if (authView === 'login') return <Login onNavigateRegister={() => setAuthView('register')} />;
    return <Register onNavigateLogin={() => setAuthView('login')} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-main">
      <Sidebar currentView={currentView} setView={setView} />
      
      <main className="flex-1 flex flex-col min-w-0 relative">
        <Topbar />
        
        <div className="flex-1 overflow-y-auto p-8 pt-6 relative z-0">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 w-full max-w-[1400px] mx-auto">
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'expenses' && <ExpensesList />}
            {currentView === 'reports' && <Reports />}
          </div>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default App;
