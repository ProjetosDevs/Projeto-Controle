import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import type { Expense } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Plus, FileUp, Pen, Trash2, X } from 'lucide-react';
import * as XLSX from 'xlsx';

export const ExpensesList = () => {
  const { user, expenses, saveExpense, deleteExpense, importExpenses } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filters State
  const [fUnidade, setFUnidade] = useState('');
  const [fSituacao, setFSituacao] = useState('');
  const [fFornecedor, setFFornecedor] = useState('');
  const [fMes, setFMes] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<Expense>>({});

  const isReadOnly = user?.role === 'gestor';

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      nota: '', unidade: 'BDM1', dtPedido: today, dtPagto: today, 
      fornecedor: '', valor: 0, situacao: 'Pendente', responsavel: user?.username || '', 
      sistema: '', multa: 0, obs: ''
    });
    setEditingId(null);
  };

  const openModal = (exp?: Expense) => {
    if (exp) {
      setEditingId(exp.id);
      setFormData({ ...exp, situacao: exp.situacao === 'Atrasado' ? 'Pendente' : exp.situacao });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    
    saveExpense({
      ...formData,
      id: editingId || Date.now().toString(),
    } as Expense);
    
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (isReadOnly) return;
    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
      deleteExpense(id);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly || !e.target.files?.length) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);

        if (!json.length) {
          alert('O arquivo está vazio.');
          return;
        }

        const newExpenses: Expense[] = json.map((row: any) => {
          let valor = row['Valor (R$)'] || row['Valor'] || row['valor'] || 0;
          if (typeof valor === 'string') valor = parseFloat(valor.replace(/[^0-9,-]+/g, '').replace(',', '.')) || 0;
          
          let multa = row['Multa'] || row['multa'] || 0;
          if (typeof multa === 'string') multa = parseFloat(multa.replace(/[^0-9,-]+/g, '').replace(',', '.')) || 0;

          const parseDate = (val: any) => {
            if (!val) return new Date().toISOString().split('T')[0];
            if (typeof val === 'number') return new Date((val - (25567 + 2)) * 86400 * 1000).toISOString().split('T')[0];
            if (typeof val === 'string' && val.includes('/')) {
              const p = val.split('/');
              if (p.length === 3) {
                if(p[2].length === 4) return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
              }
            }
            return new Date(val).toISOString().split('T')[0];
          };

          return {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
            nota: String(row['Nº Nota'] || row['Nota'] || `IMP-${Math.floor(Math.random()*10000)}`),
            unidade: String(row['Unidade'] || 'Outros'),
            dtPedido: parseDate(row['Emissão'] || row['Data Emissão']),
            dtPagto: parseDate(row['Vencimento'] || row['Data Vencimento']),
            fornecedor: String(row['Fornecedor'] || 'Desconhecido'),
            valor,
            situacao: String(row['Situação'] || 'Pendente'),
            responsavel: String(row['Responsável'] || user?.username || 'Importado'),
            sistema: String(row['Sistema'] || ''),
            multa,
            obs: 'Importado via Excel'
          };
        });

        importExpenses(newExpenses);
        alert(`${newExpenses.length} lançamentos importados com sucesso!`);
      } catch (err) {
        alert("Erro ao importar XLSX. Cheque as colunas.");
      }
      e.target.value = ''; // reset
    };
    reader.readAsArrayBuffer(file);
  };

  const filtered = expenses.filter((exp: Expense) => {
    if (fUnidade && exp.unidade !== fUnidade) return false;
    if (fSituacao && exp.situacao !== fSituacao) return false;
    if (fFornecedor && !exp.fornecedor.toLowerCase().includes(fFornecedor.toLowerCase())) return false;
    if (fMes && exp.dtPagto.substring(0, 7) !== fMes) return false;
    return true;
  }).sort((a: Expense, b: Expense) => new Date(b.dtPagto).getTime() - new Date(a.dtPagto).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gestão de Despesas</h1>
          <p className="text-text-secondary mt-1">Controle detalhado de todas as contas corporativas</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isReadOnly && (
            <button onClick={() => openModal()} className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-soft transition-transform hover:-translate-y-0.5">
              <Plus className="w-4 h-4" /> Nova Despesa
            </button>
          )}
          {!isReadOnly && (
            <label className="cursor-pointer bg-bg-surface border border-border hover:bg-bg-surface-hover hover:text-white text-text-secondary px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
              <FileUp className="w-4 h-4" /> Importar
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImport} className="hidden" />
            </label>
          )}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
          <div>
            <label className="block text-[13px] font-semibold text-text-muted uppercase tracking-wider mb-2">Unidade</label>
            <select value={fUnidade} onChange={e => setFUnidade(e.target.value)} className="w-full bg-black/40 border border-border/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent focus:bg-black/60 transition-all shadow-inner">
              <option value="">Todas as Unidades</option>
              <option value="BDM1">BDM1</option>
              <option value="BDM2">BDM2</option>
              <option value="CN1">CN1</option>
              <option value="RB133">RB133</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-text-muted uppercase tracking-wider mb-2">Situação</label>
            <select value={fSituacao} onChange={e => setFSituacao(e.target.value)} className="w-full bg-black/40 border border-border/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent focus:bg-black/60 transition-all shadow-inner">
              <option value="">Status Geral</option>
              <option value="Pago">Pago</option>
              <option value="Pendente">Pendente</option>
              <option value="Atrasado">Atrasado</option>
            </select>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-text-muted uppercase tracking-wider mb-2">Fornecedor</label>
            <input type="text" placeholder="Buscar termo..." value={fFornecedor} onChange={e => setFFornecedor(e.target.value)} className="w-full bg-black/40 border border-border/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent focus:bg-black/60 transition-all shadow-inner" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-text-muted uppercase tracking-wider mb-2">Mês (Vencimento)</label>
            <input type="month" value={fMes} onChange={e => setFMes(e.target.value)} className="w-full bg-black/40 border border-border/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent focus:bg-black/60 transition-all shadow-inner" />
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 shadow-soft" style={{ animationDelay: '100ms' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 border-b border-border/50 text-[11px] uppercase text-text-muted font-bold tracking-widest">
                <th className="p-5">Nº Nota</th>
                <th className="p-5">Unidade</th>
                <th className="p-5">Fornecedor</th>
                <th className="p-5">Emissão</th>
                <th className="p-5">Vencimento</th>
                <th className="p-5">Valor</th>
                <th className="p-5">Status</th>
                <th className="p-5">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-text-muted">Nenhuma despesa encontrada.</td>
                </tr>
              ) : (
                filtered.map((exp: Expense) => {
                  const isLate = exp.situacao === 'Atrasado';
                  return (
                    <tr key={exp.id} className="border-b border-border/30 hover:bg-white/[0.02] transition-colors group">
                      <td className="p-5 text-white font-semibold">{exp.nota}</td>
                      <td className="p-5 text-text-secondary">{exp.unidade}</td>
                      <td className="p-5 text-text-primary">{exp.fornecedor}</td>
                      <td className="p-5 text-text-muted">{formatDate(exp.dtPedido)}</td>
                      <td className={`p-5 ${isLate ? 'text-status-danger font-bold relative' : 'text-text-secondary'}`}>
                          {formatDate(exp.dtPagto)}
                          {isLate && <div className="absolute inset-x-0 bottom-2 h-px bg-status-danger/30 blur-sm rounded-full"></div>}
                      </td>
                      <td className="p-5 text-white font-medium">
                        {formatCurrency(exp.valor)}
                        {exp.multa > 0 && <span className="block text-xs text-status-warning mt-1 drop-shadow-md">+ Multa: {formatCurrency(exp.multa)}</span>}
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-widest uppercase border
                          ${exp.situacao === 'Pago' ? 'bg-status-successBg text-status-success border-status-success/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 
                            exp.situacao === 'Pendente' ? 'bg-status-warningBg text-status-warning border-status-warning/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]' : 
                            'bg-status-dangerBg text-status-danger border-status-danger/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]'}`}>
                          {exp.situacao}
                        </span>
                      </td>
                      <td className="p-5">
                        {!isReadOnly ? (
                          <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal(exp)} className="p-2 text-accent hover:bg-accent/20 rounded-lg transition-colors border border-transparent hover:border-accent/30"><Pen className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(exp.id)} className="p-2 text-status-danger hover:bg-status-dangerBg rounded-lg transition-colors border border-transparent hover:border-status-danger/30"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted">Apenas Leitura</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="glass-card border border-border/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto slide-in-from-bottom-8 relative">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/10 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="flex items-center justify-between p-6 border-b border-border/50 sticky top-0 bg-bg-surface/95 backdrop-blur-xl z-10">
              <h2 className="text-xl font-bold text-white tracking-wide">{editingId ? 'Editar Despesa' : 'Registrar Nova Despesa'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-text-muted hover:bg-white/10 rounded-full hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5 relative z-10">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Nº da Nota *</label>
                  <input type="text" required value={formData.nota} onChange={e => setFormData({...formData, nota: e.target.value})} className="w-full bg-black/40 border border-border/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent shadow-inner transition-colors focus:bg-black/60" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Unidade *</label>
                  <select required value={formData.unidade} onChange={e => setFormData({...formData, unidade: e.target.value})} className="w-full bg-black/40 border border-border/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent shadow-inner transition-colors focus:bg-black/60">
                    <option value="BDM1">BDM1</option>
                    <option value="BDM2">BDM2</option>
                    <option value="CN1">CN1</option>
                    <option value="RB133">RB133</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Emissão *</label>
                  <input type="date" required value={formData.dtPedido} onChange={e => setFormData({...formData, dtPedido: e.target.value})} className="w-full bg-black/40 border border-border/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent shadow-inner transition-colors focus:bg-black/60" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Vencimento *</label>
                  <input type="date" required value={formData.dtPagto} onChange={e => setFormData({...formData, dtPagto: e.target.value})} className="w-full bg-black/40 border border-border/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent shadow-inner transition-colors focus:bg-black/60" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Fornecedor *</label>
                  <input type="text" required value={formData.fornecedor} onChange={e => setFormData({...formData, fornecedor: e.target.value})} className="w-full bg-black/40 border border-border/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent shadow-inner transition-colors focus:bg-black/60" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Valor (R$) *</label>
                  <input type="number" step="0.01" required value={formData.valor} onChange={e => setFormData({...formData, valor: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-border/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent shadow-inner transition-colors focus:bg-black/60" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Situação *</label>
                  <select required value={formData.situacao} onChange={e => setFormData({...formData, situacao: e.target.value})} className="w-full bg-black/40 border border-border/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent shadow-inner transition-colors focus:bg-black/60">
                    <option value="Pendente">Pendente</option>
                    <option value="Pago">Pago</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Responsável *</label>
                  <input type="text" required value={formData.responsavel} onChange={e => setFormData({...formData, responsavel: e.target.value})} className="w-full bg-black/40 border border-border/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent shadow-inner transition-colors focus:bg-black/60" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Sistema Origem</label>
                  <input type="text" value={formData.sistema} onChange={e => setFormData({...formData, sistema: e.target.value})} className="w-full bg-black/40 border border-border/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent shadow-inner transition-colors focus:bg-black/60" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Multa Atraso (R$)</label>
                  <input type="number" step="0.01" value={formData.multa} onChange={e => setFormData({...formData, multa: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-border/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent shadow-inner transition-colors focus:bg-black/60" />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Observações</label>
                <textarea rows={3} value={formData.obs} onChange={e => setFormData({...formData, obs: e.target.value})} className="w-full bg-black/40 border border-border/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent shadow-inner transition-colors focus:bg-black/60 resize-none"></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-border/50 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-text-muted hover:text-white hover:bg-white/5 transition-colors border border-transparent">Cancelar</button>
                <button type="submit" className="bg-accent hover:bg-accent-hover text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all transform hover:-translate-y-0.5 border border-accent/50">{editingId ? 'Salvar Edição' : 'Registrar Custo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
