import { Router } from 'express';
import prisma from '../utils/db';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Middleware de proteção aplicado a todas as rotas de despesas
router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar despesas' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body;
    // O usuário que criou vem do token extraído pelo middleware
    const userId = (req as any).user?.id;

    const newExpense = await prisma.expense.create({
      data: {
        ...data,
        userId
      }
    });

    res.status(201).json(newExpense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar despesa' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data
    });

    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar despesa' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Apenas admin/financeiro podem deletar (validação extra real)
    const role = (req as any).user?.role;
    
    if (role === 'gestor') {
      res.status(403).json({ error: 'Acesso negado: Gestores não podem deletar registros.' });
      return;
    }

    await prisma.expense.delete({ where: { id } });
    res.json({ message: 'Despesa removida com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover despesa' });
  }
});

export default router;
