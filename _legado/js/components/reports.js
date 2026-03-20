/**
 * Reports and Exporting Component
 */

window.Reports = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('btn-export-excel').addEventListener('click', () => this.exportToExcel());
        document.getElementById('btn-export-pdf').addEventListener('click', () => this.exportToPDF());
    },

    render() {
        if (!document.getElementById('view-reports').classList.contains('active')) return;

        const revenues = Store.getUnitsRevenue();
        const expenses = Store.getExpenses();
        
        const currentMonth = new Date().getMonth(); // simplistic current month filter for general reporting
        const currentYear = new Date().getFullYear();

        const unitsData = {};
        Object.keys(revenues).forEach(u => {
            unitsData[u] = {
                revenue: revenues[u],
                expenses: 0
            };
        });

        // Compute expenses per unit for current month
        expenses.forEach(exp => {
            const parts = exp.dtPagto.split('-');
            if (parts.length === 3) {
                const m = parseInt(parts[1], 10) - 1;
                const y = parseInt(parts[0], 10);
                
                if (m === currentMonth && y === currentYear) {
                    if (!unitsData[exp.unidade]) {
                        unitsData[exp.unidade] = { revenue: 0, expenses: 0 };
                    }
                    unitsData[exp.unidade].expenses += (parseFloat(exp.valor) + parseFloat(exp.multa || 0));
                }
            }
        });

        const tbody = document.querySelector('#reports-table tbody');
        tbody.innerHTML = '';

        let tRev = 0, tExp = 0;

        Object.keys(unitsData).sort().forEach(unit => {
            const rev = unitsData[unit].revenue;
            const exp = unitsData[unit].expenses;
            const marginX = rev - exp;
            
            tRev += rev;
            tExp += exp;

            const tr = document.createElement('tr');
            
            let statusHtml = '';
            if (marginX > 0) statusHtml = `<span style="color: var(--success)"><i class="fa-solid fa-arrow-trend-up"></i> Positivo</span>`;
            else if (marginX < 0) statusHtml = `<span style="color: var(--danger)"><i class="fa-solid fa-arrow-trend-down"></i> Negativo</span>`;
            else statusHtml = `<span style="color: var(--warning)"><i class="fa-solid fa-minus"></i> Neutro</span>`;

            tr.innerHTML = `
                <td><strong>${unit}</strong></td>
                <td style="color: var(--info)">${App.formatCurrency(rev)}</td>
                <td style="color: var(--danger)">${App.formatCurrency(exp)}</td>
                <td style="font-weight: 700; color: ${marginX >= 0 ? 'var(--success)' : 'var(--danger)'}">${App.formatCurrency(marginX)}</td>
                <td>${statusHtml}</td>
            `;
            tbody.appendChild(tr);
        });

        // Total row
        const summaryTr = document.createElement('tr');
        summaryTr.style.backgroundColor = 'rgba(79, 70, 229, 0.1)';
        const totalMargin = tRev - tExp;
        summaryTr.innerHTML = `
            <td><strong>TOTAL (Mês Atual)</strong></td>
            <td><strong>${App.formatCurrency(tRev)}</strong></td>
            <td><strong>${App.formatCurrency(tExp)}</strong></td>
            <td><strong style="color: ${totalMargin >= 0 ? 'var(--success)' : 'var(--danger)'}">${App.formatCurrency(totalMargin)}</strong></td>
            <td></td>
        `;
        tbody.appendChild(summaryTr);
    },

    // -------------------------------------------------------------
    // EXPORT FUNCTIONS
    // -------------------------------------------------------------

    getExportData() {
        const filtered = window.ExpensesList ? window.ExpensesList.getFilteredExpenses() : Store.getExpenses();
        // Format for export
        return filtered.map(exp => ({
            'Nº Nota': exp.nota,
            'Unidade': exp.unidade,
            'Fornecedor': exp.fornecedor,
            'Emissão': App.formatDate(exp.dtPedido),
            'Vencimento': App.formatDate(exp.dtPagto),
            'Valor (R$)': (parseFloat(exp.valor) + parseFloat(exp.multa || 0)).toFixed(2).replace('.', ','),
            'Situação': exp.situacao,
            'Responsável': exp.responsavel
        }));
    },

    exportToExcel() {
        const data = this.getExportData();
        if(!data || data.length === 0) {
            alert("Nenhum dado para exportar");
            return;
        }

        try {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Despesas");
            XLSX.writeFile(workbook, `Relatorio_Despesas_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch(e) {
            console.error("Erro ao exportar Excel:", e);
            alert("Não foi possível gerar o arquivo Excel.");
        }
    },

    exportToPDF() {
        if(typeof window.jspdf === 'undefined') {
            console.error("jsPDF not loaded");
            return;
        }

        const data = this.getExportData();
        if(!data || data.length === 0) {
            alert("Nenhum dado para exportar");
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'landscape' });

            doc.setFontSize(16);
            doc.text("Relatório de Despesas Corporativas", 14, 15);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 22);

            // Prepare columns and rows
            const columns = Object.keys(data[0]);
            const rows = data.map(obj => Object.values(obj));

            doc.autoTable({
                head: [columns],
                body: rows,
                startY: 30,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] },
                styles: { fontSize: 8, cellPadding: 3 }
            });

            doc.save(`Relatorio_Despesas_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch(e) {
            console.error("Erro ao exportar PDF:", e);
            alert("Não foi possível gerar o arquivo PDF.");
        }
    }
};

// Auto init
document.addEventListener('DOMContentLoaded', () => {
    window.Reports.init();
});
