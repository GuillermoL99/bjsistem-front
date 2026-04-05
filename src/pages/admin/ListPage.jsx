import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { apiFetch } from "../../lib/api";

export default function ListPage() {
  const [people, setPeople] = useState([]);
  const [eventDate, setEventDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [savingDate, setSavingDate] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState("all");

  // form agregar manual
  const [addFirst, setAddFirst] = useState("");
  const [addLast, setAddLast] = useState("");
  const [addDni, setAddDni] = useState("");

  async function loadList() {
    setLoading(true);
    setErr("");
    try {
      const data = await apiFetch("/admin/list");
      setPeople(data.people || []);
      if (data.eventDate) {
        setEventDate(data.eventDate.slice(0, 10));
      } else {
        setEventDate("");
      }
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
      setPeople((prev) =>
        prev.map((p) => (p.orderId === orderId ? { ...p, scanned: res.scanned } : p))
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
          ticketId: "free",
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
      const code = e?.data?.error || "add_failed";
      setErr(code === "duplicate_dni" ? "Esta persona ya está en la lista (mismo DNI)." : code);
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
      setPeople((prev) => prev.filter((p) => p.orderId !== orderId));
    } catch (e) {
      setErr(e?.data?.error || "delete_failed");
    } finally {
      setDeleting(null);
    }
  }

  async function saveDate(date) {
    setSavingDate(true);
    setErr("");
    try {
      await apiFetch("/admin/list/date", {
        method: "PUT",
        body: JSON.stringify({ eventDate: date || null }),
      });
      setEventDate(date);
    } catch (e) {
      setErr(e?.data?.error || "date_failed");
    } finally {
      setSavingDate(false);
    }
  }

  async function clearAll() {
    setClearing(true);
    setErr("");
    try {
      await apiFetch("/admin/list/all", { method: "DELETE" });
      setPeople([]);
    } catch (e) {
      setErr(e?.data?.error || "clear_failed");
    } finally {
      setClearing(false);
    }
  }

  const staffList = useMemo(() => {
    const names = new Set(people.map((p) => p.addedBy).filter(Boolean));
    return [...names].sort();
  }, [people]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = people;
    if (selectedStaff !== "all") {
      result = result.filter((p) => p.addedBy === selectedStaff);
    }
    if (q) {
      result = result.filter(
        (p) =>
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.dni.includes(q)
      );
    }
    return result;
  }, [people, search, selectedStaff]);

  const dateLabel = eventDate
    ? new Date(eventDate + "T12:00:00").toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : null;

  return (
    <div className="adminPage">
      <Card title={dateLabel ? `Lista Free — ${dateLabel}` : "Lista Free"}>
        {/* Fecha del evento + vaciar lista */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="label" style={{ fontSize: 12, whiteSpace: "nowrap" }}>Fecha del evento</span>
            <input
              className="input"
              type="date"
              value={eventDate}
              onChange={(e) => saveDate(e.target.value)}
              disabled={savingDate}
              style={{ minWidth: 150 }}
            />
          </div>
          {people.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`¿Vaciar toda la lista? Se eliminarán ${people.length} persona(s). Esta acción no se puede deshacer.`))
                  clearAll();
              }}
              disabled={clearing}
              style={{
                marginLeft: "auto",
                background: "transparent",
                color: "#e03131",
                border: "1px solid rgba(224,49,49,.4)",
                borderRadius: 8,
                padding: "6px 16px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {clearing ? "Vaciando..." : "🗑 Vaciar lista"}
            </button>
          )}
        </div>

        <div className="hr" />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
          <input
            className="input"
            placeholder="Buscar por nombre, apellido o DNI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />

          {staffList.length > 1 && (
            <select
              className="input"
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              style={{ minWidth: 160 }}
            >
              <option value="all">Todos los staff</option>
              {staffList.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

          <span className="badge ok">
            <span className="dot" />
            {filtered.length} persona{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="hr" />

        {/* Formulario agregar persona */}
        <form onSubmit={addPerson} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
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
          <div style={{ gridColumn: "1 / -1" }}>
            <Button variant="primary" disabled={adding || !addFirst.trim() || !addLast.trim() || !addDni.trim()}>
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

        {!loading && !err && filtered.length === 0 && (
          <p style={{ color: "var(--muted)" }}>
            {search ? "No se encontraron resultados." : "No hay personas en la lista todavía."}
          </p>
        )}

        {filtered.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Nombre</th>
                  <th style={thStyle}>Apellido</th>
                  <th style={thStyle}>DNI</th>
                  <th style={thStyle}>Agregado por</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Estado</th>
                  <th style={{ ...thStyle, textAlign: "center" }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
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
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{p.addedBy || "—"}</span>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
