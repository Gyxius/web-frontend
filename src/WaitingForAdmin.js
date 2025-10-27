import React from "react";

export default function WaitingForAdmin({ onHome }) {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>Waiting for Admin Approval...</h2>
      <button onClick={onHome} style={{ marginTop: 20 }}>Go Home</button>
    </div>
  );
}
