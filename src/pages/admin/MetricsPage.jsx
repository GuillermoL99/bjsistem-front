import { useEffect, useState } from "react";
import Card from "../../components/Card";
import { apiFetch } from "../../lib/api";

export default function MetricsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/admin/metrics");
      setData(res);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <Card title="Métricas"><p>Cargando...</p></Card>;
  if (error) return (
    <Card title="Métricas">
      <div className="notice error">{error}</div>
      <button className="btn" onClick={load} style={{ marginTop: 12 }}>Reintentar</button>
    </Card>
  );
  if (!data) return null;

  const { byStatus, approved, byTicket, daily, scannedCount, stock } = data;

  const statusLabels = {
    approved: "Aprobados",
    pending: "Pendientes",
    created: "Creados",
    rejected: "Rechazados",
    cancelled: "Cancelados",
    refunded: "Reembolsados",
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Resumen general */}
      <Card title="Resumen de ventas">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button className="btn" onClick={load}>Actualizar</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          <StatBox label="Ingresos" value={`$${(approved.totalRevenue || 0).toLocaleString("es-AR")}`} color="#22c55e" />
          <StatBox label="Órdenes aprobadas" value={approved.totalOrders} color="#3b82f6" />
          <StatBox label="Entradas vendidas" value={approved.totalTickets} color="#8b5cf6" />
          <StatBox label="QRs escaneados" value={scannedCount} color="#f59e0b" />
        </div>
      </Card>

      {/* Estado de órdenes */}
      <Card title="Órdenes por estado">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
          {Object.entries(statusLabels).map(([key, label]) => (
            <div key={key} style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "rgba(0,0,0,.15)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{byStatus[key] || 0}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Ventas por tipo de entrada */}
      {byTicket.length > 0 && (
        <Card title="Ventas por tipo de entrada">
          <table className="table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Entrada</th>
                <th>Órdenes</th>
                <th>Entradas</th>
                <th>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {byTicket.map((t, i) => (
                <tr key={i}>
                  <td>{t.title || "—"}</td>
                  <td style={{ textAlign: "center" }}>{t.orders}</td>
                  <td style={{ textAlign: "center" }}>{t.tickets}</td>
                  <td style={{ textAlign: "center" }}>${(t.revenue || 0).toLocaleString("es-AR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Stock actual */}
      {stock.length > 0 && (
        <Card title="Stock actual">
          <table className="table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Entrada</th>
                <th>Stock</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td style={{ textAlign: "center" }}>{s.stock}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`badge ${s.active ? "ok" : "bad"}`}>
                      <span className="dot" />
                      {s.active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Ventas últimos 30 días */}
      {daily.length > 0 && (
        <Card title="Ventas últimos 30 días">
          <table className="table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Fecha</th>
                <th>Órdenes</th>
                <th>Entradas</th>
                <th>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((d) => (
                <tr key={d.date}>
                  <td>{d.date}</td>
                  <td style={{ textAlign: "center" }}>{d.orders}</td>
                  <td style={{ textAlign: "center" }}>{d.tickets}</td>
                  <td style={{ textAlign: "center" }}>${(d.revenue || 0).toLocaleString("es-AR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{
      padding: "16px 14px",
      borderRadius: 12,
      border: "1px solid var(--border)",
      background: "rgba(0,0,0,.15)",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>{label}</div>
    </div>
  );
}
