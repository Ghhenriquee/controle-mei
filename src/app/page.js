"use client";

import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const CATEGORIAS = ["Vendas", "Serviços", "Material", "Transporte", "Impostos", "Outros"];
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const CORES_PIZZA = ["#c9f31d","#f87171","#60a5fa","#fb923c","#a78bfa","#34d399"];

function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
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

function Modal({ transacao, onClose, onSave }) {
  const [form, setForm] = useState({
    descricao: transacao.descricao,
    valor: transacao.valor,
    tipo: transacao.tipo,
    categoria: transacao.categoria,
    data: new Date(transacao.data).toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/transacoes/${transacao.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    await onSave();
    setLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-[#0f0f0f] border border-[#c9f31d]/20 rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-sm uppercase tracking-widest text-[#555]">Editar transação</h2>
          <button onClick={onClose} className="text-[#444] hover:text-white transition-colors">✕</button>
        </div>
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
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#141414] border border-[#222] text-[#555] font-bold py-3 rounded-xl transition-all text-sm hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#c9f31d] hover:bg-[#d4ff1e] text-black font-bold py-3 rounded-xl transition-all disabled:opacity-40 text-sm"
            >
              {loading ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  const anoAtual = new Date().getFullYear();
  const [transacoes, setTransacoes] = useState([]);
  const [form, setForm] = useState({
    descricao: "", valor: "", tipo: "entrada", categoria: "Vendas",
    data: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [deletando, setDeletando] = useState(null);
  const [editando, setEditando] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mesAberto, setMesAberto] = useState(null);
  const [aba, setAba] = useState("dashboard");
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);

  async function carregarTransacoes() {
    const res = await fetch("/api/transacoes");
    const data = await res.json();
    setTransacoes(data);
  }

  useEffect(() => { carregarTransacoes(); }, []);
  useEffect(() => { setMesAberto(null); }, [anoSelecionado]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/transacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ descricao: "", valor: "", tipo: "entrada", categoria: "Vendas", data: new Date().toISOString().split("T")[0] });
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

  async function exportarCSV() {
    const linhas = [
      ["ID","Descrição","Valor","Tipo","Categoria","Data"],
      ...transacoes.map((t) => [
        t.id, t.descricao, t.valor, t.tipo, t.categoria,
        new Date(t.data).toLocaleDateString("pt-BR"),
      ]),
    ];
    const csv = linhas.map((l) => l.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `controle-mei-${anoAtual}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalEntradas = transacoes.filter((t) => t.tipo === "entrada").reduce((a, t) => a + t.valor, 0);
  const totalSaidas = transacoes.filter((t) => t.tipo === "saida").reduce((a, t) => a + t.valor, 0);
  const saldo = totalEntradas - totalSaidas;

  const dadosGrafico = (() => {
    const meses = {};
    transacoes.forEach((t) => {
      const d = new Date(t.data);
      const chave = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      if (!meses[chave]) meses[chave] = { label, entradas: 0, saidas: 0 };
      if (t.tipo === "entrada") meses[chave].entradas += t.valor;
      else meses[chave].saidas += t.valor;
    });
    return Object.entries(meses).sort(([a],[b]) => a.localeCompare(b)).map(([,v]) => v);
  })();

  const dadosPizza = (() => {
    const cats = {};
    transacoes.filter((t) => t.tipo === "saida").forEach((t) => {
      cats[t.categoria] = (cats[t.categoria] || 0) + t.valor;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  })();

  const limiteAnual = 81000;
  const faturamentoAnual = transacoes.filter((t) => t.tipo === "entrada" && new Date(t.data).getFullYear() === anoAtual).reduce((a,t) => a+t.valor, 0);
  const percentualMEI = Math.min((faturamentoAnual / limiteAnual) * 100, 100);

  function transacoesDomes(mesIndex, ano) {
    return transacoes.filter((t) => {
      const d = new Date(t.data);
      return d.getMonth() === mesIndex && d.getFullYear() === ano;
    });
  }

  function CardTransacao({ t, tamanho = "normal" }) {
    return (
      <div className={`bg-[#0f0f0f] border border-[#1a1a1a] hover:border-[#2a2a2a] rounded-2xl ${tamanho === "normal" ? "px-6 py-4" : "px-4 py-3"} flex justify-between items-center transition-colors group`}>
        <div className="flex items-center gap-4">
          <div className={`${tamanho === "normal" ? "w-2 h-2" : "w-1.5 h-1.5"} rounded-full ${t.tipo === "entrada" ? "bg-[#c9f31d]" : "bg-red-400"}`} />
          <div>
            <p className={`font-medium ${tamanho === "normal" ? "text-sm" : "text-xs"} text-white`}>{t.descricao}</p>
            <p className="text-[#444] text-xs mt-0.5">{t.categoria} · {new Date(t.data).toLocaleDateString("pt-BR")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className={`font-bold ${tamanho === "normal" ? "text-base" : "text-sm"} ${t.tipo === "entrada" ? "text-[#c9f31d]" : "text-red-400"}`}>
            {t.tipo === "entrada" ? "+" : "−"} {formatBRL(t.valor)}
          </p>
          <button onClick={() => setEditando(t)} className="opacity-0 group-hover:opacity-100 text-[#444] hover:text-[#c9f31d] transition-all text-xs px-2 py-1 rounded border border-transparent hover:border-[#c9f31d]/30">
            editar
          </button>
          <button onClick={() => handleDelete(t.id)} disabled={deletando === t.id} className="opacity-0 group-hover:opacity-100 text-[#333] hover:text-red-400 transition-all text-lg disabled:opacity-30">
            {deletando === t.id ? "..." : "✕"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans">
      {editando && (
        <Modal transacao={editando} onClose={() => setEditando(null)} onSave={carregarTransacoes} />
      )}

      <header className="border-b border-[#1a1a1a] px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#c9f31d] rounded-md flex items-center justify-center">
            <span className="text-black text-xs font-black">M</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">Controle MEI</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#111] border border-[#1a1a1a] rounded-lg p-1">
            <button onClick={() => setAba("dashboard")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${aba === "dashboard" ? "bg-[#1e1e1e] text-white" : "text-[#555] hover:text-white"}`}>Dashboard</button>
            <button onClick={() => setAba("meses")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${aba === "meses" ? "bg-[#1e1e1e] text-white" : "text-[#555] hover:text-white"}`}>Por mês</button>
          </div>
          <button onClick={exportarCSV} className="border border-[#222] hover:border-[#333] text-[#555] hover:text-white text-sm px-4 py-2 rounded-lg transition-all">
            ↓ Exportar
          </button>
          <button onClick={() => setMostrarForm(!mostrarForm)} className="bg-[#c9f31d] hover:bg-[#d4ff1e] text-black text-sm font-bold px-5 py-2 rounded-lg transition-all">
            {mostrarForm ? "Cancelar" : "+ Nova transação"}
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-8 space-y-8">

        {mostrarForm && (
          <div className="bg-[#0f0f0f] border border-[#c9f31d]/20 rounded-2xl p-6">
            <h2 className="text-sm uppercase tracking-widest text-[#555] mb-5">Nova transação</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Descrição" value={form.descricao} onChange={(e) => setForm({...form, descricao: e.target.value})} className="w-full bg-[#141414] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-[#444] outline-none focus:border-[#c9f31d]/50 transition-colors text-sm" required />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Valor (R$)" value={form.valor} onChange={(e) => setForm({...form, valor: e.target.value})} className="bg-[#141414] border border-[#222] rounded-xl px-4 py-3 text-white placeholder-[#444] outline-none focus:border-[#c9f31d]/50 transition-colors text-sm" required />
                <input type="date" value={form.data} onChange={(e) => setForm({...form, data: e.target.value})} className="bg-[#141414] border border-[#222] rounded-xl px-4 py-3 text-white outline-none focus:border-[#c9f31d]/50 transition-colors text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select value={form.tipo} onChange={(e) => setForm({...form, tipo: e.target.value})} className="bg-[#141414] border border-[#222] rounded-xl px-4 py-3 text-white outline-none focus:border-[#c9f31d]/50 transition-colors text-sm">
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>
                <select value={form.categoria} onChange={(e) => setForm({...form, categoria: e.target.value})} className="bg-[#141414] border border-[#222] rounded-xl px-4 py-3 text-white outline-none focus:border-[#c9f31d]/50 transition-colors text-sm">
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#c9f31d] hover:bg-[#d4ff1e] text-black font-bold py-3 rounded-xl transition-all disabled:opacity-40 text-sm">
                {loading ? "Salvando..." : "Confirmar lançamento"}
              </button>
            </form>
          </div>
        )}

        {aba === "dashboard" && (
          <>
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
                <p className={`text-3xl font-bold tracking-tight ${saldo >= 0 ? "text-white" : "text-red-400"}`}>{formatBRL(saldo)}</p>
              </div>
            </div>

            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-6">
              <div className="flex justify-between items-center mb-3">
                <p className="text-[#555] text-xs uppercase tracking-widest">Limite MEI {anoAtual}</p>
                <p className="text-sm text-[#888]">{formatBRL(faturamentoAnual)} <span className="text-[#444]">/ {formatBRL(limiteAnual)}</span></p>
              </div>
              <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percentualMEI}%`, backgroundColor: percentualMEI > 80 ? "#f87171" : "#c9f31d" }} />
              </div>
              <p className="text-xs text-[#444] mt-2">{percentualMEI.toFixed(1)}% do limite anual utilizado</p>
            </div>

            <div className={`grid gap-4 ${dadosPizza.length > 0 ? "grid-cols-2" : "grid-cols-1"}`}>
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

              {dadosPizza.length > 0 && (
                <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-6">
                  <p className="text-[#555] text-xs uppercase tracking-widest mb-6">Saídas por categoria</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={dadosPizza} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        {dadosPizza.map((_, i) => (
                          <Cell key={i} fill={CORES_PIZZA[i % CORES_PIZZA.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatBRL(v)} />
                      <Legend formatter={(v) => <span style={{ color: "#888", fontSize: 11 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div>
              <p className="text-[#555] text-xs uppercase tracking-widest mb-4">Lançamentos</p>
              {transacoes.length === 0 && (
                <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-10 text-center">
                  <p className="text-[#333] text-sm">Nenhum lançamento ainda.</p>
                </div>
              )}
              <div className="space-y-2">
                {transacoes.map((t) => <CardTransacao key={t.id} t={t} />)}
              </div>
            </div>
          </>
        )}

        {aba === "meses" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-[#555] text-xs uppercase tracking-widest">Histórico mensal</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setAnoSelecionado((a) => a - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#111] border border-[#1a1a1a] text-[#555] hover:text-white hover:border-[#333] transition-all text-sm">←</button>
                <span className={`text-lg font-bold tracking-tight ${anoSelecionado === anoAtual ? "text-[#c9f31d]" : "text-white"}`}>{anoSelecionado}</span>
                <button onClick={() => setAnoSelecionado((a) => a + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#111] border border-[#1a1a1a] text-[#555] hover:text-white hover:border-[#333] transition-all text-sm">→</button>
              </div>
            </div>

            <div className="space-y-2">
              {MESES.map((nomeMes, idx) => {
                const lista = transacoesDomes(idx, anoSelecionado);
                const entradas = lista.filter((t) => t.tipo === "entrada").reduce((a,t) => a+t.valor, 0);
                const saidas = lista.filter((t) => t.tipo === "saida").reduce((a,t) => a+t.valor, 0);
                const saldoMes = entradas - saidas;
                const aberto = mesAberto === idx;
                const mesAtual = new Date().getMonth() === idx && anoSelecionado === anoAtual;

                return (
                  <div key={idx} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setMesAberto(aberto ? null : idx)}
                      className="w-full px-6 py-4 flex justify-between items-center hover:bg-[#111] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-semibold ${mesAtual ? "text-[#c9f31d]" : "text-white"}`}>{nomeMes}</span>
                        {mesAtual && <span className="text-[10px] bg-[#c9f31d]/10 text-[#c9f31d] px-2 py-0.5 rounded-full">mês atual</span>}
                        {lista.length === 0 && <span className="text-[10px] text-[#2a2a2a]">sem lançamentos</span>}
                      </div>
                      <div className="flex items-center gap-6">
                        {lista.length > 0 && (
                          <>
                            <span className="text-[#c9f31d] text-sm">+{formatBRL(entradas)}</span>
                            <span className="text-red-400 text-sm">−{formatBRL(saidas)}</span>
                            <span className={`text-sm font-bold ${saldoMes >= 0 ? "text-white" : "text-red-400"}`}>{formatBRL(saldoMes)}</span>
                          </>
                        )}
                        <span className={`text-[#333] text-xs transition-transform duration-300 inline-block ${aberto ? "rotate-180" : ""}`}>▼</span>
                      </div>
                    </button>

                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${aberto ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
                      <div className="border-t border-[#1a1a1a] px-6 py-4 space-y-2">
                        {lista.length === 0 ? (
                          <p className="text-[#333] text-sm text-center py-4">Nenhum lançamento em {nomeMes} de {anoSelecionado}.</p>
                        ) : (
                          lista.map((t) => (
                            <div key={t.id} className="flex justify-between items-center py-2 border-b border-[#141414] last:border-0 group">
                              <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-1.5 rounded-full ${t.tipo === "entrada" ? "bg-[#c9f31d]" : "bg-red-400"}`} />
                                <div>
                                  <p className="text-sm text-white">{t.descricao}</p>
                                  <p className="text-[#444] text-xs">{t.categoria} · {new Date(t.data).toLocaleDateString("pt-BR")}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <p className={`text-sm font-bold ${t.tipo === "entrada" ? "text-[#c9f31d]" : "text-red-400"}`}>
                                  {t.tipo === "entrada" ? "+" : "−"} {formatBRL(t.valor)}
                                </p>
                                <button onClick={() => setEditando(t)} className="opacity-0 group-hover:opacity-100 text-[#444] hover:text-[#c9f31d] transition-all text-xs px-2 py-1 rounded border border-transparent hover:border-[#c9f31d]/30">editar</button>
                                <button onClick={() => handleDelete(t.id)} disabled={deletando === t.id} className="opacity-0 group-hover:opacity-100 text-[#333] hover:text-red-400 transition-all text-sm">
                                  {deletando === t.id ? "..." : "✕"}
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}