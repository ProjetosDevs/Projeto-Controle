/**
 * Dashboard Component
 */

window.Dashboard = {
    charts: {},

    init() {
        // Setup filter
        document.getElementById('dash-month-filter').addEventListener('change', () => {
            this.render();
        });
    },

    render() {
        if (!document.getElementById('view-dashboard').classList.contains('active')) return;

        const expenses = Store.getExpenses();
        const monthFilter = document.getElementById('dash-month-filter').value;
        const currentYear = new Date().getFullYear();

        // Filter expenses
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

        this.renderCards(filteredExpenses);
        this.renderCharts(filteredExpenses, expenses); // Pass global for yearly
    },

    renderCards(expenses) {
        let tGasto = 0, tPago = 0, tPendente = 0, tAtrasado = 0;

        expenses.forEach(exp => {
            const v = parseFloat(exp.valor) + parseFloat(exp.multa || 0);
            tGasto += v;
            
            if (exp.situacao === 'Pago') tPago += v;
            else if (exp.situacao === 'Pendente') tPendente += v;
            else if (exp.situacao === 'Atrasado') tAtrasado += v;
        });

        document.getElementById('val-total').textContent = App.formatCurrency(tGasto);
        document.getElementById('val-pago').textContent = App.formatCurrency(tPago);
        document.getElementById('val-pendente').textContent = App.formatCurrency(tPendente);
        document.getElementById('val-atrasado').textContent = App.formatCurrency(tAtrasado);
    },

    renderCharts(filteredExpenses, allExpenses) {
        const primaryColor = '#4f46e5';
        const bgColors = ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        const borderColors = ['#e2e8f0'];
        const gridColor = '#2e364f';
        const txtColor = '#94a3b8';

        Chart.defaults.color = txtColor;
        Chart.defaults.font.family = 'Inter';

        // Destroy existing
        Object.keys(this.charts).forEach(key => {
            if (this.charts[key]) this.charts[key].destroy();
        });

        // 1. Evolution Chart (Anual based on all expenses)
        const ctxEvol = document.getElementById('evolutionChart').getContext('2d');
        const monthsData = Array(12).fill(0);
        const currentYear = new Date().getFullYear();
        
        allExpenses.forEach(exp => {
            const parts = exp.dtPagto.split('-');
            if(parts.length === 3 && parseInt(parts[0], 10) === currentYear) {
                const m = parseInt(parts[1], 10) - 1;
                monthsData[m] += (parseFloat(exp.valor) + parseFloat(exp.multa || 0));
            }
        });

        this.charts.evolution = new Chart(ctxEvol, {
            type: 'line',
            data: {
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
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: gridColor }, beginAtZero: true },
                    x: { grid: { display: false } }
                }
            }
        });

        // 2. Unit Chart (Pie)
        const ctxUnit = document.getElementById('unitChart').getContext('2d');
        const unitData = {};
        filteredExpenses.forEach(exp => {
            unitData[exp.unidade] = (unitData[exp.unidade] || 0) + (parseFloat(exp.valor) + parseFloat(exp.multa || 0));
        });

        this.charts.unit = new Chart(ctxUnit, {
            type: 'doughnut',
            data: {
                labels: Object.keys(unitData).length ? Object.keys(unitData) : ['Nenhum dado'],
                datasets: [{
                    data: Object.keys(unitData).length ? Object.values(unitData) : [1],
                    backgroundColor: Object.keys(unitData).length ? bgColors : [gridColor],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { position: 'right', labels: { color: txtColor, usePointStyle: true, padding: 20 } }
                }
            }
        });

        // 3. Fornecedor Chart (Bar)
        const ctxSupplier = document.getElementById('supplierChart').getContext('2d');
        const suppData = {};
        filteredExpenses.forEach(exp => {
            suppData[exp.fornecedor] = (suppData[exp.fornecedor] || 0) + (parseFloat(exp.valor) + parseFloat(exp.multa || 0));
        });
        
        // Sort top 5
        const sortedSuppliers = Object.entries(suppData).sort((a,b) => b[1] - a[1]).slice(0, 5);

        this.charts.supplier = new Chart(ctxSupplier, {
            type: 'bar',
            data: {
                labels: sortedSuppliers.length ? sortedSuppliers.map(s => s[0]) : ['Nenhum fornecedor'],
                datasets: [{
                    label: 'Gasto R$',
                    data: sortedSuppliers.length ? sortedSuppliers.map(s => s[1]) : [0],
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: gridColor }, beginAtZero: true },
                    x: { grid: { display: false } }
                }
            }
        });
    }
};

// Auto init on load
document.addEventListener('DOMContentLoaded', () => {
    window.Dashboard.init();
});
