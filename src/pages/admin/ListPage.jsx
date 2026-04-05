import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { apiFetch } from "../../lib/api";

export default function ListPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [toggling, setToggling] = useState(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // form agregar manual
  const [addFirst, setAddFirst] = useState("");
  const [addLast, setAddLast] = useState("");
  const [addDni, setAddDni] = useState("");
  const [addTicket, setAddTicket] = useState("");

  async function loadList() {
    setLoading(true);
    setErr("");
    try {
      const data = await apiFetch("/admin/list");
      setEvents(data.events || []);
    } catch (e) {
      setErr(e?.data?.error || "load_failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadList();
  }, []);

  async function toggleCheck(orderId) {
    if (toggling) return;
    setToggling(orderId);
    try {
      const res = await apiFetch(`/admin/list/${orderId}`, { method: "PATCH" });
      setEvents((prev) =>
        prev.map((ev) => ({
          ...ev,
          people: ev.people.map((p) =>
            p.orderId === orderId ? { ...p, scanned: res.scanned } : p
          ),
        }))
      );
    } catch (e) {
      setErr(e?.data?.error || "toggle_failed");
    } finally {
      setToggling(null);
    }
  }

  async function addPerson(e) {
    e.preventDefault();
    if (adding) return;
    setAdding(true);
    setErr("");
    try {
      await apiFetch("/admin/list", {
        method: "POST",
        body: JSON.stringify({
          ticketId: addTicket,
          firstName: addFirst.trim(),
          lastName: addLast.trim(),
          dni: addDni.trim(),
        }),
      });
      setAddFirst("");
      setAddLast("");
      setAddDni("");
      await loadList();
    } catch (e) {
      setErr(e?.data?.error || "add_failed");
    } finally {
      setAdding(false);
    }
  }

  async function removePerson(orderId) {
    if (deleting) return;
    setDeleting(orderId);
    setErr("");
    try {
      await apiFetch(`/admin/list/${orderId}`, { method: "DELETE" });
      setEvents((prev) =>
        prev.map((ev) => ({
          ...ev,
          people: ev.people.filter((p) => p.orderId !== orderId),
        }))
      );
    } catch (e) {
      setErr(e?.data?.error || "delete_failed");
    } finally {
      setDeleting(null);
    }
  }

  const eventsWithPeople = useMemo(
    () => events.filter((ev) => ev.people.length > 0),
    [events]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    let source = eventsWithPeople;
    if (selectedEvent !== "all") {
      source = source.filter((ev) => ev.ticketId === selectedEvent);
    }

    return source.map((ev) => {
      const people = q
        ? ev.people.filter(
            (p) =>
              p.firstName.toLowerCase().includes(q) ||
              p.lastName.toLowerCase().includes(q) ||
              p.dni.includes(q)
          )
        : ev.people;
      return { ...ev, people };
    });
  }, [eventsWithPeople, search, selectedEvent]);

  const totalPeople = useMemo(
    () => filtered.reduce((sum, ev) => sum + ev.people.length, 0),
    [filtered]
  );

  return (
    <div className="adminPage">
      <Card title="Lista de invitados">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
          <input
            className="input"
            placeholder="Buscar por nombre, apellido o DNI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />

          <select
            className="input"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            style={{ minWidth: 180 }}
          >
            <option value="all">Todos los eventos</option>
            {eventsWithPeople.map((ev) => (
              <option key={ev.ticketId} value={ev.ticketId}>
                {ev.ticketName}
                {ev.eventDate
                  ? ` — ${new Date(ev.eventDate.slice(0, 10) + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" })}`
                  : ""}
              </option>
            ))}
          </select>

          <span className="badge ok">
            <span className="dot" />
            {totalPeople} persona{totalPeople !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="hr" />

        {/* Formulario agregar persona manual */}
        <form onSubmit={addPerson} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div>
            <div className="label" style={{ marginBottom: 4, fontSize: 12 }}>Nombre</div>
            <input className="input" value={addFirst} onChange={(e) => setAddFirst(e.target.value)} placeholder="Juan" />
          </div>
          <div>
            <div className="label" style={{ marginBottom: 4, fontSize: 12 }}>Apellido</div>
            <input className="input" value={addLast} onChange={(e) => setAddLast(e.target.value)} placeholder="Pérez" />
          </div>
          <div>
            <div className="label" style={{ marginBottom: 4, fontSize: 12 }}>DNI</div>
            <input className="input" inputMode="numeric" value={addDni} onChange={(e) => setAddDni(e.target.value.replace(/\D/g, ""))} placeholder="12345678" />
          </div>
          <div>
            <div className="label" style={{ marginBottom: 4, fontSize: 12 }}>Evento</div>
            <select className="input" value={addTicket} onChange={(e) => setAddTicket(e.target.value)}>
              <option value="">Seleccionar...</option>
              {events.map((ev) => (
                <option key={ev.ticketId} value={ev.ticketId}>
                  {ev.ticketName}
                  {ev.eventDate ? ` — ${new Date(ev.eventDate.slice(0, 10) + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" })}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <Button variant="primary" disabled={adding || !addFirst.trim() || !addLast.trim() || !addDni.trim() || !addTicket}>
              {adding ? "Agregando..." : "Agregar a la lista"}
            </Button>
          </div>
        </form>

        <div className="hr" />

        {loading && <p style={{ color: "var(--muted)" }}>Cargando lista...</p>}
        {err && (
          <div className="notice error">
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Error</div>
            <div className="mono">{err}</div>
          </div>
        )}

        {!loading && !err && totalPeople === 0 && (
          <p style={{ color: "var(--muted)" }}>
            {search ? "No se encontraron resultados." : "No hay entradas vendidas todavía."}
          </p>
        )}

        {filtered.map(
          (ev) =>
            ev.people.length > 0 && (
              <div key={ev.ticketId} style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: 16 }}>{ev.ticketName}</h3>
                  {ev.eventDate && (
                    <span className="badge" style={{ fontSize: 12 }}>
                      📅{" "}
                      {new Date(ev.eventDate.slice(0, 10) + "T12:00:00").toLocaleDateString("es-AR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  )}
                  <span className="mono" style={{ color: "var(--muted)", fontSize: 13 }}>
                    ({ev.people.length})
                  </span>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <th style={thStyle}>#</th>
                        <th style={thStyle}>Nombre</th>
                        <th style={thStyle}>Apellido</th>
                        <th style={thStyle}>DNI</th>
                        <th style={thStyle}>Tipo</th>
                        <th style={{ ...thStyle, textAlign: "center" }}>Estado</th>
                        <th style={{ ...thStyle, textAlign: "center" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {ev.people.map((p, i) => (
                        <tr
                          key={p.orderId}
                          style={{
                            borderBottom: "1px solid var(--border)",
                            background: p.scanned ? "rgba(34,197,94,.12)" : "transparent",
                            transition: "background .2s",
                          }}
                        >
                          <td style={tdStyle} className="mono">
                            {i + 1}
                          </td>
                          <td style={{ ...tdStyle, textDecoration: p.scanned ? "line-through" : "none", opacity: p.scanned ? 0.6 : 1 }}>
                            {p.firstName}
                          </td>
                          <td style={{ ...tdStyle, textDecoration: p.scanned ? "line-through" : "none", opacity: p.scanned ? 0.6 : 1 }}>
                            {p.lastName}
                          </td>
                          <td style={tdStyle} className="mono">
                            {p.dni}
                          </td>
                          <td style={tdStyle}>
                            <span className={`badge ${p.manual ? "warn" : ""}`} style={{ fontSize: 11 }}>
                              {p.manual ? "Manual" : "Compra"}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            <button
                              type="button"
                              onClick={() => toggleCheck(p.orderId)}
                              disabled={toggling === p.orderId}
                              style={{
                                background: p.scanned ? "rgba(34,197,94,.85)" : "rgba(255,255,255,.1)",
                                color: p.scanned ? "#fff" : "var(--muted)",
                                border: p.scanned ? "1px solid rgba(34,197,94,.5)" : "1px solid var(--border)",
                                borderRadius: 8,
                                padding: "4px 14px",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all .2s",
                              }}
                            >
                              {toggling === p.orderId ? "..." : p.scanned ? "✓ Pasó" : "Marcar"}
                            </button>
                          </td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            {p.manual && (
                              <button
                                type="button"
                                onClick={() => { if (window.confirm(`¿Eliminar a ${p.firstName} ${p.lastName} de la lista?`)) removePerson(p.orderId); }}
                                disabled={deleting === p.orderId}
                                style={{
                                  background: "transparent",
                                  color: "#e03131",
                                  border: "1px solid rgba(224,49,49,.3)",
                                  borderRadius: 8,
                                  padding: "4px 10px",
                                  fontSize: 12,
                                  cursor: "pointer",
                                }}
                              >
                                {deleting === p.orderId ? "..." : "✕"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
        )}
      </Card>
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "8px 10px",
  color: "var(--muted)",
  fontWeight: 600,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const tdStyle = {
  padding: "8px 10px",
};
