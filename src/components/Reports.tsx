import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { formatCurrency } from '../utils/formatters';
import { FileText, FileSpreadsheet, TrendingUp, TrendingDown, Minus, Edit, X, Save } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const Reports = () => {
  const { expenses, unitsRevenue, updateAllRevenues } = useStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [revenueFormData, setRevenueFormData] = useState<Record<string, number>>({});

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const unitsData: Record<string, { revenue: number, expenses: number }> = {};
  
  Object.keys(unitsRevenue).forEach(u => {
      unitsData[u] = { revenue: unitsRevenue[u], expenses: 0 };
  });

  expenses.forEach(exp => {
      const parts = exp.dtPagto.split('-');
      if (parts.length === 3) {
          const m = parseInt(parts[1], 10) - 1;
          const y = parseInt(parts[0], 10);
          
          if (m === currentMonth && y === currentYear) {
              if (!unitsData[exp.unidade]) {
                  unitsData[exp.unidade] = { revenue: 0, expenses: 0 };
              }
              unitsData[exp.unidade].expenses += ((Number(exp.valor) || 0) + (Number(exp.multa) || 0));
          }
      }
  });

  let tRev = 0, tExp = 0;
  const sortedUnits = Object.keys(unitsData).sort();

  const getExportData = () => {
    return expenses.map(exp => ({
        'Nº Nota': exp.nota,
        'Unidade': exp.unidade,
        'Fornecedor': exp.fornecedor,
        'Emissão': exp.dtPedido,
        'Vencimento': exp.dtPagto,
        'Valor (R$)': ((Number(exp.valor) || 0) + (Number(exp.multa) || 0)).toFixed(2).replace('.', ','),
        'Situação': exp.situacao,
        'Responsável': exp.responsavel
    }));
  };

  const handleExportExcel = () => {
    const data = getExportData();
    if(!data.length) return alert("Nenhum dado para exportar");

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Despesas");
    XLSX.writeFile(workbook, `Relatorio_Despesas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    const data = getExportData();
    if(!data.length) return alert("Nenhum dado para exportar");

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text("Relatório de Despesas Corporativas", 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 22);

    const columns = Object.keys(data[0]);
    const rows = data.map(obj => Object.values(obj));

    (doc as any).autoTable({
        head: [columns],
        body: rows,
        startY: 30,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8, cellPadding: 3 }
    });

    doc.save(`Relatorio_Despesas_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleOpenEditModal = () => {
    setRevenueFormData({ ...unitsRevenue });
    setIsEditModalOpen(true);
  };

  const handleSaveRevenues = () => {
    updateAllRevenues(revenueFormData);
    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Faturamento por Unidade</h1>
          <p className="text-text-muted mt-2 font-medium">Análise de resultado e balanço mensal por centro de custo</p>
        </div>
        <div className="flex flex-wrap gap-3">
            <button onClick={handleOpenEditModal} className="glass-card hover:bg-white/5 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-soft hover:shadow-hover transition-all group border border-border/50">
              <Edit className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" /> Ajustar Metas
            </button>
            <button onClick={handleExportExcel} className="glass-card hover:bg-white/5 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-soft hover:shadow-hover transition-all group border border-border/50">
              <FileSpreadsheet className="w-5 h-5 text-status-success group-hover:scale-110 transition-transform" /> Exportar Excel
            </button>
            <button onClick={handleExportPDF} className="glass-card hover:bg-white/5 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-soft hover:shadow-hover transition-all group border border-border/50">
              <FileText className="w-5 h-5 text-status-danger group-hover:scale-110 transition-transform" /> Exportar PDF
            </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 relative shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 border-b border-border/50 text-[11px] uppercase text-text-muted font-bold tracking-widest block md:table-row">
                <th className="p-5">Unidade</th>
                <th className="p-5">Faturamento (Estimado)</th>
                <th className="p-5">Gastos (Registrados)</th>
                <th className="p-5">Margem Operacional</th>
                <th className="p-5">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {sortedUnits.map(unit => {
                const rev = unitsData[unit].revenue;
                const exp = unitsData[unit].expenses;
                const marginX = rev - exp;
                tRev += rev;
                tExp += exp;

                return (
                  <tr key={unit} className="border-b border-border/30 hover:bg-white/[0.02] transition-colors group block md:table-row">
                    <td className="p-5 text-white font-bold text-base">{unit}</td>
                    <td className="p-5 text-status-info font-semibold drop-shadow-sm">{formatCurrency(rev)}</td>
                    <td className="p-5 text-status-danger font-semibold drop-shadow-sm">{formatCurrency(exp)}</td>
                    <td className={`p-5 font-bold tracking-wide ${marginX >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
                        {formatCurrency(marginX)}
                    </td>
                    <td className="p-5">
                        {marginX > 0 ? (
                            <span className="flex items-center gap-2 text-status-success font-semibold px-3 py-1.5 bg-status-successBg rounded-lg w-fit border border-status-success/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                <TrendingUp className="w-4 h-4" /> Positivo
                            </span>
                        ) : marginX < 0 ? (
                            <span className="flex items-center gap-2 text-status-danger font-semibold px-3 py-1.5 bg-status-dangerBg rounded-lg w-fit border border-status-danger/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                                <TrendingDown className="w-4 h-4" /> Negativo
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 text-status-warning font-semibold px-3 py-1.5 bg-status-warningBg rounded-lg w-fit border border-status-warning/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                                <Minus className="w-4 h-4" /> Neutro
                            </span>
                        )}
                    </td>
                  </tr>
                )
              })}
              
              <tr className="bg-accent/10 border-t border-accent/30 relative">
                <td className="p-5 text-white font-black tracking-wider border-none">TOTAL GERAL</td>
                <td className="p-5 text-status-info font-black border-none drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">{formatCurrency(tRev)}</td>
                <td className="p-5 text-status-danger font-black border-none drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]">{formatCurrency(tExp)}</td>
                <td className={`p-5 font-black border-none ${tRev - tExp >= 0 ? 'text-status-success drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-status-danger drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]'}`}>
                    {formatCurrency(tRev - tExp)}
                </td>
                <td className="p-5 border-none"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Ajuste de Metas/Faturamento */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="glass-card relative w-full max-w-[500px] p-8 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/10 zoom-in animate-in duration-300">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-text-muted hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-bold text-white mb-2">Ajustar Faturamento Estimado</h2>
            <p className="text-sm text-text-muted mb-6">Atualize as metas de faturamento das unidades operacionais.</p>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.keys(revenueFormData).map(unit => (
                <div key={unit} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{unit}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-medium">R$</span>
                    <input 
                      type="number" 
                      value={revenueFormData[unit]}
                      onChange={(e) => setRevenueFormData(prev => ({ ...prev, [unit]: Number(e.target.value) }))}
                      className="w-full bg-black/40 border border-border/50 rounded-xl pl-10 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-accent focus:bg-black/60 transition-all shadow-inner"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-border/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-semibold text-text-secondary hover:bg-white/5 transition-colors border border-transparent"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveRevenues}
                className="px-6 py-2.5 rounded-xl font-bold bg-accent hover:bg-accent-hover text-white flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transform hover:-translate-y-0.5 transition-all"
              >
                <Save className="w-4 h-4" />
                Salvar Metas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
