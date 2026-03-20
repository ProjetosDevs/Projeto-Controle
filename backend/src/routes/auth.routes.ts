import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/db';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    
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
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'financeiro-corp-secret-key-2026',
      { expiresIn: '8h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });

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

    await prisma.user.createMany({
       data: [
         { username: 'admin', password: hashedPassword, role: 'admin' },
         { username: 'gestor01', password: gestorPassword, role: 'gestor' }
       ]
    });

    res.json({ message: 'Usuários de teste criados com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar usuários' });
  }
});

export default router;
