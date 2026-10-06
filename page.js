"use client";

import { useState } from "react";

export default function Home() {
  const [debts, setDebts] = useState([]);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [minimum, setMinimum] = useState("");
  const [interest, setInterest] = useState("");

  const addDebt = (e) => {
    e.preventDefault();
    if (!name || !balance) return;

    const newDebt = {
      id: Date.now(),
      name,
      balance: Number(balance),
      minimum: Number(minimum || 0),
      interest: Number(interest || 0),
    };

    setDebts([...debts, newDebt]);
    setName("");
    setBalance("");
    setMinimum("");
    setInterest("");
  };

  const deleteDebt = (id) => {
    setDebts(debts.filter((debt) => debt.id !== id));
  };

  const totalDebt = debts.reduce(
    (total, debt) => total + debt.balance,
    0
  );

  const totalMinimum = debts.reduce(
    (total, debt) => total + debt.minimum,
    0
  );

  const money = (amount) =>
    amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "42px", marginBottom: "8px" }}>
          Debt Payoff
        </h1>

        <p style={{ color: "#94a3b8", marginBottom: "35px" }}>
          Track your debt and take control of your payoff journey.
        </p>

        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: "30px",
          }}
        >
          <div style={cardStyle}>
            <p style={labelStyle}>Total Debt</p>
            <h2>{money(totalDebt)}</h2>
          </div>

          <div style={cardStyle}>
            <p style={labelStyle}>Monthly Minimums</p>
            <h2>{money(totalMinimum)}</h2>
          </div>

          <div style={cardStyle}>
            <p style={labelStyle}>Active Debts</p>
            <h2>{debts.length}</h2>
          </div>
        </div>

        <div style={sectionStyle}>
          <h2>Add a Debt</h2>

          <form onSubmit={addDebt}>
            <input
              style={inputStyle}
              placeholder="Debt name (Capital One, Car Loan...)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              style={inputStyle}
              type="number"
              step="0.01"
              placeholder="Current balance"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
            />

            <input
              style={inputStyle}
              type="number"
              step="0.01"
              placeholder="Minimum monthly payment"
              value={minimum}
              onChange={(e) => setMinimum(e.target.value)}
            />

            <input
              style={inputStyle}
              type="number"
              step="0.01"
              placeholder="Interest rate (APR %)"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
            />

            <button type="submit" style={buttonStyle}>
              + Add Debt
            </button>
          </form>
        </div>

        <div style={sectionStyle}>
          <h2>Your Debts</h2>

          {debts.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>
              You haven't added any debts yet.
            </p>
          ) : (
            debts.map((debt) => (
              <div key={debt.id} style={debtStyle}>
                <div>
                  <h3 style={{ margin: "0 0 8px" }}>
                    {debt.name}
                  </h3>

                  <div style={{ color: "#94a3b8" }}>
                    Balance: {money(debt.balance)}
                    <br />
                    Minimum: {money(debt.minimum)} / month
                    <br />
                    APR: {debt.interest}%
                  </div>
                </div>

                <button
                  onClick={() => deleteDebt(debt.id)}
                  style={deleteStyle}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

const cardStyle = {
  flex: "1",
  minWidth: "200px",
  background: "#1e293b",
  padding: "24px",
  borderRadius: "16px",
};

const labelStyle = {
  color: "#94a3b8",
  margin: "0 0 10px",
};

const sectionStyle = {
  background: "#1e293b",
  padding: "25px",
  borderRadius: "16px",
  marginBottom: "25px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "14px",
  marginTop: "12px",
  borderRadius: "10px",
  border: "1px solid #475569",
  background: "#0f172a",
  color: "white",
  fontSize: "16px",
};

const buttonStyle = {
  width: "100%",
  marginTop: "16px",
  padding: "14px",
  border: "none",
  borderRadius: "10px",
  background: "#2563eb",
  color: "white",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
};

const debtStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  padding: "20px",
  background: "#0f172a",
  borderRadius: "12px",
  marginTop: "15px",
};

const deleteStyle = {
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "10px 14px",
  cursor: "pointer",
};
