import React from "react";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          background: "#fff",
          padding: "8px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          fontSize: "14px"
        }}
      >
        <strong>{data.name}</strong>
        <ul style={{ margin: 0, paddingLeft: "18px" }}>
          {Array.isArray(data.contributors) && data.contributors.length > 0 ? (
            data.contributors.map(c => (
              <li key={c.dev}>
                {c.dev}: {c.count} commits
              </li>
            ))
          ) : (
            <li>{data.value} commits</li>
          )}
        </ul>
      </div>
    );
  }
  return null;
};

export default CustomTooltip;
