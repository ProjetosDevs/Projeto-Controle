/**
 * Data Management Store (Simulating a Database with LocalStorage)
 */
const Store = {
    // Initial default data if LocalStorage is empty
    init() {
        if (!localStorage.getItem('corp_expenses')) {
            const initialData = [
                { id: '1', nota: '1001', unidade: 'BDM1', dtPedido: '2023-10-01', dtPagto: '2023-10-10', valor: 1500.00, situacao: 'Pago', fornecedor: 'AWS Brasil', responsavel: 'Carlos', sistema: 'Linx', multa: 0, obs: 'Servidores Mês Outubro' },
                { id: '2', nota: '1002', unidade: 'CN1', dtPedido: '2023-11-05', dtPagto: '2023-12-05', valor: 850.50, situacao: 'Pendente', fornecedor: 'Limpeza e Cia', responsavel: 'Ana', sistema: '', multa: 0, obs: 'Contrato de limpeza' },
                { id: '3', nota: '1003', unidade: 'RB133', dtPedido: '2023-09-15', dtPagto: '2023-09-30', valor: 3000.00, situacao: 'Atrasado', fornecedor: 'Agência Marketing X', responsavel: 'Roberto', sistema: '', multa: 150.00, obs: 'Campanha Q3' }
            ];
            localStorage.setItem('corp_expenses', JSON.stringify(initialData));
        }
        
        // Setup base revenues for units to calculate margin in reports
        if (!localStorage.getItem('corp_units_revenue')) {
            const revenues = {
                'BDM1': 50000,
                'BDM2': 45000,
                'CN1': 80000,
                'RB133': 60000,
                'Outros': 20000
            };
            localStorage.setItem('corp_units_revenue', JSON.stringify(revenues));
        }

        this.updateStatusAutomatically();
    },

    getExpenses() {
        return JSON.parse(localStorage.getItem('corp_expenses')) || [];
    },

    saveExpense(expense) {
        let expenses = this.getExpenses();
        if (expense.id) {
            // Update
            const index = expenses.findIndex(e => e.id === expense.id);
            if (index !== -1) {
                expenses[index] = expense;
            }
        } else {
            // Create
            expense.id = Date.now().toString();
            expenses.push(expense);
        }
        localStorage.setItem('corp_expenses', JSON.stringify(expenses));
    },

    deleteExpense(id) {
        let expenses = this.getExpenses();
        expenses = expenses.filter(e => e.id !== id);
        localStorage.setItem('corp_expenses', JSON.stringify(expenses));
    },

    getExpenseById(id) {
        const expenses = this.getExpenses();
        return expenses.find(e => e.id === id);
    },

    getUnitsRevenue() {
        return JSON.parse(localStorage.getItem('corp_units_revenue')) || {};
    },

    // Business Logic: Auto-calculate Atrasado and Pendente
    updateStatusAutomatically() {
        let expenses = this.getExpenses();
        let changed = false;
        const today = new Date();
        today.setHours(0,0,0,0);

        expenses = expenses.map(exp => {
            if (exp.situacao !== 'Pago') {
                const due = new Date(exp.dtPagto + 'T00:00:00'); // Ensure local tz
                if (due < today && exp.situacao !== 'Atrasado') {
                    exp.situacao = 'Atrasado';
                    changed = true;
                } else if (due >= today && exp.situacao !== 'Pendente') {
                    exp.situacao = 'Pendente';
                    changed = true;
                }
            }
            return exp;
        });

        if (changed) {
            localStorage.setItem('corp_expenses', JSON.stringify(expenses));
        }
    }
};

// Initialize store on script load
Store.init();
