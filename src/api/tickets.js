const API_BASE = "https://bjsistem-back-production.up.railway.app"

export async function getTickets() {
  const r = await fetch(`${API_BASE}/tickets`);
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Error cargando tickets");
  return data; // { tickets: [{ id, name, priceARS, stock }] }
}