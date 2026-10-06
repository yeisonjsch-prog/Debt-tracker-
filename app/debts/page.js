"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));

export default function DebtsPage() {
  const [debts, setDebts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    balance: "",
    minimum: "",
    apr: "",
    category: "Credit Card",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("debt-payoff-debts");
      if (saved) setDebts(JSON.parse(saved));
    } catch (error) {
      console.log("Could not load debts.");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("debt-payoff-debts", JSON.stringify(debts));
  }, [debts]);

  const totalDebt = useMemo(
    () => debts.reduce((sum, debt) => sum + Number(debt.balance || 0), 0),
    [debts]
  );

  const totalMinimum = useMemo(
    () => debts.reduce((sum, debt) => sum + Number(debt.minimum || 0), 0),
    [debts]
  );

  function resetForm() {
    setForm({
      name: "",
      balance: "",
      minimum: "",
      apr: "",
      category: "Credit Card",
    });
    setEditingId(null);
    setShowForm(false);
  }

  function saveDebt(e) {
    e.preventDefault();

    if (!form.name.trim() || Number(form.balance) <= 0) return;

    const debtData = {
      id: editingId || Date.now(),
      name: form.name.trim(),
      balance: Number(form.balance),
      minimum: Number(form.minimum || 0),
      apr: Number(form.apr || 0),
      category: form.category,
    };

    if (editingId) {
      setDebts((current) =>
        current.map((debt) => (debt.id === editingId ? debtData : debt))
      );
    } else {
      setDebts((current) => [...current, debtData]);
    }

    resetForm();
  }

  function editDebt(debt) {
    setForm({
      name: debt.name,
      balance: debt.balance,
      minimum: debt.minimum,
      apr: debt.apr,
      category: debt.category || "Credit Card",
    });
    setEditingId(debt.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteDebt(id) {
    if (window.confirm("Delete this debt?")) {
      setDebts((current) => current.filter((debt) => debt.id !== id));
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#4b5320",
        color: "#17210f",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        paddingBottom: 100,
      }}
    >
      <section
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "28px 16px 120px",
        }}
      >
        <header
          style={{
            color: "white",
            marginBottom: 22,
          }}
        >
          <p
            style={{
              margin: 0,
              opacity: 0.8,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 1.5,
            }}
          >
            DEBT PAYOFF
          </p>

          <h1
            style={{
              margin: "6px 0 4px",
              fontSize: 36,
              lineHeight: 1.1,
            }}
          >
            Debts
          </h1>

          <p style={{ margin: 0, opacity: 0.85 }}>
            Manage all your debts in one place.
          </p>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <SummaryCard title="Total Debt" value={money(totalDebt)} />
          <SummaryCard
            title="Monthly Minimum"
            value={money(totalMinimum)}
          />
        </div>

        <button
          onClick={() => {
            setEditingId(null);
            setForm({
              name: "",
              balance: "",
              minimum: "",
              apr: "",
              category: "Credit Card",
            });
            setShowForm((current) => !current);
          }}
          style={{
            width: "100%",
            border: 0,
            borderRadius: 18,
            padding: "16px 20px",
            background: "#d4a72c",
            color: "#17210f",
            fontSize: 17,
            fontWeight: 800,
            cursor: "pointer",
            marginBottom: 16,
          }}
        >
          + Add Debt
        </button>

        {showForm && (
          <form
            onSubmit={saveDebt}
            style={{
              background: "#f7f5ec",
              borderRadius: 24,
              padding: 20,
              marginBottom: 18,
              boxShadow: "0 8px 24px rgba(0,0,0,.12)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              {editingId ? "Edit Debt" : "Add a Debt"}
            </h2>

            <Field
              placeholder="Debt Name"
              value={form.name}
              onChange={(value) => setForm({ ...form, name: value })}
            />

            <Field
              type="number"
              placeholder="Current Balance"
              value={form.balance}
              onChange={(value) => setForm({ ...form, balance: value })}
            />

            <Field
              type="number"
              placeholder="Minimum Monthly Payment"
              value={form.minimum}
              onChange={(value) => setForm({ ...form, minimum: value })}
            />

            <Field
              type="number"
              placeholder="APR / Interest Rate (%)"
              value={form.apr}
              onChange={(value) => setForm({ ...form, apr: value })}
            />

            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
              style={inputStyle}
            >
              <option>Credit Card</option>
              <option>Personal Loan</option>
              <option>Auto Loan</option>
              <option>Other</option>
            </select>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginTop: 10,
              }}
            >
              <button
                type="button"
                onClick={resetForm}
                style={secondaryButton}
              >
                Cancel
              </button>

              <button type="submit" style={primaryButton}>
                {editingId ? "Save Changes" : "Add Debt"}
              </button>
            </div>
          </form>
        )}

        <section
          style={{
            background: "#f7f5ec",
            borderRadius: 26,
            padding: 18,
            boxShadow: "0 8px 24px rgba(0,0,0,.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>Your Debts</h2>
              <p
                style={{
                  margin: "4px 0 0",
                  color: "#69705f",
                }}
              >
                {debts.length} {debts.length === 1 ? "account" : "accounts"}
              </p>
            </div>
          </div>

          {debts.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 15px",
                color: "#69705f",
              }}
            >
              <div style={{ fontSize: 46 }}>💳</div>
              <h3 style={{ color: "#17210f" }}>No debts yet</h3>
              <p>Add your first debt to start your payoff plan.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {debts.map((debt) => (
                <article
                  key={debt.id}
                  style={{
                    background: "#e9efdc",
                    border: "1px solid #a7b18a",
                    borderRadius: 22,
                    padding: 18,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#667052",
                          fontWeight: 700,
                        }}
                      >
                        {debt.category}
                      </div>

                      <h3
                        style={{
                          margin: "4px 0 14px",
                          fontSize: 23,
                        }}
                      >
                        {debt.name}
                      </h3>
                    </div>

                    <button
                      onClick={() => editDebt(debt)}
                      style={iconButton}
                      aria-label="Edit debt"
                    >
                      ✎
                    </button>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.4fr 1fr 1fr",
                      gap: 10,
                    }}
                  >
                    <DebtValue
                      label="Balance"
                      value={money(debt.balance)}
                      large
                    />
                    <DebtValue
                      label="Minimum"
                      value={money(debt.minimum)}
                    />
                    <DebtValue
                      label="APR"
                      value={`${Number(debt.apr || 0).toFixed(2)}%`}
                    />
                  </div>

                  <button
                    onClick={() => deleteDebt(debt.id)}
                    style={{
                      marginTop: 16,
                      border: 0,
                      background: "transparent",
                      color: "#8b2f2f",
                      padding: 0,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(247,245,236,.97)",
          borderTop: "1px solid #d8dccd",
          padding: "10px 8px max(10px, env(safe-area-inset-bottom))",
          display: "flex",
          justifyContent: "space-around",
          zIndex: 20,
        }}
      >
        <NavItem href="/" icon="⌂" label="Home" />
        <NavItem href="/debts" icon="◕" label="Debts" active />
        <NavItem href="/strategy" icon="💡" label="Strategy" />
        <NavItem href="/plan" icon="☷" label="Plan" />
        <NavItem href="/track" icon="✓" label="Track" />
      </nav>
    </main>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div
      style={{
        background: "#f7f5ec",
        borderRadius: 20,
        padding: 16,
        boxShadow: "0 6px 18px rgba(0,0,0,.1)",
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "#6c735f",
          fontWeight: 700,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 5,
          fontSize: 23,
          fontWeight: 850,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Field({ type = "text", placeholder, value, onChange }) {
  return (
    <input
      type={type}
      inputMode={type === "number" ? "decimal" : undefined}
      step={type === "number" ? "0.01" : undefined}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
    />
  );
}

function DebtValue({ label, value, large }) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          color: "#69705f",
          marginBottom: 3,
        }}
      >
        {label}
      </div>

      <strong
        style={{
          fontSize: large ? 21 : 16,
          wordBreak: "break-word",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function NavItem({ href, icon, label, active }) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        color: active ? "#4b5320" : "#7c8175",
        fontSize: 12,
        fontWeight: active ? 800 : 600,
        minWidth: 55,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 23,
          lineHeight: 1,
          marginBottom: 5,
        }}
      >
        {icon}
      </div>
      {label}
    </Link>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #c7cbbd",
  borderRadius: 14,
  padding: "14px 15px",
  marginBottom: 10,
  background: "white",
  color: "#17210f",
  fontSize: 16,
  outline: "none",
};

const primaryButton = {
  border: 0,
  borderRadius: 14,
  padding: 14,
  background: "#4b5320",
  color: "white",
  fontWeight: 800,
  fontSize: 15,
  cursor: "pointer",
};

const secondaryButton = {
  border: "1px solid #b8beaa",
  borderRadius: 14,
  padding: 14,
  background: "white",
  color: "#39402c",
  fontWeight: 800,
  fontSize: 15,
  cursor: "pointer",
};

const iconButton = {
  border: "1px solid #b4bba4",
  background: "#f7f5ec",
  borderRadius: 12,
  width: 42,
  height: 42,
  fontSize: 21,
  cursor: "pointer",
};
