-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'gestor',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nota" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "dtPedido" TEXT NOT NULL,
    "dtPagto" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "situacao" TEXT NOT NULL,
    "responsavel" TEXT NOT NULL,
    "sistema" TEXT,
    "multa" REAL NOT NULL DEFAULT 0,
    "obs" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
