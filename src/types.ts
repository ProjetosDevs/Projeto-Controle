export interface Company {
  id: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'financeiro' | 'gestor';
  companyId?: string;
  company?: Company;
}

export interface Expense {
  id: string;
  nota: string;
  unidade: string;
  dtPedido: string;
  dtPagto: string;
  fornecedor: string;
  valor: number;
  situacao: string;
  responsavel: string;
  sistema: string;
  multa: number;
  obs: string;
}

export interface UnitsRevenue {
  [unit: string]: number;
}
