import React, { useState } from "react";
import { apiFetch } from "../../lib/api";

function ListaPage() {
  const [personas, setPersonas] = useState([]);
  const [form, setForm] = useState({ nombre: "", apellido: "", dni: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      setPersonas([...personas, res.order]);
      setForm({ nombre: "", apellido: "", dni: "" });
      setSuccess("Persona agregada correctamente.");
    } catch (e) {
      setError(e?.data?.error || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto" }}>
      <h2>Lista de Personas</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          name="nombre"
          placeholder="Nombre"
          value={form.nombre}
          onChange={handleChange}
          required
          disabled={loading}
        />
        <input
          name="apellido"
          placeholder="Apellido"
          value={form.apellido}
          onChange={handleChange}
          required
          disabled={loading}
        />
        <input
          name="dni"
          placeholder="DNI"
          value={form.dni}
          onChange={handleChange}
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Agregando..." : "Agregar"}
        </button>
      </form>
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      {success && <div style={{ color: "green", marginTop: 8 }}>{success}</div>}
      <ul style={{ marginTop: 24 }}>
        {personas.map((p, i) => (
          <li key={i}>{p.buyer_firstName || p.nombre} {p.buyer_lastName || p.apellido} - DNI: {p.buyer_dni || p.dni}</li>
        ))}
      </ul>
    </div>
  );
}

export default ListaPage;
