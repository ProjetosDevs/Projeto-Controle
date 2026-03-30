import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { PieChart, ArrowRight } from 'lucide-react';

export const Register = ({ onNavigateLogin }: { onNavigateLogin?: () => void }) => {
  const { login } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'financeiro' | 'gestor'>('admin');
  const [companyName, setCompanyName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username, password, register: true, role, companyName });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-bg-main to-[#151828] overflow-hidden">
      <div className="absolute w-[600px] h-[600px] bg-accent/20 rounded-full blur-[100px] -top-[20%] -left-[10%] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[420px] px-4">
        <div className="glass-card p-10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-accent/5 blur-[80px] pointer-events-none"></div>

          <div className="text-center mb-8 relative z-10">
            <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-accent to-accent-hover rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)] mb-5 transform hover:scale-105 transition-transform duration-500">
              <PieChart className="w-10 h-10 text-white drop-shadow-md" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Criar Conta</h2>
            <p className="text-text-muted text-sm font-medium">Junte-se ao FinanceiroCorp</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div>
              <label className="block text-[13px] font-semibold text-text-muted uppercase tracking-wider mb-2">Empresa</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nome da sua Empresa..."
                className="w-full bg-black/40 border border-border/50 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-accent focus:bg-black/60 transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-text-muted uppercase tracking-wider mb-2">Usuário</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Escolha seu usuário..."
                className="w-full bg-black/40 border border-border/50 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-accent focus:bg-black/60 transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-text-muted uppercase tracking-wider mb-2">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Escolha sua senha..."
                className="w-full bg-black/40 border border-border/50 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-accent focus:bg-black/60 transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-text-muted uppercase tracking-wider mb-2">Tipo de Acesso Solicitado</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-black/40 border border-border/50 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-accent focus:bg-black/60 transition-all shadow-inner uppercase tracking-wide appearance-none cursor-pointer"
              >
                <option value="admin">Administrador</option>
                <option value="financeiro">Financeiro</option>
                <option value="gestor">Gestor (Apenas Leitura)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full mt-6 bg-accent hover:bg-accent-hover text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transform hover:-translate-y-0.5 flex items-center justify-center gap-2 border border-accent/50 group"
            >
              Registrar Conta <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="text-center mt-5">
              <button 
                type="button" 
                onClick={onNavigateLogin} 
                className="text-sm border-none bg-transparent hover:text-white transition-colors text-text-muted cursor-pointer font-medium"
              >
                Já possui uma conta? <span className="text-accent hover:underline">Entrar</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
