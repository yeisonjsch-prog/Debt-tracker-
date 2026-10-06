"use client";

import { useEffect, useMemo, useState } from "react";

const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export default function Home() {
  const [debts, setDebts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [form, setForm] = useState({
    name: "",
    balance: "",
    minimum: "",
    apr: "",
  });

  const [paymentDebt, setPaymentDebt] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("debt-payoff-debts");
      if (saved) setDebts(JSON.parse(saved));
    } catch (error) {
      console.error("Could not load debts", error);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem("debt-payoff-debts", JSON.stringify(debts));
    }
  }, [debts, loaded]);

  const totals = useMemo(() => {
    const original = debts.reduce(
      (sum, debt) => sum + Number(debt.originalBalance || 0),
      0
    );

    const remaining = debts.reduce(
      (sum, debt) => sum + Number(debt.balance || 0),
      0
    );

    const minimum = debts.reduce(
      (sum, debt) => sum + Number(debt.minimum || 0),
      0
    );

    const paid = Math.max(original - remaining, 0);
    const progress = original > 0 ? (paid / original) * 100 : 0;

    return { original, remaining, minimum, paid, progress };
  }, [debts]);

  const payoffMonths = useMemo(() => {
    if (totals.remaining <= 0) return 0;
    if (totals.minimum <= 0) return null;
    return Math.ceil(totals.remaining / totals.minimum);
  }, [totals]);

  const payoffDate = useMemo(() => {
    if (payoffMonths === null) return "Add monthly payments";
    if (payoffMonths === 0) return "Debt free!";

    const date = new Date();
    date.setMonth(date.getMonth() + payoffMonths);

    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }, [payoffMonths]);

  const chartPoints = useMemo(() => {
    if (totals.original <= 0) return [];

    const points = [];
    const months =
      payoffMonths && payoffMonths > 0 ? Math.min(payoffMonths, 24) : 12;

    for (let i = 0; i <= months; i++) {
      const projected = Math.max(
        totals.remaining - totals.minimum * i,
        0
      );

      points.push({
        month: i,
        balance: projected,
      });
    }

    return points;
  }, [totals, payoffMonths]);

  const chartPath = useMemo(() => {
    if (!chartPoints.length) return "";

    const width = 900;
    const height = 240;
    const maxBalance = Math.max(
      totals.original,
      ...chartPoints.map((point) => point.balance),
      1
    );

    return chartPoints
      .map((point, index) => {
        const x =
          chartPoints.length === 1
            ? 0
            : (index / (chartPoints.length - 1)) * width;

        const y = height - (point.balance / maxBalance) * height;

        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [chartPoints, totals.original]);

  function addDebt(event) {
    event.preventDefault();

    const balance = Number(form.balance);
    const minimum = Number(form.minimum);
    const apr = Number(form.apr || 0);

    if (!form.name.trim() || balance <= 0 || minimum < 0 || apr < 0) return;

    const debt = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      originalBalance: balance,
      balance,
      minimum,
      apr,
      totalPaid: 0,
      createdAt: new Date().toISOString(),
      payments: [],
    };

    setDebts((current) => [...current, debt]);

    setForm({
      name: "",
      balance: "",
      minimum: "",
      apr: "",
    });
  }

  function registerPayment(event) {
    event.preventDefault();

    const amount = Number(paymentAmount);
    if (!paymentDebt || amount <= 0) return;

    setDebts((current) =>
      current.map((debt) => {
        if (debt.id !== paymentDebt) return debt;

        const applied = Math.min(amount, debt.balance);

        return {
          ...debt,
          balance: Math.max(debt.balance - applied, 0),
          totalPaid: Number(debt.totalPaid || 0) + applied,
          payments: [
            ...(debt.payments || []),
            {
              id: crypto.randomUUID(),
              amount: applied,
              date: new Date().toISOString(),
            },
          ],
        };
      })
    );

    setPaymentAmount("");
  }

  function removeDebt(id) {
    setDebts((current) => current.filter((debt) => debt.id !== id));

    if (paymentDebt === id) {
      setPaymentDebt("");
      setPaymentAmount("");
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        color: "#111827",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontWeight: 900, fontSize: 22 }}>Debt Payoff</div>
            <div style={{ color: "#6b7280", fontSize: 13 }}>
              Your debt-free dashboard
            </div>
          </div>

          <nav
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {["Home", "Debts", "Strategy", "Plan", "Track"].map((item) => (
              <span
                key={item}
                style={{
                  padding: "9px 13px",
                  borderRadius: 999,
                  background: item === "Home" ? "#111827" : "transparent",
                  color: item === "Home" ? "#ffffff" : "#4b5563",
                }}
              >
                {item}
              </span>
            ))}
          </nav>
        </div>
      </header>

      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "34px 22px 70px",
        }}
      >
        <section style={{ marginBottom: 28 }}>
          <div style={{ color: "#6b7280", fontWeight: 700 }}>
            YOUR DEBT-FREE JOURNEY
          </div>

          <h1
            style={{
              fontSize: "clamp(32px, 6vw, 58px)",
              lineHeight: 1,
              margin: "10px 0",
              letterSpacing: "-0.04em",
            }}
          >
            Keep going.
          </h1>

          <p
            style={{
              color: "#6b7280",
              maxWidth: 650,
              fontSize: 17,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Every payment moves you closer to financial freedom. Track your
            balances, record payments and watch your debt disappear.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 16,
            marginBottom: 22,
          }}
        >
          <Card
            label="TOTAL DEBT"
            value={money(totals.original)}
            detail="Starting balance"
          />

          <Card
            label="REMAINING"
            value={money(totals.remaining)}
            detail="Left to pay"
          />

          <Card
            label="TOTAL PAID"
            value={money(totals.paid)}
            detail={`${totals.progress.toFixed(1)}% completed`}
          />

          <Card
            label="DEBT-FREE DATE"
            value={payoffDate}
            detail={
              payoffMonths === null
                ? "Enter monthly minimums"
                : payoffMonths === 0
                ? "You made it"
                : `About ${payoffMonths} months`
            }
          />
        </section>

        <section
          style={{
            background: "#111827",
            color: "#ffffff",
            borderRadius: 24,
            padding: 26,
            marginBottom: 22,
            boxShadow: "0 18px 45px rgba(17,24,39,.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 18,
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <div>
              <div
                style={{
                  color: "#9ca3af",
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                OVERALL PROGRESS
              </div>

              <div
                style={{
                  fontSize: 42,
                  fontWeight: 900,
                  marginTop: 5,
                }}
              >
                {totals.progress.toFixed(1)}%
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#9ca3af", fontSize: 13 }}>
                Monthly minimum
              </div>
              <div style={{ fontWeight: 900, fontSize: 24 }}>
                {money(totals.minimum)}
              </div>
            </div>
          </div>

          <div
            style={{
              height: 14,
              borderRadius: 999,
              background: "#374151",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.min(totals.progress, 100)}%`,
                height: "100%",
                background: "#ffffff",
                borderRadius: 999,
                transition: "width .3s ease",
              }}
            />
          </div>
        </section>

        <section
          style={{
            background: "#ffffff",
            borderRadius: 24,
            padding: 26,
            border: "1px solid #e5e7eb",
            marginBottom: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap",
              marginBottom: 28,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                }}
              >
                Payoff Timeline
              </div>

              <div
                style={{
                  color: "#6b7280",
                  marginTop: 5,
                }}
              >
                Projected remaining balance based on your monthly minimums.
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#6b7280", fontSize: 13 }}>
                Current balance
              </div>
              <div style={{ fontSize: 24, fontWeight: 900 }}>
                {money(totals.remaining)}
              </div>
            </div>
          </div>

          {chartPoints.length ? (
            <div style={{ width: "100%", overflowX: "auto" }}>
              <svg
                viewBox="0 0 900 280"
                width="100%"
                style={{ minWidth: 650, display: "block" }}
              >
                {[40, 100, 160, 220].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="900"
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                ))}

                <path
                  d={chartPath}
                  fill="none"
                  stroke="#111827"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          ) : (
            <div
              style={{
                minHeight: 230,
                display: "grid",
                placeItems: "center",
                borderRadius: 18,
                background: "#f9fafb",
                color: "#6b7280",
                textAlign: "center",
                padding: 30,
              }}
            >
              Add your first debt to build your payoff timeline.
            </div>
          )}
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20,
            marginBottom: 22,
          }}
        >
          <Panel title="Add a debt">
            <form onSubmit={addDebt}>
              <Input
                label="Debt name"
                placeholder="Capital One"
                value={form.name}
                onChange={(value) =>
                  setForm((current) => ({ ...current, name: value }))
                }
              />

              <Input
                label="Current balance"
                type="number"
                placeholder="2500"
                value={form.balance}
                onChange={(value) =>
                  setForm((current) => ({ ...current, balance: value }))
                }
              />

              <Input
                label="Minimum monthly payment"
                type="number"
                placeholder="75"
                value={form.minimum}
                onChange={(value) =>
                  setForm((current) => ({ ...current, minimum: value }))
                }
              />

              <Input
                label="Interest rate (APR %)"
                type="number"
                placeholder="24.99"
                value={form.apr}
                onChange={(value) =>
                  setForm((current) => ({ ...current, apr: value }))
                }
              />

              <Button>Add Debt</Button>
            </form>
          </Panel>

          <Panel title="Record a payment">
            {debts.length ? (
              <form onSubmit={registerPayment}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 800,
                    marginBottom: 8,
                  }}
                >
                  Choose debt
                </label>

                <select
                  value={paymentDebt}
                  onChange={(event) => setPaymentDebt(event.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select a debt</option>

                  {debts
                    .filter((debt) => debt.balance > 0)
                    .map((debt) => (
                      <option key={debt.id} value={debt.id}>
                        {debt.name} — {money(debt.balance)}
                      </option>
                    ))}
                </select>

                <Input
                  label="Payment amount"
                  type="number"
                  placeholder="100"
                  value={paymentAmount}
                  onChange={setPaymentAmount}
                />

                <Button>Record Payment</Button>
              </form>
            ) : (
              <div
                style={{
                  color: "#6b7280",
                  lineHeight: 1.6,
                }}
              >
                Add a debt first. Once you have a debt, you can record each
                payment here and the balance will decrease automatically.
              </div>
            )}
          </Panel>
        </section>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 24,
            padding: 26,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "end",
              gap: 15,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>Your Debts</div>
              <div style={{ color: "#6b7280", marginTop: 4 }}>
                {debts.length} active debt{debts.length === 1 ? "" : "s"}
              </div>
            </div>

            <div style={{ fontWeight: 900 }}>
              Remaining: {money(totals.remaining)}
            </div>
          </div>

          {debts.length === 0 ? (
            <div
              style={{
                background: "#f9fafb",
                borderRadius: 18,
                padding: 30,
                color: "#6b7280",
                textAlign: "center",
              }}
            >
              No debts added yet.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {debts.map((debt) => {
                const paid =
                  Number(debt.originalBalance) - Number(debt.balance);

                const percent =
                  Number(debt.originalBalance) > 0
                    ? (paid / Number(debt.originalBalance)) * 100
                    : 0;

                return (
                  <div
                    key={debt.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 18,
                      padding: 20,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 20,
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 19, fontWeight: 900 }}>
                          {debt.name}
                        </div>

                        <div
                          style={{
                            color: "#6b7280",
                            marginTop: 5,
                          }}
                        >
                          {debt.apr}% APR · {money(debt.minimum)} minimum
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 21, fontWeight: 900 }}>
                          {money(debt.balance)}
                        </div>

                        <div style={{ color: "#6b7280", fontSize: 13 }}>
                          {money(paid)} paid
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        height: 9,
                        background: "#e5e7eb",
                        borderRadius: 999,
                        overflow: "hidden",
                        marginTop: 17,
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(percent, 100)}%`,
                          height: "100%",
                          background: "#111827",
                          borderRadius: 999,
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 15,
                        marginTop: 13,
                      }}
                    >
                      <span
                        style={{
                          color: "#6b7280",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {percent.toFixed(1)}% paid
                      </span>

                      <button
                        type="button"
                        onClick={() => removeDebt(debt.id)}
                        style={{
                          border: 0,
                          background: "transparent",
                          color: "#6b7280",
                          cursor: "pointer",
                          fontWeight: 800,
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Card({ label, value, detail }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 22,
        padding: 22,
        boxShadow: "0 8px 25px rgba(17,24,39,.04)",
      }}
    >
      <div
        style={{
          color: "#6b7280",
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: ".08em",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 27,
          fontWeight: 900,
          marginTop: 9,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: "#6b7280",
          fontSize: 13,
          marginTop: 6,
        }}
      >
        {detail}
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 24,
        padding: 26,
      }}
    >
      <div
        style={{
          fontSize: 21,
          fontWeight: 900,
          marginBottom: 20,
        }}
      >
        {title}
      </div>

      {children}
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <label
      style={{
        display: "block",
        fontWeight: 800,
        marginBottom: 16,
      }}
    >
      <span style={{ display: "block", marginBottom: 8 }}>{label}</span>

      <input
        type={type}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

function Button({ children }) {
  return (
    <button
      type="submit"
      style={{
        width: "100%",
        border: 0,
        borderRadius: 14,
        background: "#111827",
        color: "#ffffff",
        padding: "14px 18px",
        fontSize: 15,
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #d1d5db",
  borderRadius: 13,
  background: "#ffffff",
  padding: "13px 14px",
  fontSize: 16,
  outline: "none",
  marginBottom: 16,
};
