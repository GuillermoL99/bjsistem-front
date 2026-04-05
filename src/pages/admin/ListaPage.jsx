import React, { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../../lib/api";

function ListaPage() {
  const [personas, setPersonas] = useState([]);
  const [form, setForm] = useState({ nombre: "", apellido: "", dni: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busqueda, setBusqueda] = useState("");
  // Cargar personas al montar
  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch("/admin/orders?status=manual");
        setPersonas(res.orders || []);
      } catch (e) {
        setError("Error al cargar la lista");
      }
    }
    load();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await apiFetch("/admin/lista/manual", {
        method: "POST",
        body: JSON.stringify({
          nombre: form.nombre,
          apellido: form.apellido,
          dni: form.dni,
        }),
      });
      // Recargar lista desde backend
      const updated = await apiFetch("/admin/orders?status=manual");
      setPersonas(updated.orders || []);
      setForm({ nombre: "", apellido: "", dni: "" });
      setSuccess("Persona agregada correctamente.");
    } catch (e) {
      setError(e?.data?.error || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  // Filtros en tiempo real
  const filteredPersonas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return personas;
    return personas.filter((p) => {
      const nombre = (p.buyer_firstName || "").toLowerCase();
      const apellido = (p.buyer_lastName || "").toLowerCase();
      const dni = (p.buyer_dni || "").toLowerCase();
      return (
        nombre.includes(q) ||
        apellido.includes(q) ||
        dni.includes(q)
      );
    });
  }, [personas, busqueda]);

  return (
    <div className="container" style={{ marginTop: 32, marginBottom: 32 }}>
      <div className="card">
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Lista Free</h2>
          <p style={{ margin: "6px 0 0", color: "var(--muted)", lineHeight: 1.55 }}>
            Personas agregadas manualmente al sistema.
          </p>
        </div>
        <div className="hr" />
        <form onSubmit={handleSubmit} style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          <input
            className="input"
            name="nombre"
            placeholder="Nombre"
            value={form.nombre}
            onChange={handleChange}
            required
            disabled={loading}
            style={{ flex: 1, minWidth: 120 }}
          />
          <input
            className="input"
            name="apellido"
            placeholder="Apellido"
            value={form.apellido}
            onChange={handleChange}
            required
            disabled={loading}
            style={{ flex: 1, minWidth: 120 }}
          />
          <input
            className="input"
            name="dni"
            placeholder="DNI"
            value={form.dni}
            onChange={handleChange}
            required
            disabled={loading}
            style={{ flex: 1, minWidth: 100 }}
          />
          <button className="btn btnPrimary" type="submit" disabled={loading} style={{ minWidth: 120 }}>
            {loading ? "Agregando..." : "Agregar a la lista"}
          </button>
        </form>
        <div className="hr" />
        <div>
          <input
            className="input"
            placeholder="Buscar por nombre, apellido o DNI..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>
        {error && (
          <div className="notice error" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Error</div>
            <div className="mono">{error}</div>
          </div>
        )}
        {success && <div className="notice" style={{ color: "var(--accent2)", marginTop: 8 }}>{success}</div>}
        <div className="hr" />
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table className="table" style={{ minWidth: 600 }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>DNI</th>
                <th>Agregado por</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredPersonas.map((p, i) => (
                <tr
                  key={p._id || i}
                  style={p.passed ? { background: "rgba(34,197,94,0.18)" } : {}}
                >
                  <td>{i + 1}</td>
                  <td>{p.buyer_firstName}</td>
                  <td>{p.buyer_lastName}</td>
                  <td>{p.buyer_dni}</td>
                  <td>{p.addedBy || "-"}</td>
                  <td>
                    <button
                      className={"btn" + (p.passed ? " btnPrimary" : "")}
                      style={p.passed ? { background: "var(--accent2)", borderColor: "var(--accent2)", color: "#fff" } : {}}
                      onClick={async () => {
                        try {
                          const res = await apiFetch(`/admin/lista/marcar/${p._id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ passed: !p.passed }),
                          });
                          setPersonas(personas => personas.map(x => x._id === p._id ? { ...x, passed: res.order.passed } : x));
                        } catch (e) {
                          alert("Error al marcar/desmarcar");
                        }
                      }}
                    >
                      {p.passed ? "Pasó" : "Marcar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ListaPage;
