import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/db';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ 
      where: { username },
      include: { company: true }
    });
    
    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      res.status(401).json({ error: 'Senha incorreta' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, companyId: user.companyId },
      process.env.JWT_SECRET || 'financeiro-corp-secret-key-2026',
      { expiresIn: '8h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, role: user.role, company: user.company } });

  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Seed Initial Admin User
router.post('/seed', async (req, res) => {
  try {
    const adminExists = await prisma.user.findUnique({ where: { username: 'admin' } });
    if (adminExists) {
      res.json({ message: 'Admin já existe' });
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const gestorPassword = await bcrypt.hash('gestor123', 10);

    let defaultCompany = await prisma.company.findUnique({ where: { name: 'FinanceiroCorp' } });
    if (!defaultCompany) {
      defaultCompany = await prisma.company.create({ data: { name: 'FinanceiroCorp' } });
    }

    await prisma.user.createMany({
       data: [
         { username: 'admin', password: hashedPassword, role: 'admin', companyId: defaultCompany.id },
         { username: 'gestor01', password: gestorPassword, role: 'gestor', companyId: defaultCompany.id }
       ]
    });

    res.json({ message: 'Empresa e Usuários de teste criados com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar usuários' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, role, companyName } = req.body;

    if (!companyName) {
      res.status(400).json({ error: 'Nome da empresa é obrigatório' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      res.status(400).json({ error: 'Usuário já existe' });
      return;
    }

    let company = await prisma.company.findUnique({ where: { name: companyName } });
    if (!company) {
      company = await prisma.company.create({ data: { name: companyName } });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || 'gestor';

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: userRole,
        companyId: company.id
      },
      include: { company: true }
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, companyId: user.companyId },
      process.env.JWT_SECRET || 'financeiro-corp-secret-key-2026',
      { expiresIn: '8h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, role: user.role, company: user.company } });

  } catch (error) {
    res.status(500).json({ error: 'Erro no servidor ao registrar' });
  }
});

export default router;
