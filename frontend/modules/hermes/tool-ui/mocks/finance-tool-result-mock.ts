export function createFinanceKpiMock() {
  return {
    kind: "finance.kpi.summary" as const,
    payload: {
      title: "Finance KPIs",
      items: [
        { key: "revenue", label: "Revenue", value: 1280000, trend: "+8.2%" },
        { key: "gross_margin", label: "Gross Margin", value: "18.6%", trend: "+1.1pp" },
        { key: "cash_position", label: "Cash Position", value: 560000, trend: "-3.4%" },
      ],
    },
  };
}

export function createReceivableAgingMock() {
  return {
    kind: "finance.receivable.aging" as const,
    payload: {
      rows: [
        { bucket: "0-30", amount: 420000, ratio: 0.52 },
        { bucket: "31-60", amount: 180000, ratio: 0.22 },
        { bucket: "61-90", amount: 120000, ratio: 0.15 },
        { bucket: "90+", amount: 90000, ratio: 0.11 },
      ],
    },
  };
}

export function createCashflowTrendMock() {
  return {
    kind: "finance.cashflow.trend" as const,
    payload: {
      title: "Cashflow Trend",
      points: [
        { period: "2026-W15", inflow: 520000, outflow: 380000, net: 140000 },
        { period: "2026-W16", inflow: 610000, outflow: 420000, net: 190000 },
        { period: "2026-W17", inflow: 580000, outflow: 450000, net: 130000 },
      ],
    },
  };
}

export function createReceivableStatusMock() {
  return {
    kind: "finance.receivable.status" as const,
    payload: {
      rows: [
        { orderNo: "SO-2026-001", customerName: "ACME HK", amount: 120000, status: "overdue", dueDate: "2026-03-15" },
        { orderNo: "SO-2026-002", customerName: "Nova SG", amount: 85000, status: "pending", dueDate: "2026-04-20" },
      ],
    },
  };
}
