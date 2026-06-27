import { apiGet, apiPost, apiPut } from "../services/api";

/*
========================================
OBTENER MENSAJE DE ERROR
========================================
*/
function obtenerMensajeError(error, mensajeDefault) {
  return (
    error?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.mensaje ||
    mensajeDefault
  );
}

/*
========================================
ARMAR QUERY PARAMS
========================================
*/
function armarQueryParams(filtros = {}) {
  const params = new URLSearchParams();

  if (filtros?.fecha_inicio) {
    params.append("fecha_inicio", filtros.fecha_inicio);
  }

  if (filtros?.fecha_fin) {
    params.append("fecha_fin", filtros.fecha_fin);
  }

  if (filtros?.punto_venta_id) {
    params.append("punto_venta_id", filtros.punto_venta_id);
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}

/*
========================================
OBTENER CAJA ABIERTA
========================================
Trae la caja que esté en estado "abierta".
Puede filtrar por punto_venta_id si se manda.
========================================
*/
export async function obtenerCajaAbierta(puntoVentaId = null) {
  try {
    const query = puntoVentaId ? `?punto_venta_id=${puntoVentaId}` : "";

    const result = await apiGet(`/caja/abierta${query}`);

    return result || null;
  } catch (error) {
    console.log("Error obtenerCajaAbierta:", error);
    return null;
  }
}

/*
========================================
OBTENER HISTORIAL DE CAJA
========================================
Trae las cajas abiertas/cerradas.

Ahora soporta filtros:
{
  fecha_inicio: "2026-06-27",
  fecha_fin: "2026-06-27",
  punto_venta_id: 1
}
========================================
*/
export async function obtenerHistorialCaja(filtros = {}) {
  try {
    const query = armarQueryParams(filtros);

    const result = await apiGet(`/caja${query}`);

    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.log("Error obtenerHistorialCaja:", error);
    return [];
  }
}

/*
========================================
OBTENER DETALLE DE CAJA
========================================
Trae el detalle completo de una caja:
- caja
- resumen
- tickets
- productos vendidos
- gastos
========================================
*/
export async function obtenerDetalleCaja(cajaId) {
  try {
    if (!cajaId) {
      return {
        error: "No se encontró la caja.",
      };
    }

    return await apiGet(`/caja/${cajaId}/detalle`);
  } catch (error) {
    console.log("Error obtenerDetalleCaja:", error);

    return {
      error: obtenerMensajeError(
        error,
        "No se pudo obtener el detalle de la caja."
      ),
    };
  }
}

/*
========================================
ABRIR CAJA
========================================
Registra con cuánto dinero inicia la caja.

Ejemplo:
{
  usuario_id: 1,
  punto_venta_id: 1,
  monto_inicial: 1000,
  observaciones: "Cambio inicial del día"
}
========================================
*/
export async function abrirCaja(data) {
  try {
    return await apiPost("/caja/abrir", {
      usuario_id: data?.usuario_id || null,
      punto_venta_id: data?.punto_venta_id || null,
      monto_inicial: Number(data?.monto_inicial || 0),
      observaciones: data?.observaciones || "",
    });
  } catch (error) {
    console.log("Error abrirCaja:", error);

    return {
      error: obtenerMensajeError(error, "No se pudo abrir la caja."),
    };
  }
}

/*
========================================
CERRAR CAJA
========================================
Cierra la caja abierta.

Ejemplo:
{
  monto_final: 2500,
  observaciones: "Cierre correcto"
}
========================================
*/
export async function cerrarCaja(cajaId, data) {
  try {
    if (!cajaId) {
      return {
        error: "No se encontró la caja abierta.",
      };
    }

    return await apiPut(`/caja/${cajaId}/cerrar`, {
      monto_final: Number(data?.monto_final || 0),
      observaciones: data?.observaciones || "",
    });
  } catch (error) {
    console.log("Error cerrarCaja:", error);

    return {
      error: obtenerMensajeError(error, "No se pudo cerrar la caja."),
    };
  }
}

/*
========================================
OBTENER RESUMEN DE CAJA
========================================
Trae:
- ventas en efectivo
- ventas por transferencia
- gastos
- efectivo esperado
- ingresos totales
- diferencia si la caja está cerrada
========================================
*/
export async function obtenerResumenCaja(cajaId = null) {
  try {
    const query = cajaId ? `?caja_id=${cajaId}` : "";

    return await apiGet(`/caja/resumen${query}`);
  } catch (error) {
    console.log("Error obtenerResumenCaja:", error);
    return null;
  }
}

/*
========================================
OBTENER GASTOS DE CAJA
========================================
Trae los gastos registrados en una caja.
========================================
*/
export async function obtenerGastosCaja(cajaId) {
  try {
    if (!cajaId) return [];

    const result = await apiGet(`/caja/gastos?caja_id=${cajaId}`);

    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.log("Error obtenerGastosCaja:", error);
    return [];
  }
}

/*
========================================
CREAR GASTO DE CAJA
========================================
Registra un gasto personal o gasto de caja.

Ejemplo:
{
  caja_id: 1,
  usuario_id: 1,
  concepto: "Comida",
  categoria: "personal",
  monto: 150,
  observaciones: "Gasto personal"
}
========================================
*/
export async function crearGastoCaja(data) {
  try {
    return await apiPost("/caja/gastos", {
      caja_id: data?.caja_id,
      usuario_id: data?.usuario_id || null,
      concepto: data?.concepto || "",
      categoria: data?.categoria || "personal",
      monto: Number(data?.monto || 0),
      observaciones: data?.observaciones || "",
    });
  } catch (error) {
    console.log("Error crearGastoCaja:", error);

    return {
      error: obtenerMensajeError(error, "No se pudo registrar el gasto."),
    };
  }
}