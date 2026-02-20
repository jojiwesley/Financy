/**
 * ============================================================
 * Testes de cálculo — Saldo Total vs Economia
 * ============================================================
 *
 * POR QUE "SALDO TOTAL" E "ECONOMIA" SÃO DIFERENTES?
 *
 * • SALDO TOTAL: patrimônio acumulado em todas as contas.
 *   = saldo_inicial_da_conta + TODAS as entradas/saídas (all-time)
 *   Exemplo: você abriu a conta com R$1.000 (janeiro), em fevereiro ganhou
 *   R$500. Saldo Total = R$1.500
 *
 * • ECONOMIA (savings): resultado LÍQUIDO apenas do mês atual.
 *   = entradas_do_mês - saídas_do_mês
 *   Exemplo: neste mês entrou R$500 e saiu R$200. Economia = R$300.
 *
 * Eles só seriam iguais se a conta fosse criada do zero neste mês
 * e você não tivesse saldo inicial.
 * ============================================================
 */

import { describe, it, expect } from "vitest";
import {
  buildAccountBalanceMap,
  computeAccountCurrentBalance,
  computeTotalBalance,
  computeMonthlyTotals,
  computeProjectedBalance,
  type AccountRow,
  type TransactionRow,
} from "@/lib/balance-calculations";

// ─── helpers ──────────────────────────────────────────────────────────────────
function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function printSection(title: string) {
  console.log("\n" + "═".repeat(60));
  console.log("  " + title);
  console.log("═".repeat(60));
}

function printMap(label: string, map: Map<string, number>) {
  console.log(`\n  ${label}:`);
  if (map.size === 0) {
    console.log("    (vazio — nenhuma transação vinculada a conta)");
    return;
  }
  for (const [id, val] of map) {
    console.log(`    ${id}: ${brl(val)}`);
  }
}

// ─── Cenário 1: caso básico, uma conta, mês corrente ─────────────────────────
describe("Cenário 1 — Uma conta, transações apenas neste mês", () => {
  const accounts: AccountRow[] = [
    { id: "acc-1", name: "Nubank", balance: 1000 }, // R$1.000 de saldo inicial
  ];

  const thisMonthTx: TransactionRow[] = [
    {
      id: "t1",
      type: "income",
      amount: 5000,
      account_id: "acc-1",
      date: "2026-02-05",
    },
    {
      id: "t2",
      type: "expense",
      amount: 1200,
      account_id: "acc-1",
      date: "2026-02-10",
    },
    {
      id: "t3",
      type: "expense",
      amount: 300,
      account_id: "acc-1",
      date: "2026-02-15",
    },
  ];

  it("buildAccountBalanceMap — delta das transações (sem saldo inicial)", () => {
    printSection("Cenário 1 — buildAccountBalanceMap");
    const map = buildAccountBalanceMap(thisMonthTx);
    printMap("Delta por conta (entrada - saída)", map);

    console.log(`\n  acc-1 delta esperado: +5000 - 1200 - 300 = +3500`);
    expect(map.get("acc-1")).toBe(3500);
  });

  it("computeTotalBalance — saldo inicial + delta = saldo real", () => {
    printSection("Cenário 1 — computeTotalBalance");
    const map = buildAccountBalanceMap(thisMonthTx);
    const total = computeTotalBalance(accounts, map);

    console.log(`\n  Conta: ${accounts[0].name}`);
    console.log(
      `    Saldo inicial (configurado na conta): ${brl(accounts[0].balance ?? 0)}`,
    );
    console.log(
      `    Delta transações (all-time):          ${brl(map.get("acc-1") ?? 0)}`,
    );
    console.log(`    ─────────────────────────────────────────`);
    console.log(`    SALDO TOTAL:                          ${brl(total)}`);

    expect(total).toBe(4500); // 1000 + 3500
  });

  it("computeMonthlyTotals — economia = só entradas - saídas do mês", () => {
    printSection("Cenário 1 — computeMonthlyTotals (Economia)");
    const { income, expenses, savings, savingsRate } =
      computeMonthlyTotals(thisMonthTx);

    console.log(`\n  Transações do mês:`);
    thisMonthTx.forEach((t) =>
      console.log(
        `    [${t.type.padEnd(7)}] ${brl(t.amount ?? 0)}  conta: ${t.account_id}`,
      ),
    );
    console.log(`\n  Entradas do mês: ${brl(income)}`);
    console.log(`  Saídas do mês:   ${brl(expenses)}`);
    console.log(
      `  ECONOMIA (savings): ${brl(savings)} (${savingsRate}% da renda)`,
    );

    expect(income).toBe(5000);
    expect(expenses).toBe(1500);
    expect(savings).toBe(3500);
    expect(savingsRate).toBe(70);
  });

  it("COMPARAÇÃO — Por que Saldo Total ≠ Economia", () => {
    printSection("Cenário 1 — COMPARAÇÃO DIRETA");
    const map = buildAccountBalanceMap(thisMonthTx);
    const totalBalance = computeTotalBalance(accounts, map);
    const { savings } = computeMonthlyTotals(thisMonthTx);

    console.log(`\n  ┌──────────────────────────────────────────────┐`);
    console.log(
      `  │  SALDO TOTAL:  ${brl(totalBalance).padStart(12)}                      │`,
    );
    console.log(
      `  │  = saldo_inicial(${brl(accounts[0].balance ?? 0)}) + delta_tx(${brl(map.get("acc-1") ?? 0)})       │`,
    );
    console.log(`  ├──────────────────────────────────────────────┤`);
    console.log(
      `  │  ECONOMIA:    ${brl(savings).padStart(12)}                      │`,
    );
    console.log(
      `  │  = entradas_mês(${brl(5000)}) - saídas_mês(${brl(1500)})     │`,
    );
    console.log(`  └──────────────────────────────────────────────┘`);
    console.log(`\n  DIFERENÇA = ${brl(totalBalance - savings)}`);
    console.log(
      `  → Essa diferença é exatamente o saldo inicial da conta: ${brl(accounts[0].balance ?? 0)}`,
    );
    console.log(`    O saldo total INCLUI o dinheiro que já estava na conta.`);
    console.log(
      `    Economia mostra apenas o resultado deste mês, sem o patrimônio anterior.`,
    );

    // A diferença é exatamente o saldo inicial
    expect(totalBalance - savings).toBe(accounts[0].balance ?? 0);
  });
});

// ─── Cenário 2: transações de meses anteriores acumuladas ────────────────────
describe("Cenário 2 — Meses anteriores acumulados (por que o saldo é maior)", () => {
  const accounts: AccountRow[] = [
    { id: "acc-1", name: "Inter", balance: 0 }, // sem saldo inicial
  ];

  // Meses passados — todosJaneiro+fevereiro
  const allTimeTx: TransactionRow[] = [
    // Janeiro
    {
      id: "j1",
      type: "income",
      amount: 4000,
      account_id: "acc-1",
      date: "2026-01-05",
    },
    {
      id: "j2",
      type: "expense",
      amount: 2000,
      account_id: "acc-1",
      date: "2026-01-20",
    },
    // Fevereiro (mês atual)
    {
      id: "f1",
      type: "income",
      amount: 4500,
      account_id: "acc-1",
      date: "2026-02-05",
    },
    {
      id: "f2",
      type: "expense",
      amount: 1000,
      account_id: "acc-1",
      date: "2026-02-18",
    },
  ];

  // Apenas fevereiro (mês atual)
  const currentMonthTx = allTimeTx.filter((t) => t.date?.startsWith("2026-02"));

  it("saldo total considera todos os meses, economia só o atual", () => {
    printSection("Cenário 2 — All-time vs Mês atual");

    const map = buildAccountBalanceMap(allTimeTx);
    const totalBalance = computeTotalBalance(accounts, map);
    const { income, expenses, savings } = computeMonthlyTotals(currentMonthTx);

    console.log(`\n  Transações de TODOS OS MESES (alimentam o Saldo Total):`);
    allTimeTx.forEach((t) =>
      console.log(
        `    [${t.date}] [${t.type.padEnd(7)}] ${brl(t.amount ?? 0)}`,
      ),
    );

    console.log(`\n  Transações apenas de FEVEREIRO (alimentam a Economia):`);
    currentMonthTx.forEach((t) =>
      console.log(
        `    [${t.date}] [${t.type.padEnd(7)}] ${brl(t.amount ?? 0)}`,
      ),
    );

    console.log(`\n  SALDO TOTAL (all-time):    ${brl(totalBalance)}`);
    console.log(
      `    = jan(+4000-2000) + fev(+4500-1000) = +2000 + 3500 = ${brl(5500)}`,
    );
    console.log(`\n  ECONOMIA (só fevereiro):   ${brl(savings)}`);
    console.log(
      `    = entrada(${brl(income)}) - saída(${brl(expenses)}) = ${brl(savings)}`,
    );
    console.log(`\n  DIFERENÇA: ${brl(totalBalance - savings)}`);
    console.log(
      `  → Essa diferença é o resultado acumulado do mês anterior (janeiro).`,
    );

    expect(totalBalance).toBe(5500);
    expect(savings).toBe(3500);
    expect(totalBalance - savings).toBe(2000); // lucro de janeiro
  });
});

// ─── Cenário 3: transações SEM account_id (não contam no saldo total) ─────────
describe("Cenário 3 — Transações sem account_id (caso comum de erro)", () => {
  const accounts: AccountRow[] = [
    { id: "acc-1", name: "Bradesco", balance: 500 },
  ];

  const transactions: TransactionRow[] = [
    { id: "t1", type: "income", amount: 3000, account_id: "acc-1" },
    { id: "t2", type: "income", amount: 1500, account_id: null }, // ← SEM account_id!
    { id: "t3", type: "expense", amount: 800, account_id: undefined }, // ← SEM account_id!
  ];

  it("transações sem account_id NÃO entram no saldo total mas entram na economia", () => {
    printSection("Cenário 3 — Transações sem account_id");

    const map = buildAccountBalanceMap(transactions);
    const totalBalance = computeTotalBalance(accounts, map);
    const { income, expenses, savings } = computeMonthlyTotals(transactions);

    console.log(`\n  Transações:`);
    transactions.forEach((t) =>
      console.log(
        `    [${t.type.padEnd(7)}] ${brl(t.amount ?? 0)}  account_id: ${t.account_id ?? "NULO ⚠️"}`,
      ),
    );

    console.log(`\n  Delta no mapa de contas:`);
    printMap("  balancemap", map);

    console.log(`\n  SALDO TOTAL: ${brl(totalBalance)}`);
    console.log(
      `    = saldo_inicial(${brl(500)}) + só t1 que tem account_id(${brl(3000)}) = ${brl(3500)}`,
    );
    console.log(
      `    ⚠️  t2(+1500) e t3(-800) NÃO foram contabilizados no saldo total!`,
    );

    console.log(`\n  ECONOMIA: ${brl(savings)}`);
    console.log(
      `    = entradas(${brl(income)}) - saídas(${brl(expenses)}) = ${brl(savings)}`,
    );
    console.log(`    → Economia inclui t2 e t3 pois não filtra por account_id`);

    console.log(`\n  ⚠️  POSSÍVEL CAUSA DE DIVERGÊNCIA:`);
    console.log(`    Se você adicionar transações sem selecionar uma conta,`);
    console.log(`    elas contam na Economia mas NÃO atualizam o Saldo Total.`);

    expect(totalBalance).toBe(3500); // só t1 conta
    expect(savings).toBe(3700); // t1+t2 - t3 = 3700
    // Diferença = 3700 - 3500 = 200 = t2(1500) - t3(800) = 700... wait
    // savings = 3000 + 1500 - 800 = 3700
    // totalBalance = 500 + 3000 = 3500
    // diff = 200?? no...
    // savings(3700) vs totalBalance(3500): diff = 200
    // Hmm the saldo_inicial is 500, and t2-t3 not linked = +1500-800 = +700
    // totalBalance = 500 + 3000 = 3500 (saldo inicial + only linked tx)
    // savings = 3000 + 1500 - 800 = 3700
    // These differ because savings includes unlinked transactions (net +700)
    // and totalBalance includes saldo inicial (500) but not unlinked tx
    // So diff = 3700 - 3500 = 200...
    // Actually: if initial=0, totalBalance=3000, savings=3700, diff=700 (= unlinked net)
    // With initial=500: totalBalance=3500, savings still 3700, diff=200
    // That's initial(500) - unlinked_net(700) = -200... makes sense
    expect(savings - totalBalance).toBe(200);
  });
});

// ─── Cenário 4: conta com saldo inicial mas ZERO transações ─────────────────
describe("Cenário 4 — Conta com saldo inicial e zero transações este mês", () => {
  const accounts: AccountRow[] = [
    { id: "acc-1", name: "Poupança CEF", balance: 15000 },
  ];

  const thisMonthTx: TransactionRow[] = []; // nenhuma transação este mês

  it("saldo total = saldo inicial; economia = 0", () => {
    printSection("Cenário 4 — Conta sem movimento no mês");

    const map = buildAccountBalanceMap(thisMonthTx);
    const totalBalance = computeTotalBalance(accounts, map);
    const { income, expenses, savings } = computeMonthlyTotals(thisMonthTx);

    console.log(`\n  Conta: ${accounts[0].name}`);
    console.log(`  Saldo inicial: ${brl(accounts[0].balance ?? 0)}`);
    console.log(`  Transações neste mês: nenhuma`);
    console.log(`\n  SALDO TOTAL: ${brl(totalBalance)}`);
    console.log(`  ECONOMIA:    ${brl(savings)}`);
    console.log(
      `\n  → O saldo total aparece (${brl(15000)}) mas a economia é R$0,`,
    );
    console.log(`    pois não houve entradas NEM saídas este mês nessa conta.`);

    expect(totalBalance).toBe(15000);
    expect(savings).toBe(0);
    expect(income).toBe(0);
    expect(expenses).toBe(0);
  });
});

// ─── Cenário 5: projeto de saldo ─────────────────────────────────────────────
describe("Cenário 5 — Saldo Projetado", () => {
  it("saldo projetado = saldo total - contas a pagar pendentes", () => {
    printSection("Cenário 5 — Saldo Projetado");

    const totalBalance = 8000;
    const pendingBills = 2300;
    const projected = computeProjectedBalance(totalBalance, pendingBills);

    console.log(`\n  SALDO TOTAL:             ${brl(totalBalance)}`);
    console.log(`  Contas a pagar (pending): ${brl(pendingBills)}`);
    console.log(`  ─────────────────────────────────────────`);
    console.log(`  SALDO PROJETADO:          ${brl(projected)}`);
    console.log(`\n  → O saldo projetado simula quanto sobrará se você`);
    console.log(`    pagar TODAS as contas pendentes hoje.`);

    expect(projected).toBe(5700);
  });
});
