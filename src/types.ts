export interface User {
  username: string;
  role: 'admin' | 'financeiro' | 'gestor';
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
