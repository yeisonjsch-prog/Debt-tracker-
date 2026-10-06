"use client";

import { useEffect, useMemo, useState } from "react";

const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));

export default function Home() {
  const [debts, setDebts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [form, setForm] = useState({
    name: "",
    balance: "",
    minimum: "",
    interest: "",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("debt-payoff-data");
      if (saved) setDebts(JSON.parse(saved));
    } catch (error) {
      console.error(error);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem("debt-payoff-data", JSON.stringify(debts));
    }
  }, [debts, loaded]);

  const totalDebt = useMemo(
    () => debts.reduce((sum, debt) => sum + debt.balance, 0),
    [debts]
  );

  const totalOriginal = useMemo(
    () => debts.reduce((sum, debt) => sum + debt.originalBalance, 0),
    [debts]
  );

  const totalPaid = Math.max(0, totalOriginal - totalDebt);

  const monthlyMinimum = useMemo(
    () => debts.reduce((sum, debt) => sum + debt.minimum, 0),
    [debts]
  );

  const progress =
    totalOriginal > 0
      ? Math.min(100, (totalPaid / totalOriginal) * 100)
      : 0;

  function addDebt(e) {
    e.preventDefault();

    const balance = Number(form.balance);
    const minimum = Number(form.minimum);
    const interest = Number(form.interest || 0);

    if (!form.name.trim() || balance <= 0 || minimum < 0) return;

    const debt = {
      id: Date.now(),
      name: form.name.trim(),
      originalBalance: balance,
      balance,
      minimum,
      interest,
      payments: [],
    };

    setDebts((current) => [...current, debt]);

    setForm({
      name: "",
      balance: "",
      minimum: "",
      interest: "",
    });
  }

  function registerPayment(id) {
    const raw = window.prompt("How much did you pay?");
    if (raw === null) return;

    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert("Enter a valid payment amount.");
      return;
    }

    setDebts((current) =>
      current.map((debt) => {
        if (debt.id !== id) return debt;

        const actualPayment = Math.min(amount, debt.balance);
        const newBalance = Math.max(0, debt.balance - actualPayment);

        return {
          ...debt,
          balance: newBalance,
          payments: [
            ...debt.payments,
            {
              id: Date.now(),
              amount: actualPayment,
              date: new Date().toISOString(),
              balanceAfter: newBalance,
            },
          ],
        };
      })
    );
  }

  function deleteDebt(id) {
    if (!window.confirm("Delete this debt?")) return;
    setDebts((current) => current.filter((debt) => debt.id !== id));
  }

  const history = useMemo(() => {
    const events = [];

    debts.forEach((debt) => {
      debt.payments.forEach((payment) => {
        events.push({
          ...payment,
          debtId: debt.id,
        });
      });
    });

    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (totalOriginal <= 0) return [];

    let running = totalOriginal;

    const points = [
      {
        label: "Start",
        balance: totalOriginal,
      },
    ];

    events.forEach((payment) => {
      running = Math.max(0, running - payment.amount);

      points.push({
        label: new Date(payment.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        balance: running,
      });
    });

    return points;
  }, [debts, totalOriginal]);

  return (
    <main
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: 5 }}>Debt Payoff</h1>
      <p style={{ marginTop: 0, opacity: 0.65 }}>
        Track your debts, payments and payoff progress.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 15,
          margin: "30px 0",
        }}
      >
        <Card title="Total Debt" value={money(totalDebt)} />
        <Card title="Monthly Minimum" value={money(monthlyMinimum)} />
        <Card title="Total Paid" value={money(totalPaid)} />
        <Card title="Progress" value={`${progress.toFixed(1)}%`} />
      </div>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 14,
          padding: 20,
          marginBottom: 25,
        }}
      >
        <h2>Payoff Progress</h2>

        <div
          style={{
            width: "100%",
            height: 18,
            background: "#eee",
            borderRadius: 20,
            overflow: "hidden",
            marginBottom: 25,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "#111",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        {history.length > 0 ? (
          <DebtChart data={history} />
        ) : (
          <p>Add a debt to start your progress chart.</p>
        )}
      </section>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 14,
          padding: 20,
          marginBottom: 25,
        }}
      >
        <h2>Add a Debt</h2>

        <form
          onSubmit={addDebt}
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          <input
            placeholder="Debt Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            style={inputStyle}
          />

          <input
            type="number"
            step="0.01"
            placeholder="Current Balance"
            value={form.balance}
            onChange={(e) =>
              setForm({ ...form, balance: e.target.value })
            }
            style={inputStyle}
          />

          <input
            type="number"
            step="0.01"
            placeholder="Minimum Monthly Payment"
            value={form.minimum}
            onChange={(e) =>
              setForm({ ...form, minimum: e.target.value })
            }
            style={inputStyle}
          />

          <input
            type="number"
            step="0.01"
            placeholder="Interest Rate (%)"
            value={form.interest}
            onChange={(e) =>
              setForm({ ...form, interest: e.target.value })
            }
            style={inputStyle}
          />

          <button type="submit" style={primaryButton}>
            Add a Debt
          </button>
        </form>
      </section>

      <section>
        <h2>Active Debts</h2>

        {debts.length === 0 && <p>No debts added yet.</p>}

        <div style={{ display: "grid", gap: 15 }}>
          {debts.map((debt) => {
            const paid = debt.originalBalance - debt.balance;
            const debtProgress =
              debt.originalBalance > 0
                ? (paid / debt.originalBalance) * 100
                : 0;

            return (
              <div
                key={debt.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 14,
                  padding: 20,
                }}
              >
                <h3 style={{ marginTop: 0 }}>{debt.name}</h3>

                <p>
                  Remaining Balance: <strong>{money(debt.balance)}</strong>
                </p>

                <p>
                  Original Balance: {money(debt.originalBalance)}
                </p>

                <p>
                  Paid: <strong>{money(paid)}</strong>
                </p>

                <p>
                  Minimum: {money(debt.minimum)} / month
                </p>

                <p>Interest: {debt.interest}%</p>

                <div
                  style={{
                    width: "100%",
                    height: 10,
                    background: "#eee",
                    borderRadius: 10,
                    overflow: "hidden",
                    margin: "15px 0",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, debtProgress)}%`,
                      height: "100%",
                      background: "#111",
                    }}
                  />
                </div>

                <p>{debtProgress.toFixed(1)}% paid</p>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => registerPayment(debt.id)}
                    style={primaryButton}
                  >
                    Register Payment
                  </button>

                  <button
                    onClick={() => deleteDebt(debt.id)}
                    style={secondaryButton}
                  >
                    Delete
                  </button>
                </div>

                {debt.payments.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <strong>Payment History</strong>

                    {debt.payments
                      .slice()
                      .reverse()
                      .map((payment) => (
                        <p key={payment.id} style={{ margin: "8px 0" }}>
                          {new Date(payment.date).toLocaleDateString()} —{" "}
                          {money(payment.amount)}
                        </p>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function Card({ title, value }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 14,
        padding: 20,
      }}
    >
      <div style={{ opacity: 0.65 }}>{title}</div>
      <div
        style={{
          fontSize: 26,
          fontWeight: "bold",
          marginTop: 8,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function DebtChart({ data }) {
  const width = 800;
  const height = 260;
  const padding = 45;

  const maxBalance = Math.max(...data.map((p) => p.balance), 1);

  const points = data.map((point, index) => {
    const x =
      data.length === 1
        ? padding
        : padding +
          (index / (data.length - 1)) * (width - padding * 2);

    const y =
      height -
      padding -
      (point.balance / maxBalance) * (height - padding * 2);

    return { ...point, x, y };
  });

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div style={{ overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{
          width: "100%",
          minWidth: 600,
          border: "1px solid #eee",
          borderRadius: 12,
        }}
      >
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#bbb"
        />

        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#bbb"
        />

        <polyline
          points={line}
          fill="none"
          stroke="#111"
          strokeWidth="4"
        />

        {points.map((point, index) => (
          <g key={index}>
            <circle cx={point.x} cy={point.y} r="6" fill="#111" />

            <text
              x={point.x}
              y={point.y - 12}
              textAnchor="middle"
              fontSize="12"
            >
              ${Math.round(point.balance)}
            </text>

            <text
              x={point.x}
              y={height - 18}
              textAnchor="middle"
              fontSize="11"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

const inputStyle = {
  padding: 12,
  border: "1px solid #ccc",
  borderRadius: 8,
  fontSize: 16,
};

const primaryButton = {
  padding: "12px 18px",
  background: "#111",
  color: "white",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 15,
};

const secondaryButton = {
  padding: "12px 18px",
  background: "white",
  color: "#111",
  border: "1px solid #ccc",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 15,
};
