/**
 * Main Application Controller
 */

const App = {
    user: null, // { username, role }

    init() {
        // Obter usuário logado do sessionStorage
        const sessionUser = sessionStorage.getItem('corp_auth_user');
        if (sessionUser) {
            this.user = JSON.parse(sessionUser);
            this.setupAppView();
        } else {
            this.showLogin();
        }

        this.bindGlobalEvents();
    },

    bindGlobalEvents() {
        // Login Submit
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const role = document.getElementById('role').value;
                
                this.user = { username, role };
                sessionStorage.setItem('corp_auth_user', JSON.stringify(this.user));
                
                this.setupAppView();
                // trigger dash refresh
                if(window.Dashboard) window.Dashboard.render();
                if(window.ExpensesList) window.ExpensesList.render();
            });
        }

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            sessionStorage.removeItem('corp_auth_user');
            this.user = null;
            this.showLogin();
        });

        // Setup Sidebar Navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Update active nav
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                // Show view
                const targetViewId = 'view-' + item.dataset.target;
                document.querySelectorAll('.content-view').forEach(view => {
                    view.classList.remove('active');
                });
                document.getElementById(targetViewId).classList.add('active');

                // Trigger render cycle if component exists
                if(item.dataset.target === 'dashboard' && window.Dashboard) window.Dashboard.render();
                if(item.dataset.target === 'expenses' && window.ExpensesList) window.ExpensesList.render();
                if(item.dataset.target === 'reports' && window.Reports) window.Reports.render();
            });
        });
    },

    showLogin() {
        document.getElementById('app-view').classList.remove('active');
        document.getElementById('login-view').classList.add('active');
    },

    setupAppView() {
        document.getElementById('login-view').classList.remove('active');
        document.getElementById('app-view').classList.add('active');

        // Render User Info
        document.getElementById('current-user-name').textContent = this.user.username;
        const roleNames = {
            'admin': 'Administrador',
            'financeiro': 'Financeiro',
            'gestor': 'Gestor (Leitura)'
        };
        document.getElementById('current-user-role').textContent = roleNames[this.user.role];

        this.applyRoleRestrictions();

        // Default route is dashboard
        if(window.Dashboard) window.Dashboard.render();
        if(window.ExpensesList) window.ExpensesList.render();
        if(window.Reports) window.Reports.render();
    },

    applyRoleRestrictions() {
        // Role Gestor = View Only. Disable creation/editing.
        const restrictedActions = document.querySelectorAll('.action-restricted');
        if (this.user.role === 'gestor') {
            restrictedActions.forEach(el => {
                el.classList.add('disabled');
                el.style.display = 'none'; 
            });
        } else {
            restrictedActions.forEach(el => {
                el.classList.remove('disabled');
                el.style.display = ''; 
            });
        }
    },
    
    // Formatting Utils
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    },
    
    formatDate(dateString) {
        if(!dateString) return '-';
        const parts = dateString.split('-'); // YYYY-MM-DD
        if(parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return dateString;
    }
};

// Initialize after page load
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
