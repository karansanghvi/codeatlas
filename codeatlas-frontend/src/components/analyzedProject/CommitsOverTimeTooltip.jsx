import React from "react";

const CommitsOverTimeTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ background: "#fff", padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
        <strong>{label}</strong>
        <div>Commits: {data.commits}</div>
        {data.contributors && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "5px" }}>
            {data.contributors.map((c, i) => (
              <span
                key={i}
                style={{
                  backgroundColor: "#f0f0f0",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
                title={c}
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default CommitsOverTimeTooltip;
