-- CreateTable
CREATE TABLE "Transacao" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transacao_pkey" PRIMARY KEY ("id")
);
