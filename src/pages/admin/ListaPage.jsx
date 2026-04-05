import React, { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../../lib/api";

function ListaPage() {
  const [personas, setPersonas] = useState([]);
  const [form, setForm] = useState({ nombre: "", apellido: "", dni: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filters, setFilters] = useState({ nombre: "", apellido: "", dni: "" });
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
    return personas.filter((p) => {
      const nombre = (p.buyer_firstName || "").toLowerCase();
      const apellido = (p.buyer_lastName || "").toLowerCase();
      const dni = (p.buyer_dni || "").toLowerCase();
      return (
        nombre.includes(filters.nombre.toLowerCase()) &&
        apellido.includes(filters.apellido.toLowerCase()) &&
        dni.includes(filters.dni.toLowerCase())
      );
    });
  }, [personas, filters]);

  return (
    <div className="card" style={{ maxWidth: 1100, margin: "32px auto" }}>
      <h2 style={{ marginBottom: 8 }}>Lista Free</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <input
          className="input"
          name="nombre"
          placeholder="Nombre"
          value={form.nombre}
          onChange={handleChange}
          required
          disabled={loading}
          style={{ flex: 1 }}
        />
        <input
          className="input"
          name="apellido"
          placeholder="Apellido"
          value={form.apellido}
          onChange={handleChange}
          required
          disabled={loading}
          style={{ flex: 1 }}
        />
        <input
          className="input"
          name="dni"
          placeholder="DNI"
          value={form.dni}
          onChange={handleChange}
          required
          disabled={loading}
          style={{ flex: 1 }}
        />
        <button className="btn btnPrimary" type="submit" disabled={loading} style={{ minWidth: 140 }}>
          {loading ? "Agregando..." : "Agregar a la lista"}
        </button>
      </form>
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <input
          className="input"
          placeholder="Nombre"
          value={filters.nombre}
          onChange={e => setFilters(f => ({ ...f, nombre: e.target.value }))}
          style={{ flex: 1 }}
        />
        <input
          className="input"
          placeholder="Apellido"
          value={filters.apellido}
          onChange={e => setFilters(f => ({ ...f, apellido: e.target.value }))}
          style={{ flex: 1 }}
        />
        <input
          className="input"
          placeholder="DNI"
          value={filters.dni}
          onChange={e => setFilters(f => ({ ...f, dni: e.target.value }))}
          style={{ flex: 1 }}
        />
      </div>
      {error && <div className="notice error" style={{ marginTop: 8 }}>{error}</div>}
      {success && <div className="notice" style={{ color: "var(--accent2)", marginTop: 8 }}>{success}</div>}
      <table className="table" style={{ marginTop: 16 }}>
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
            <tr key={p._id || i}>
              <td>{i + 1}</td>
              <td>{p.buyer_firstName}</td>
              <td>{p.buyer_lastName}</td>
              <td>{p.buyer_dni}</td>
              <td>{p.addedBy || "-"}</td>
              <td><button className="btn">Marcar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ListaPage;
