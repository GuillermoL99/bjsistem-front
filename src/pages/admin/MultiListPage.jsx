import { useEffect, useState } from "react";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { apiFetch } from "../../lib/api";

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function MultiListPage() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [newDate, setNewDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [adding, setAdding] = useState("");
  const [addFirst, setAddFirst] = useState("");
  const [addLast, setAddLast] = useState("");
  const [addDni, setAddDni] = useState("");
  const [addListId, setAddListId] = useState("");
  const [search, setSearch] = useState("");

  async function loadLists() {
    setLoading(true);
    setErr("");
    try {
      const data = await apiFetch("/admin/guest-lists");
      setLists(data.lists || []);
    } catch (e) {
      setErr(e?.data?.error || "load_failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLists();
  }, []);

  async function createList(e) {
    e.preventDefault();
    if (!newDate) return;
    setCreating(true);
    setErr("");
    try {
      await apiFetch("/admin/guest-lists", {
        method: "POST",
        body: JSON.stringify({ eventDate: newDate }),
      });
      setNewDate("");
      await loadLists();
    } catch (e) {
      setErr(e?.data?.error === "date_exists" ? "Ya existe una lista para esa fecha." : e?.data?.error || "create_failed");
    } finally {
      setCreating(false);
    }
  }

  async function deleteList(listId) {
    if (!window.confirm("¿Eliminar la lista? Se eliminarán todas las personas. Esta acción no se puede deshacer.")) return;
    setDeleting(listId);
    setErr("");
    try {
      await apiFetch(`/admin/guest-lists/${listId}`, { method: "DELETE" });
      await loadLists();
    } catch (e) {
      setErr(e?.data?.error || "delete_failed");
    } finally {
      setDeleting("");
    }
  }

  async function addPerson(e) {
    e.preventDefault();
    if (!addListId) return;
    setAdding(addListId);
    setErr("");
    try {
      await apiFetch(`/admin/guest-lists/${addListId}/person`, {
        method: "POST",
        body: JSON.stringify({
          firstName: addFirst.trim(),
          lastName: addLast.trim(),
          dni: addDni.trim(),
        }),
      });
      setAddFirst("");
      setAddLast("");
      setAddDni("");
      setAddListId("");
      await loadLists();
    } catch (e) {
      setErr(e?.data?.error === "duplicate_dni" ? "Esta persona ya está en la lista (mismo DNI)." : e?.data?.error || "add_failed");
    } finally {
      setAdding("");
    }
  }

  async function removePerson(listId, personId) {
    setErr("");
    try {
      await apiFetch(`/admin/guest-lists/${listId}/person/${personId}`, { method: "DELETE" });
      await loadLists();
    } catch (e) {
      setErr(e?.data?.error || "remove_failed");
    }
  }

  async function toggleCheck(listId, personId) {
    setErr("");
    try {
      await apiFetch(`/admin/guest-lists/${listId}/person/${personId}`, { method: "PATCH" });
      await loadLists();
    } catch (e) {
      setErr(e?.data?.error || "toggle_failed");
    }
  }

  return (
    <div className="adminPage">
      <Card title="Crear nueva lista Free">
        <form onSubmit={createList} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
          <span className="label" style={{ fontSize: 13 }}>Fecha del evento</span>
          <input
            className="input"
            type="date"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
            required
            style={{ minWidth: 150 }}
          />
          <Button variant="primary" type="submit" disabled={creating || !newDate}>
            {creating ? "Creando..." : "Crear lista"}
          </Button>
        </form>
      </Card>
      {err && (
        <div className="notice error" style={{ margin: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Error</div>
          <div className="mono">{err}</div>
        </div>
      )}
      {loading ? (
        <p style={{ color: "var(--muted)", margin: 16 }}>Cargando listas...</p>
      ) : (
        lists.map(list => (
          <Card key={list._id} title={`Lista Free — ${formatDate(list.eventDate)}`}
            style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
              <span className="label" style={{ fontSize: 13 }}>Fecha: <b>{formatDate(list.eventDate)}</b></span>
              <button
                type="button"
                onClick={() => deleteList(list._id)}
                disabled={deleting === list._id}
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
                {deleting === list._id ? "Eliminando..." : "🗑 Eliminar lista"}
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); setAddListId(list._id); addPerson(e); }} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
              <input className="input" value={addFirst} onChange={e => setAddFirst(e.target.value)} placeholder="Nombre" required />
              <input className="input" value={addLast} onChange={e => setAddLast(e.target.value)} placeholder="Apellido" required />
              <input className="input" inputMode="numeric" value={addDni} onChange={e => setAddDni(e.target.value.replace(/\D/g, ""))} placeholder="DNI" required />
              <div style={{ gridColumn: "1 / -1" }}>
                <Button variant="primary" disabled={adding === list._id || !addFirst.trim() || !addLast.trim() || !addDni.trim()}>
                  {adding === list._id ? "Agregando..." : "Agregar a la lista"}
                </Button>
              </div>
            </form>
            <div className="hr" />
            {list.people.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No hay personas en la lista todavía.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th style={{ textAlign: "left", padding: "8px 10px", color: "var(--muted)", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>#</th>
                      <th style={{ textAlign: "left", padding: "8px 10px" }}>Nombre</th>
                      <th style={{ textAlign: "left", padding: "8px 10px" }}>Apellido</th>
                      <th style={{ textAlign: "left", padding: "8px 10px" }}>DNI</th>
                      <th style={{ textAlign: "left", padding: "8px 10px" }}>Agregado por</th>
                      <th style={{ textAlign: "center", padding: "8px 10px" }}>Estado</th>
                      <th style={{ textAlign: "center", padding: "8px 10px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.people.map((p, i) => (
                      <tr key={p._id} style={{ borderBottom: "1px solid var(--border)", background: p.scanned ? "rgba(34,197,94,.12)" : "transparent", transition: "background .2s" }}>
                        <td className="mono">{i + 1}</td>
                        <td style={{ textDecoration: p.scanned ? "line-through" : "none", opacity: p.scanned ? 0.6 : 1 }}>{p.firstName}</td>
                        <td style={{ textDecoration: p.scanned ? "line-through" : "none", opacity: p.scanned ? 0.6 : 1 }}>{p.lastName}</td>
                        <td className="mono">{p.dni}</td>
                        <td><span style={{ fontSize: 12, color: "var(--muted)" }}>{p.addedBy || "—"}</span></td>
                        <td style={{ textAlign: "center" }}>
                          <button type="button" onClick={() => toggleCheck(list._id, p._id)} style={{ background: p.scanned ? "rgba(34,197,94,.85)" : "rgba(255,255,255,.1)", color: p.scanned ? "#fff" : "var(--muted)", border: p.scanned ? "1px solid rgba(34,197,94,.5)" : "1px solid var(--border)", borderRadius: 8, padding: "4px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}>{p.scanned ? "✓ Pasó" : "Marcar"}</button>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button type="button" onClick={() => { if (window.confirm(`¿Eliminar a ${p.firstName} ${p.lastName} de la lista?`)) removePerson(list._id, p._id); }} style={{ background: "transparent", color: "#e03131", border: "1px solid rgba(224,49,49,.3)", borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
