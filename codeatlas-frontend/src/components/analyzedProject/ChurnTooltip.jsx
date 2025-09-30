import React from "react";

const ChurnTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const { contributors, totalChanges } = payload[0].payload;
    return (
      <div
        style={{
          background: "#fff",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "5px",
        }}
      >
        <strong>{label}</strong>
        <div>Total Changes: {totalChanges}</div>
        <div
          style={{
            display: "flex",
            gap: "5px",
            marginTop: "5px",
            flexWrap: "wrap",
          }}
        >
          {contributors?.map((c, i) => (
            <div
              key={i}
              style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <img
                src={`https://github.com/${c}.png`}
                alt={c}
                title={c}
                style={{ width: "25px", height: "25px", borderRadius: "50%" }}
              />
              <span style={{ fontSize: "10px" }}>{c}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default ChurnTooltip;
