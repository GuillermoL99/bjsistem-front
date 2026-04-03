import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import QRCode from "qrcode";
import Layout from "../components/Layout";
import Card from "../components/Card";
import StatusBadge from "../components/StatusBadge";
import { getOrder } from "../api/mp";

function useOrderId() {
  const { search } = useLocation();
  return useMemo(() => {
    const qs = new URLSearchParams(search);
    return qs.get("orderId") || localStorage.getItem("lastOrderId") || null;
  }, [search]);
}

function titleFromStatus(status) {
  switch (status) {
    case "approved":
      return "Pago acreditado";
    case "pending":
      return "Pago pendiente";
    case "created":
      return "Orden creada (sin pagar)";
    case "rejected":
      return "Pago rechazado";
    case "cancelled":
      return "Pago cancelado";
    case "refunded":
      return "Pago reembolsado";
    default:
      return "Estado del pago";
  }
}

export default function Result() {
  const orderId = useOrderId();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setError("No tengo orderId (URL/localStorage). Volvé al inicio y generá un pago.");
      return;
    }

    let timer;

    async function load() {
      try {
        const data = await getOrder(orderId);
        setOrder(data);
        setError(null);
        if (data.status === "pending" || data.status === "created") {
          timer = setTimeout(load, 2000);
        }
      } catch (e) {
        setError(String(e?.message || e));
      }
    }

    load();
    return () => timer && clearTimeout(timer);
  }, [orderId]);

  // Generar QR cuando el pago es approved
  useEffect(() => {
    if (order?.status === "approved" && order?.orderId) {
      QRCode.toDataURL(order.orderId, { width: 320, margin: 2 })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(null));
    }
  }, [order?.status, order?.orderId]);

  return (
    <Layout>
      <Card
        title={order ? titleFromStatus(order.status) : "Verificando..."}
        subtitle="Este estado sale del backend (webhook), no del redirect."
      >
        {error && (
          <div className="notice error" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Error</div>
            <div className="mono">{error}</div>
          </div>
        )}

        {!error && !order && <p style={{ marginTop: 12 }}>Cargando...</p>}

        {order && (
          <>
            <div style={{ marginTop: 10, marginBottom: 12 }}>
              <StatusBadge status={order.status} />
            </div>

            {order.status === "approved" && (
              <div style={{ textAlign: "center", margin: "20px 0" }}>
                <h2 style={{ color: "#1864ab", marginBottom: 12 }}>¡Tu entrada está lista!</h2>
                <p style={{ marginBottom: 16, color: "var(--muted)" }}>
                  Presentá este QR en la puerta del evento.
                </p>

                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt="QR de tu entrada"
                    style={{
                      display: "block",
                      margin: "0 auto 16px",
                      borderRadius: 16,
                      border: "4px solid #eee",
                      boxShadow: "0 2px 6px #0003",
                    }}
                  />
                )}

                {order.ticketCode && (
                  <div style={{
                    display: "inline-block",
                    background: "#f0f4ff",
                    border: "2px dashed #1864ab",
                    borderRadius: 12,
                    padding: "14px 28px",
                    marginBottom: 16,
                  }}>
                    <div style={{ fontSize: 13, color: "#555", marginBottom: 6, letterSpacing: ".05em", textTransform: "uppercase" }}>
                      Código de respaldo
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: ".25em", color: "#1864ab" }}>
                      {order.ticketCode}
                    </div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
                      Usalo si el QR no puede escanearse
                    </div>
                  </div>
                )}

                {qrDataUrl && (
                  <div style={{ marginTop: 12 }}>
                    <a
                      href={qrDataUrl}
                      download={`entrada-${order.orderId}.png`}
                      style={{
                        display: "inline-block",
                        padding: "10px 24px",
                        background: "#1864ab",
                        color: "#fff",
                        borderRadius: 10,
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      Descargar QR
                    </a>
                  </div>
                )}

                <p style={{ fontSize: 12, color: "#888", marginTop: 16 }}>
                  No compartas tu QR con otros.
                </p>

                <div className="hr" />
              </div>
            )}

            {order.status === "pending" && (
              <div style={{ textAlign: "center", margin: "20px 0", color: "var(--muted)" }}>
                <p>Esperando confirmación del pago...</p>
                <p style={{ fontSize: 13 }}>Esta página se actualiza automáticamente.</p>
              </div>
            )}

            <details style={{ marginTop: 14 }}>
              <summary>Ver JSON</summary>
              <pre className="mono">{JSON.stringify(order, null, 2)}</pre>
            </details>
          </>
        )}

        <div className="hr" />

        <Link to="/">← Volver</Link>
      </Card>
    </Layout>
  );
}