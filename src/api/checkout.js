const API_BASE = import.meta.env.VITE_API_BASE || "bjsistem-back-production.up.railway.app";

export async function checkout(payload) {
  const r = await fetch(`${API_BASE}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Error en checkout");
  return data; // { orderId }
}