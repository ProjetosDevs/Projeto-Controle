/**
 * Expenses List and Form Component
 */

window.ExpensesList = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Form Submit
        const form = document.getElementById('expense-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveExpense();
            });
        }

        // Modal triggers
        document.getElementById('btn-new-expense').addEventListener('click', () => {
            this.openModal();
        });

        // Import Excel Trigger
        const importInput = document.getElementById('file-import-excel');
        if (importInput) {
            importInput.addEventListener('change', (e) => this.importFromExcel(e));
        }

        document.querySelectorAll('.btn-close, .btn-close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Filters trigger
        const filterIds = ['filter-unidade', 'filter-situacao', 'filter-fornecedor', 'filter-mes'];
        filterIds.forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.render());
            document.getElementById(id).addEventListener('change', () => this.render());
        });
    },

    openModal(expense = null) {
        document.getElementById('modal-expense').classList.add('active');
        const form = document.getElementById('expense-form');
        form.reset();
        document.getElementById('exp-id').value = '';

        if (expense) {
            document.getElementById('exp-id').value = expense.id;
            document.getElementById('exp-nota').value = expense.nota;
            document.getElementById('exp-unidade').value = expense.unidade;
            document.getElementById('exp-data-pedido').value = expense.dtPedido;
            document.getElementById('exp-data-pagto').value = expense.dtPagto;
            document.getElementById('exp-fornecedor').value = expense.fornecedor;
            document.getElementById('exp-valor').value = expense.valor;

            // Force status visually if auto-calculated early
            document.getElementById('exp-situacao').value = expense.situacao === 'Atrasado' ? 'Pendente' : expense.situacao;

            document.getElementById('exp-responsavel').value = expense.responsavel;
            document.getElementById('exp-sistema').value = expense.sistema || '';
            document.getElementById('exp-multa').value = expense.multa || 0;
            document.getElementById('exp-obs').value = expense.obs || '';
        } else {
            // Default dates logic
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('exp-data-pedido').value = today;
            document.getElementById('exp-data-pagto').value = today;
            document.getElementById('exp-responsavel').value = App.user ? App.user.username : '';
        }
    },

    closeModal() {
        document.getElementById('modal-expense').classList.remove('active');
    },

    saveExpense() {
        if (App.user && App.user.role === 'gestor') {
            alert('Acesso negado. Apenas visualização.');
            return;
        }

        const exp = {
            id: document.getElementById('exp-id').value,
            nota: document.getElementById('exp-nota').value,
            unidade: document.getElementById('exp-unidade').value,
            dtPedido: document.getElementById('exp-data-pedido').value,
            dtPagto: document.getElementById('exp-data-pagto').value,
            fornecedor: document.getElementById('exp-fornecedor').value,
            valor: parseFloat(document.getElementById('exp-valor').value) || 0,
            situacao: document.getElementById('exp-situacao').value,
            responsavel: document.getElementById('exp-responsavel').value,
            sistema: document.getElementById('exp-sistema').value,
            multa: parseFloat(document.getElementById('exp-multa').value) || 0,
            obs: document.getElementById('exp-obs').value
        };

        Store.saveExpense(exp);
        Store.updateStatusAutomatically(); // Ensure pendency rules
        this.closeModal();
        this.render();
        if (window.Dashboard) window.Dashboard.render(); // update dash metrics
        if (window.Reports) window.Reports.render(); // update reports metrics
    },

    deleteExpense(id) {
        if (App.user && App.user.role === 'gestor') return;
        if (confirm('Tem certeza que deseja excluir esta despesa?')) {
            Store.deleteExpense(id);
            this.render();
            if (window.Dashboard) window.Dashboard.render();
            if (window.Reports) window.Reports.render();
        }
    },

    editExpense(id) {
        if (App.user && App.user.role === 'gestor') return;
        const exp = Store.getExpenseById(id);
        if (exp) this.openModal(exp);
    },

    importFromExcel(event) {
        if (App.user && App.user.role === 'gestor') {
            alert('Acesso negado. Apenas visualização.');
            event.target.value = '';
            return;
        }

        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) {
                    alert('O arquivo está vazio ou não pôde ser lido de forma apropriada.');
                    return;
                }

                let importedCount = 0;

                json.forEach(row => {
                    // Try to map fields flexibly against Portuguese common header names
                    const nota = row['Nº Nota'] || row['Nota'] || row['nota'] || `IMP-${Math.floor(Math.random() * 10000)}`;
                    const unidade = row['Unidade'] || row['unidade'] || 'Outros';
                    const dtPedido = row['Emissão'] || row['Data Emissão'] || row['dtPedido'] || new Date().toISOString().split('T')[0];
                    const dtPagto = row['Vencimento'] || row['Data Vencimento'] || row['dtPagto'] || new Date().toISOString().split('T')[0];
                    const fornecedor = row['Fornecedor'] || row['fornecedor'] || 'Desconhecido';

                    let valor = row['Valor (R$)'] || row['Valor'] || row['valor'] || 0;
                    if (typeof valor === 'string') {
                        valor = parseFloat(valor.replace(/[^0-9,-]+/g, '').replace(',', '.')) || 0;
                    }

                    const situacao = row['Situação'] || row['situacao'] || 'Pendente';
                    const responsavel = row['Responsável'] || row['responsavel'] || (App.user ? App.user.username : 'Importado');
                    const sistema = row['Sistema'] || row['sistema'] || '';

                    let multa = row['Multa'] || row['multa'] || 0;
                    if (typeof multa === 'string') {
                        multa = parseFloat(multa.replace(/[^0-9,-]+/g, '').replace(',', '.')) || 0;
                    }

                    const exp = {
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                        nota: String(nota),
                        unidade: String(unidade),
                        dtPedido: this.parseExcelDate(dtPedido),
                        dtPagto: this.parseExcelDate(dtPagto),
                        fornecedor: String(fornecedor),
                        valor: valor,
                        situacao: String(situacao),
                        responsavel: String(responsavel),
                        sistema: String(sistema),
                        multa: multa,
                        obs: 'Lançamento via carga de Excel'
                    };

                    Store.saveExpense(exp);
                    importedCount++;
                });

                Store.updateStatusAutomatically(); // Ensure pendency rules
                this.render();
                if (window.Dashboard) window.Dashboard.render();
                if (window.Reports) window.Reports.render();

                alert(`${importedCount} lançamentos importados com sucesso!`);
            } catch (err) {
                console.error("Erro na importação XLSX:", err);
                alert("Ocorreu um problema ao importar o arquivo. Cheque a formatação (ex: colunas esperadas: Nº Nota, Unidade, Emissão, Vencimento, Fornecedor, Valor (R$), Situação).");
            }

            // Clear input for further uses without reload
            event.target.value = '';
        };

        reader.readAsArrayBuffer(file);
    },

    parseExcelDate(dateVal) {
        if (!dateVal) return new Date().toISOString().split('T')[0];

        // Handle Excel Date Serial Numbers (e.g. 44562)
        if (typeof dateVal === 'number') {
            const date = new Date((dateVal - (25567 + 2)) * 86400 * 1000);
            return date.toISOString().split('T')[0];
        }

        // Handle parsed strings
        if (typeof dateVal === 'string') {
            if (dateVal.includes('/')) {
                const parts = dateVal.split('/');
                if (parts.length === 3) {
                    if (parts[2].length === 4) { // DD/MM/YYYY
                        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                    } else if (parts[0].length === 4) { // YYYY/MM/DD
                        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                    }
                }
            }
            // Std Parse
            const d = new Date(dateVal);
            if (!isNaN(d.getTime())) {
                return d.toISOString().split('T')[0];
            }
        }

        return new Date().toISOString().split('T')[0];
    },

    getFilteredExpenses() {
        const expenses = Store.getExpenses();
        const fUnidade = document.getElementById('filter-unidade').value;
        const fSituacao = document.getElementById('filter-situacao').value;
        const fFornecedor = document.getElementById('filter-fornecedor').value.toLowerCase();
        const fMesStr = document.getElementById('filter-mes').value; // YYYY-MM

        return expenses.filter(exp => {
            if (fUnidade && exp.unidade !== fUnidade) return false;
            if (fSituacao && exp.situacao !== fSituacao) return false;
            if (fFornecedor && !exp.fornecedor.toLowerCase().includes(fFornecedor)) return false;
            if (fMesStr) {
                const expMesStr = exp.dtPagto.substring(0, 7); // YYYY-MM
                if (expMesStr !== fMesStr) return false;
            }
            return true;
        }).sort((a, b) => new Date(b.dtPagto) - new Date(a.dtPagto)); // Sort desc payment date
    },

    render() {
        if (!document.getElementById('view-expenses').classList.contains('active')) return;

        const tbody = document.querySelector('#expenses-table tbody');
        tbody.innerHTML = '';

        const filtered = this.getFilteredExpenses();

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">Nenhuma despesa encontrada.</td></tr>`;
            return;
        }

        const isReadOnly = App.user && App.user.role === 'gestor';

        filtered.forEach(exp => {
            const tr = document.createElement('tr');

            const statusClass = `status-${exp.situacao.toLowerCase()}`;
            const isLate = exp.situacao === 'Atrasado';

            let actionsHtml = '';
            if (!isReadOnly) {
                actionsHtml = `
                    <button class="btn-icon" title="Editar" onclick="window.ExpensesList.editExpense('${exp.id}')">
                        <i class="fa-solid fa-pen" style="color: var(--info); font-size: 0.9rem;"></i>
                    </button>
                    <button class="btn-icon" title="Excluir" onclick="window.ExpensesList.deleteExpense('${exp.id}')">
                        <i class="fa-solid fa-trash" style="color: var(--danger); font-size: 0.9rem;"></i>
                    </button>
                `;
            } else {
                actionsHtml = `<span style="color: var(--text-muted); font-size: 0.8rem;">Visualização</span>`;
            }

            const totalVal = parseFloat(exp.valor) + parseFloat(exp.multa || 0);

            tr.innerHTML = `
                <td><strong>${exp.nota}</strong></td>
                <td>${exp.unidade}</td>
                <td>${exp.fornecedor}</td>
                <td style="color: var(--text-secondary); font-size: 0.85rem;">${App.formatDate(exp.dtPedido)}</td>
                <td style="color: ${isLate ? 'var(--danger)' : 'inherit'}; font-weight: ${isLate ? 600 : 'normal'}">${App.formatDate(exp.dtPagto)}</td>
                <td>
                    ${App.formatCurrency(exp.valor)}
                    ${parseFloat(exp.multa) > 0 ? `<br><small style="color: var(--danger)">+ Multa: ${App.formatCurrency(exp.multa)}</small>` : ''}
                </td>
                <td><span class="status-badge ${statusClass}">${exp.situacao}</span></td>
                <td>
                    <div style="display: flex; gap: 0.25rem;">
                        ${actionsHtml}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
};

// Auto init
document.addEventListener('DOMContentLoaded', () => {
    window.ExpensesList.init();
});
