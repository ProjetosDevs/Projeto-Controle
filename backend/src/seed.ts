import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando script de seed (populando banco com dados iniciais)...');
  
  const adminExists = await prisma.user.findUnique({ where: { username: 'admin' } });
  
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const gestorPassword = await bcrypt.hash('gestor123', 10);

    await prisma.user.createMany({
       data: [
         { username: 'admin', password: hashedPassword, role: 'admin' },
         { username: 'gestor01', password: gestorPassword, role: 'gestor' }
       ]
    });
    console.log('✅ Usuários "admin" (senha: admin123) e "gestor01" (senha: gestor123) criados.');
  } else {
    console.log('⚠️ Usuários padrão já existem no banco.');
  }

  // Despesas Exemplo
  const count = await prisma.expense.count();
  if (count === 0) {
      await prisma.expense.createMany({
          data: [
            { nota: '1001', unidade: 'BDM1', dtPedido: '2023-10-01', dtPagto: '2023-10-10', valor: 1500.00, situacao: 'Pago', fornecedor: 'AWS Brasil', responsavel: 'Carlos', sistema: 'Linx', multa: 0, obs: 'Servidores Mês Outubro' },
            { nota: '1002', unidade: 'CN1', dtPedido: '2023-11-05', dtPagto: '2026-12-05', valor: 850.50, situacao: 'Pendente', fornecedor: 'Limpeza e Cia', responsavel: 'Ana', sistema: '', multa: 0, obs: 'Contrato de limpeza' },
            { nota: '1003', unidade: 'RB133', dtPedido: '2023-09-15', dtPagto: '2023-09-30', valor: 3000.00, situacao: 'Atrasado', fornecedor: 'Agência Marketing X', responsavel: 'Roberto', sistema: '', multa: 150.00, obs: 'Campanha Q3' }
          ]
      });
      console.log('✅ Gastos iniciais de exemplo inseridos com sucesso!');
  } else {
      console.log('⚠️ As despesas já foram populadas anteriormente.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Seed Finalizado.');
  });
