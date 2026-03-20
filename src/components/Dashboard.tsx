import { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { formatCurrency } from '../utils/formatters';
import { Wallet, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

export const Dashboard = () => {
  const [monthFilter, setMonthFilter] = useState('all');
  const { expenses } = useStore();

  const currentYear = new Date().getFullYear();

  // Filter logic
  let filteredExpenses = expenses;
  if (monthFilter !== 'all') {
      const filterMonth = parseInt(monthFilter, 10);
      filteredExpenses = expenses.filter(exp => {
          const parts = exp.dtPagto.split('-');
          if(parts.length === 3) {
              const month = parseInt(parts[1], 10) - 1; // 0-indexed month
              return month === filterMonth && parseInt(parts[0], 10) === currentYear;
          }
          return false;
      });
  }

  // Cards Calculation
  let tGasto = 0, tPago = 0, tPendente = 0, tAtrasado = 0;
  filteredExpenses.forEach(exp => {
      const v = (Number(exp.valor) || 0) + (Number(exp.multa) || 0);
      tGasto += v;
      if (exp.situacao === 'Pago') tPago += v;
      else if (exp.situacao === 'Pendente') tPendente += v;
      else if (exp.situacao === 'Atrasado') tAtrasado += v;
  });

  // Chart Properties Global
  ChartJS.defaults.color = '#94a3b8';
  ChartJS.defaults.font.family = 'Inter, sans-serif';
  const gridColor = '#2e364f';
  const primaryColor = '#4f46e5';

  // Evolution Data (Anual) - Uses All Expenses
  const monthsData = Array(12).fill(0);
  expenses.forEach(exp => {
      const parts = exp.dtPagto.split('-');
      if(parts.length === 3 && parseInt(parts[0], 10) === currentYear) {
          const m = parseInt(parts[1], 10) - 1;
          monthsData[m] += ((Number(exp.valor) || 0) + (Number(exp.multa) || 0));
      }
  });

  const evolutionData = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    datasets: [{
        label: 'Gastos Mensais',
        data: monthsData,
        borderColor: primaryColor,
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: primaryColor
    }]
  };

  // Unit Data (Doughnut)
  const unitDataMap: Record<string, number> = {};
  filteredExpenses.forEach(exp => {
      unitDataMap[exp.unidade] = (unitDataMap[exp.unidade] || 0) + ((Number(exp.valor) || 0) + (Number(exp.multa) || 0));
  });
  
  const unitData = {
    labels: Object.keys(unitDataMap).length ? Object.keys(unitDataMap) : ['Nenhum dado'],
    datasets: [{
        data: Object.keys(unitDataMap).length ? Object.values(unitDataMap) : [1],
        backgroundColor: Object.keys(unitDataMap).length 
          ? ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] 
          : [gridColor],
        borderWidth: 0
    }]
  };

  // Supplier Data (Bar)
  const suppDataMap: Record<string, number> = {};
  filteredExpenses.forEach(exp => {
      suppDataMap[exp.fornecedor] = (suppDataMap[exp.fornecedor] || 0) + ((Number(exp.valor) || 0) + (Number(exp.multa) || 0));
  });
  const sortedSuppliers = Object.entries(suppDataMap).sort((a,b) => b[1] - a[1]).slice(0, 5);

  const supplierData = {
    labels: sortedSuppliers.length ? sortedSuppliers.map(s => s[0]) : ['Nenhum fornecedor'],
    datasets: [{
        label: 'Gasto R$',
        data: sortedSuppliers.length ? sortedSuppliers.map(s => s[1]) : [0],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 4
    }]
  };


  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard Financeiro</h1>
          <p className="text-text-secondary mt-1">Resumo de gastos e indicadores do mês</p>
        </div>
        <select 
          value={monthFilter} 
          onChange={(e) => setMonthFilter(e.target.value)}
          className="bg-bg-surface-hover border border-border text-white text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
        >
          <option value="all">Todos os Meses</option>
          <option value="0">Janeiro</option>
          <option value="1">Fevereiro</option>
          <option value="2">Março</option>
          <option value="8">Setembro</option>
          <option value="9">Outubro</option>
          <option value="10">Novembro</option>
          <option value="11">Dezembro</option>
        </select>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total de Gastos (Mês)', value: tGasto, icon: Wallet, color: 'text-status-info', bg: 'bg-status-info/15' },
          { title: 'Total Pago', value: tPago, icon: CheckCircle, color: 'text-status-success', bg: 'bg-status-successBg', glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]' },
          { title: 'Total Pendente', value: tPendente, icon: Clock, color: 'text-status-warning', bg: 'bg-status-warningBg', glow: 'group-hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]' },
          { title: 'Total em Atraso', value: tAtrasado, icon: AlertCircle, color: 'text-status-danger', bg: 'bg-status-dangerBg', glow: 'group-hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]' },
        ].map((card, i) => (
          <div key={i} className={`glass-card rounded-2xl p-6 hover:-translate-y-1.5 transition-all duration-500 relative overflow-hidden group ${card.glow} animate-in fade-in slide-in-from-bottom-4`} style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-center gap-5 relative z-10">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.bg} border border-border/20 shadow-inner overflow-hidden relative`}>
                <div className={`absolute inset-0 opacity-20 bg-current blur-md scale-150 rounded-full ${card.color}`}></div>
                <card.icon className={`w-7 h-7 ${card.color} relative z-10 drop-shadow-md`} />
              </div>
              <div className="flex-1">
                <h3 className="text-[13px] font-semibold text-text-muted uppercase tracking-wider mb-1">{card.title}</h3>
                <p className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">{formatCurrency(card.value)}</p>
              </div>
            </div>
            {/* Hover Glow */}
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${card.bg} blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none`} />
          </div>
        ))}
      </div>

      {/* Charts Block 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl shadow-soft animate-in fade-in slide-in-from-bottom-4 group" style={{ animationDelay: '400ms' }}>
          <div className="p-6 border-b border-border/30">
            <h3 className="font-semibold text-white tracking-wide">Evolução de Gastos (Anual)</h3>
          </div>
          <div className="p-6 h-[320px] relative">
             <div className="absolute inset-0 bg-accent/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
             <Line data={evolutionData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: gridColor }, border: { dash: [4, 4] }, beginAtZero: true }, x: { grid: { display: false } } } }} />
          </div>
        </div>
        
        <div className="glass-card rounded-2xl shadow-soft animate-in fade-in slide-in-from-bottom-4 group" style={{ animationDelay: '500ms' }}>
          <div className="p-6 border-b border-border/30">
            <h3 className="font-semibold text-white tracking-wide">Gastos por Unidade</h3>
          </div>
          <div className="p-6 h-[320px] flex items-center justify-center relative">
             <div className="absolute inset-0 bg-accent/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
             <Doughnut data={unitData} options={{ responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1', usePointStyle: true, padding: 25, font: { family: 'Inter', size: 12 } } } } }} />
          </div>
        </div>
      </div>

      {/* Charts Block 2 */}
      <div className="glass-card rounded-2xl shadow-soft animate-in fade-in slide-in-from-bottom-4 group" style={{ animationDelay: '600ms' }}>
        <div className="p-6 border-b border-border/30">
          <h3 className="font-semibold text-white tracking-wide">Principais Fornecedores</h3>
        </div>
        <div className="p-6 h-[280px] relative">
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-status-successBg blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none"></div>
            <Bar data={supplierData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: gridColor, tickColor: 'transparent' }, border: { dash: [4, 4], color: 'transparent' }, beginAtZero: true }, x: { grid: { display: false } } } }} />
        </div>
      </div>

    </div>
  );
};
