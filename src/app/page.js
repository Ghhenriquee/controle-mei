"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CATEGORIAS = ["Vendas", "Serviços", "Material", "Transporte", "Impostos", "Outros"];

function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-3 text-sm">
        <p className="text-[#888] mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }} className="font-semibold">
            {p.name === "entradas" ? "Entradas" : "Saídas"}: {formatBRL(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function Home() {
  const [transacoes, setTransacoes] = useState([]);
  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    tipo: "entrada",
    categoria: "Vendas",
    data: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [deletando, setDeletando] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  async function carregarTransacoes() {
    const res = await fetch("/api/transacoes");
    const data = await res.json();
    setTransacoes(data);
  }

  useEffect(() => {
    carregarTransacoes();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/transacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({
      descricao: "",
      valor: "",
      tipo: "entrada",
      categoria: "Vendas",
      data: new Date().toISOString().split("T")[0],
    });
    setMostrarForm(false);
    await carregarTransacoes();
    setLoading(false);
  }

  async function handleDelete(id) {
    setDeletando(id);
    await fetch(`/api/transacoes/${id}`, { method: "DELETE" });
    await carregarTransacoes();
    setDeletando(null);
  }

  const totalEntradas = transacoes
    .filter((t) => t.tipo === "entrada")
    .reduce((acc, t) => acc + t.valor, 0);

  const totalSaidas = transacoes
    .filter((t) => t.tipo === "saida")
    .reduce((acc, t) => acc + t.valor, 0);

  const saldo = totalEntradas - totalSaidas;

  const dadosGrafico = (() => {
    const meses = {};
    transacoes.forEach((t) => {
      const d = new Date(t.data);
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      if (!meses[chave]) meses[chave] = { label, entradas: 0, saidas: 0 };
      if (t.tipo === "entrada") meses[chave].entradas += t.valor;
      else meses[chave].saidas += t.valor;
    });
    return Object.entries(meses)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  })();

  const limiteAnual = 81000;
  const faturamentoAnual = transacoes
    .filter((t) => t.tipo === "entrada" && new Date(t.data).getFullYear() === new Date().getFullYear())
    .reduce((acc, t) => acc + t.valor, 0);
  const percentualMEI = Math.min((faturamentoAnual / limiteAnual) * 100, 100);

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans">
      <header className="border-b border-[#1a1a1a] px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#c9f31d] rounded-md flex items-center justify-center">
            <span className="text-black text-xs font-black">M</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">Controle MEI</span>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-[#c9f31d] hover:bg-[#d4ff1e] text-black text-sm font-bold px-5 py-2 rounded-lg transition-all"
        >
          {mostrarForm ? "Cancelar" : "+ Nova transação"}
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-8 space-y-8">

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-6">
            <p className="text-[#555] text-xs uppercase tracking-widest mb-3">Entradas</p>
            <p className="text-[#c9f31d] text-3xl font-bold tracking-tight">{formatBRL(totalEntradas)}</p>
          </div>
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-6">
            <p className="text-[#555] text-xs uppercase tracking-widest mb-3">Saídas</p>
            <p className="text-red-400 text-3xl font-bold tracking-tight">{formatBRL(totalSaidas)}</p>
          </div>
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-6">
            <p className="text-[#555] text-xs uppercase tracking-widest mb-3">Saldo</p>
            <p className={`text-3xl font-bold tracking-tight ${saldo >= 0 ? "text-white" : "text-red-400"}`}>
              {formatBRL(saldo)}
            </p>
          </div>
        </div>

        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-6">
          <div className="flex justify-between items-center mb-3">
            <p className="text-[#555] text-xs uppercase tracking-widest">Limite MEI {new Date().getFullYear()}</p>
            <p className="text-sm text-[#888]">
              {formatBRL(faturamentoAnual)} <span className="text-[#444]">/ {formatBRL(limiteAnual)}</span>
            </p>
          </div>
          <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${percentualMEI}%`,
                backgroundColor: percentualMEI > 80 ? "#f87171" : "#c9f31d",
              }}
            />
          </div>
          <p className="text-xs text-[#444] mt-2">{percentualMEI.toFixed(1)}% do limite anual utilizado</p>
        </div>

        {mostrarForm && (
          <div className="bg-[#0f0f0f] border border-[#c9f31d]/20 rounded-2xl p-6">
            <h2 className="text-sm uppercase tracking-widest text-[#555] mb-5">Nova transação</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Descrição"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className="w-full bg-[#141414] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-[#444] outline-none focus:border-[#c9f31d]/50 transition-colors text-sm"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Valor (R$)"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  className="bg-[#141414] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-[#444] outline-none focus:border-[#c9f31d]/50 transition-colors text-sm"
                  required
                />
                <input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className="bg-[#141414] border border-[#222] rounded-xl px-4 py-3 text-white outline-none focus:border-[#c9f31d]/50 transition-colors text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="bg-[#141414] border border-[#222] rounded-xl px-4 py-3 text-white outline-none focus:border-[#c9f31d]/50 transition-colors text-sm"
                >
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  className="bg-[#141414] border border-[#222] rounded-xl px-4 py-3 text-white outline-none focus:border-[#c9f31d]/50 transition-colors text-sm"
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#c9f31d] hover:bg-[#d4ff1e] text-black font-bold py-3 rounded-xl transition-all disabled:opacity-40 text-sm"
              >
                {loading ? "Salvando..." : "Confirmar lançamento"}
              </button>
            </form>
          </div>
        )}

        {dadosGrafico.length > 0 && (
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-6">
            <p className="text-[#555] text-xs uppercase tracking-widest mb-6">Fluxo mensal</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dadosGrafico}>
                <defs>
                  <linearGradient id="gradEntradas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c9f31d" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#c9f31d" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradSaidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#444", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="entradas" stroke="#c9f31d" strokeWidth={2} fill="url(#gradEntradas)" />
                <Area type="monotone" dataKey="saidas" stroke="#f87171" strokeWidth={2} fill="url(#gradSaidas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div>
          <p className="text-[#555] text-xs uppercase tracking-widest mb-4">Lançamentos</p>
          {transacoes.length === 0 && (
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-10 text-center">
              <p className="text-[#333] text-sm">Nenhum lançamento ainda.</p>
              <p className="text-[#222] text-xs mt-1">Clique em "Nova transação" para começar.</p>
            </div>
          )}
          <div className="space-y-2">
            {transacoes.map((t) => (
              <div
                key={t.id}
                className="bg-[#0f0f0f] border border-[#1a1a1a] hover:border-[#2a2a2a] rounded-2xl px-6 py-4 flex justify-between items-center transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${t.tipo === "entrada" ? "bg-[#c9f31d]" : "bg-red-400"}`} />
                  <div>
                    <p className="font-medium text-sm text-white">{t.descricao}</p>
                    <p className="text-[#444] text-xs mt-0.5">
                      {t.categoria} · {new Date(t.data).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className={`font-bold text-base ${t.tipo === "entrada" ? "text-[#c9f31d]" : "text-red-400"}`}>
                    {t.tipo === "entrada" ? "+" : "−"} {formatBRL(t.valor)}
                  </p>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deletando === t.id}
                    className="opacity-0 group-hover:opacity-100 text-[#333] hover:text-red-400 transition-all disabled:opacity-30 text-lg"
                    title="Excluir"
                  >
                    {deletando === t.id ? "..." : "✕"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}