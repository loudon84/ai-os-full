export function createRiskAlertMock() {
  return {
    kind: "risk.alert.summary" as const,
    payload: {
      title: "Risk Alert",
      level: "high" as const,
      topic: "A/R concentration",
      impact: "Top 3 customers account for 61% of outstanding receivables",
      recommendation: "Review limit policy and accelerate collection",
    },
  };
}

export function createRiskExposureMock() {
  return {
    kind: "risk.exposure.table" as const,
    payload: {
      title: "Risk Exposure",
      rows: [
        {
          customerName: "ACME HK",
          exposureAmount: 300000,
          overdueAmount: 120000,
          riskLevel: "high" as const,
        },
        {
          customerName: "Nova SG",
          exposureAmount: 180000,
          overdueAmount: 30000,
          riskLevel: "medium" as const,
        },
      ],
    },
  };
}

export function createOverdueCustomerListMock() {
  return {
    kind: "risk.overdue.customer-list" as const,
    payload: {
      title: "Overdue Customers",
      rows: [
        { customerName: "ACME HK", orderNo: "SO-2026-001", overdueDays: 45, amount: 120000, owner: "Alice" },
        { customerName: "Beta Corp", orderNo: "SO-2026-003", overdueDays: 12, amount: 35000, owner: "Bob" },
      ],
    },
  };
}

export function createCreditLimitUsageMock() {
  return {
    kind: "risk.credit.limit-usage" as const,
    payload: [
      { customerName: "ACME HK", creditLimit: 500000, usedAmount: 300000, usageRatio: 0.6, remainingAmount: 200000 },
      { customerName: "Nova SG", creditLimit: 250000, usedAmount: 180000, usageRatio: 0.72, remainingAmount: 70000 },
    ],
  };
}
