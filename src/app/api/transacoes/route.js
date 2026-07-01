import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const transacoes = await prisma.transacao.findMany({
    orderBy: { data: "desc" },
  });
  return NextResponse.json(transacoes);
}

export async function POST(request) {
  const body = await request.json();
  const { descricao, valor, tipo, categoria, data } = body;

  if (!descricao || !valor || !tipo || !categoria) {
    return NextResponse.json(
      { error: "Todos os campos são obrigatórios." },
      { status: 400 }
    );
  }

  const novaTransacao = await prisma.transacao.create({
    data: {
      descricao,
      valor: parseFloat(valor),
      tipo,
      categoria,
      data: data ? new Date(data) : new Date(),
    },
  });

  return NextResponse.json(novaTransacao, { status: 201 });
}
