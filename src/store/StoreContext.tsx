import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Expense, UnitsRevenue, User } from '../types';

interface StoreContextData {
  user: User | null;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
  expenses: Expense[];
  saveExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  importExpenses: (newExpenses: Expense[]) => Promise<void>;
  unitsRevenue: UnitsRevenue;
  updateAllRevenues: (newRevenues: UnitsRevenue) => void;
  loading: boolean;
}

const StoreContext = createContext<StoreContextData>({} as StoreContextData);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [unitsRevenue, setUnitsRevenue] = useState<UnitsRevenue>({});
  const [loading, setLoading] = useState(true);

  // Initialize Auth
  useEffect(() => {
    const token = sessionStorage.getItem('corp_auth_token');
    const sessionUser = sessionStorage.getItem('corp_auth_user');
    
    if (token && sessionUser) {
      setUser(JSON.parse(sessionUser));
      fetchExpenses(token);
    } else {
      setLoading(false);
    }

    // Revenues (Simulated for now)
    const localRevenues = localStorage.getItem('corp_units_revenue');
    if (!localRevenues) {
      const revenues = { 'BDM1': 50000, 'BDM2': 45000, 'CN1': 80000, 'RB133': 60000, 'Outros': 20000 };
      localStorage.setItem('corp_units_revenue', JSON.stringify(revenues));
      setUnitsRevenue(revenues);
    } else {
      setUnitsRevenue(JSON.parse(localRevenues));
    }
  }, []);

  const fetchExpenses = async (token: string) => {
    try {
      const res = await fetch('http://localhost:3000/api/expenses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (e) {
      console.error('Falha ao buscar despesas', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: any) => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      sessionStorage.setItem('corp_auth_token', data.token);
      sessionStorage.setItem('corp_auth_user', JSON.stringify(data.user));
      setUser(data.user);
      await fetchExpenses(data.token);
    } catch (e: any) {
      alert(e.message || 'Erro no login');
    }
  };

  const logout = () => {
    sessionStorage.removeItem('corp_auth_token');
    sessionStorage.removeItem('corp_auth_user');
    setUser(null);
    setExpenses([]);
  };

  const saveExpense = async (expense: Expense) => {
    const token = sessionStorage.getItem('corp_auth_token');
    const isUpdate = !!expense.id && expense.id.length > 10; // UUID validation roughly
    
    const url = isUpdate 
        ? `http://localhost:3000/api/expenses/${expense.id}` 
        : `http://localhost:3000/api/expenses`;
        
    const method = isUpdate ? 'PUT' : 'POST';

    try {
      // Remove o id se for novo para o backend gerar via UUID
      const { id, ...data } = expense;
      const bodyData = isUpdate ? expense : data;
      
      const res = await fetch(url, {
        method,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        await fetchExpenses(token!);
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao salvar dsspesa');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteExpense = async (id: string) => {
    const token = sessionStorage.getItem('corp_auth_token');
    try {
      const res = await fetch(`http://localhost:3000/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        await fetchExpenses(token!);
      } else {
        const err = await res.json();
        alert(err.error || 'Nao foi possível deletar a despesa.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const importExpenses = async (newExpenses: Expense[]) => {
    // Para simplificar, poderíamos mandar em lote (ideal backend ter rota de import bulk), 
    // mas por hora iteramos salvando 1 a 1 ou localmente apenas salvamos os mockados.
    // Vamos chamar o endpoint POST para cada um
    const token = sessionStorage.getItem('corp_auth_token');
    
    for (const exp of newExpenses) {
        const { id, ...data } = exp;
        await fetch(`http://localhost:3000/api/expenses`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(data)
        });
    }
    await fetchExpenses(token!);
  };

  const updateAllRevenues = (newRevenues: UnitsRevenue) => {
    setUnitsRevenue(newRevenues);
    localStorage.setItem('corp_units_revenue', JSON.stringify(newRevenues));
  };

  return (
    <StoreContext.Provider value={{ user, login, logout, expenses, saveExpense, deleteExpense, importExpenses, unitsRevenue, updateAllRevenues, loading }}>
      {!loading && children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
