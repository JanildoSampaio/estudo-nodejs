import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

const prisma = new PrismaClient();
const app = express();


app.use(express.json());
app.use(cors());

// Listar todos os usuários
app.get("/usuarios", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Criar um novo usuário
app.post("/usuarios", async (req, res) => {
  try {
    const { email, name, age } = req.body;                                  

    // Validação básica
    if (!email || !name || !age) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "Este email já está em uso" });
    }

    const user = await prisma.user.create({
      data: { email, name, age: parseInt(age) },
    });

    res.status(201).json({ message: "Usuário criado com sucesso", user });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    if (error instanceof prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({ error: "Este email já está em uso" });
      }
    }
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

// Atualizar um usuário existente
app.put("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, age } = req.body;

    // Validação básica
    if (!email && !name && !age) {
      return res.status(400).json({ error: "Pelo menos um campo deve ser fornecido para atualização" });
    }

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!existingUser) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Se o email for fornecido, verificar se já está em uso por outro usuário
    if (email && email !== existingUser.email) {
      const emailInUse = await prisma.user.findUnique({ where: { email } });
      if (emailInUse) {
        return res.status(409).json({ error: "Este email já está em uso por outro usuário" });
      }
    }

    // Atualizar o usuário
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        email: email || undefined,
        name: name || undefined,
        age: age ? parseInt(age) : undefined,
      },
    });

    res.json({ message: "Usuário atualizado com sucesso", user: updatedUser });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Remover um usuário existente
app.delete("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Converter o ID para String
    const userId = String(id);

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Remover o usuário
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: "Usuário removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});