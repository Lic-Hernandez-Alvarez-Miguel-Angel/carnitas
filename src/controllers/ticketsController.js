import { apiGet, apiPost, apiPut, apiDelete } from "../services/api";

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
CREAR TICKET
========================================
Ahora incluye punto_venta_id para saber
de qué zona fue la venta:
- Higuera Atizapán
- Atizapán Principal
- Tepojaco
- San Pedro
========================================
*/
export async function crearTicket({
  tipoServicio,
  mesa,
  punto_venta_id,
  usuario_id,
  items,
}) {
  try {
    return await apiPost("/tickets", {
      tipoServicio,
      mesa,
      punto_venta_id,
      usuario_id,
      items,
    });
  } catch (error) {
    console.log("Error crearTicket:", error);

    return {
      error: obtenerMensajeError(error, "No se pudo crear el ticket."),
    };
  }
}

/*
========================================
OBTENER TODOS LOS TICKETS
========================================
*/
export async function obtenerTickets(filtros = {}) {
  try {
    const params = new URLSearchParams();

    if (filtros.usuario_id) {
      params.append("usuario_id", filtros.usuario_id);
    }

    if (filtros.punto_venta_id) {
      params.append("punto_venta_id", filtros.punto_venta_id);
    }

    if (filtros.rol) {
      params.append("rol", filtros.rol);
    }

    const query = params.toString();

    console.log("Consultando tickets:", query);

    return await apiGet(query ? `/tickets?${query}` : "/tickets");
  } catch (error) {
    console.log("Error obtenerTickets:", error);
    return [];
  }
}

/*
========================================
OBTENER TICKET POR ID
========================================
*/
export async function obtenerTicketPorId(ticketId) {
  try {
    return await apiGet(`/tickets/${ticketId}`);
  } catch (error) {
    console.log("Error obtenerTicketPorId:", error);
    return null;
  }
}

/*
========================================
TICKETS ABIERTOS POR MESA
========================================
*/
export async function obtenerTicketsAbiertosPorMesa() {
  try {
    return await apiGet("/tickets/mesas/abiertos");
  } catch (error) {
    console.log("Error obtenerTicketsAbiertosPorMesa:", error);
    return [];
  }
}

/*
========================================
BUSCAR TICKET POR MESA
========================================
*/
export async function buscarTicketPorMesa(mesa) {
  try {
    return await apiGet(`/tickets/mesa/${mesa}`);
  } catch (error) {
    console.log("Error buscarTicketPorMesa:", error);
    return null;
  }
}

/*
========================================
AGREGAR ITEMS A TICKET EXISTENTE POR MESA
========================================
*/
export async function agregarItemsATicketMesa(mesa, nuevosItems) {
  try {
    return await apiPost(`/tickets/mesa/${mesa}/items`, {
      items: nuevosItems,
    });
  } catch (error) {
    console.log("Error agregarItemsATicketMesa:", error);

    return {
      error: obtenerMensajeError(
        error,
        "No se pudieron agregar productos a la mesa."
      ),
    };
  }
}

/*
========================================
AGREGAR ITEMS A TICKET POR ID
========================================
*/
export async function agregarItemsATicket(ticketId, nuevosItems) {
  try {
    return await apiPost(`/tickets/${ticketId}/items`, {
      items: nuevosItems,
    });
  } catch (error) {
    console.log("Error agregarItemsATicket:", error);

    return {
      error: obtenerMensajeError(error, "No se pudieron agregar productos."),
    };
  }
}

/*
========================================
ELIMINAR ITEM PENDIENTE
========================================
*/
export async function eliminarItemPendiente(ticketId, itemId) {
  try {
    return await apiDelete(`/tickets/${ticketId}/items/${itemId}`);
  } catch (error) {
    console.log("Error eliminarItemPendiente:", error);

    return {
      error: obtenerMensajeError(error, "No se pudo eliminar el producto."),
    };
  }
}

/*
========================================
MANDAR COMANDA
========================================
Marca los productos pendientes como enviados
a cocina / preparación
========================================
*/
export async function mandarComanda(ticketId) {
  try {
    return await apiPost(`/tickets/${ticketId}/comanda`, {});
  } catch (error) {
    console.log("Error mandarComanda:", error);

    return {
      error: obtenerMensajeError(error, "No se pudo mandar la comanda."),
    };
  }
}

/*
========================================
FINALIZAR TICKET
========================================
Ruta vieja. Se deja por compatibilidad.
Actualmente el flujo correcto usa:
solicitarFinalizacionTicket()
========================================
*/
export async function finalizarTicket(ticketId, datosPago = {}) {
  try {
    return await apiPut(`/tickets/${ticketId}/finalizar`, datosPago);
  } catch (error) {
    console.log("Error finalizarTicket:", error);

    return {
      error: obtenerMensajeError(error, "No se pudo finalizar el ticket."),
    };
  }
}

/*
========================================
SOLICITAR FINALIZACIÓN DEL TICKET
========================================
Empleado captura el pago, pero NO cierra
definitivamente el ticket.

Soporta:
- efectivo
- transferencia
- comprobante_pago en base64
- comprobante_pago_mime
========================================
*/
export async function solicitarFinalizacionTicket(ticketId, datosPago = {}) {
  try {
    return await apiPut(
      `/tickets/${ticketId}/solicitar-finalizacion`,
      {
        metodo_pago: datosPago?.metodo_pago || "efectivo",
        monto_pagado: Number(datosPago?.monto_pagado || 0),
        comprobante_pago: datosPago?.comprobante_pago || null,
        comprobante_pago_mime: datosPago?.comprobante_pago_mime || null,
      }
    );
  } catch (error) {
    console.log("Error solicitarFinalizacionTicket:", error);

    return {
      error: obtenerMensajeError(
        error,
        "No se pudo solicitar la finalización del ticket."
      ),
    };
  }
}

/*
========================================
CONFIRMAR FINALIZACIÓN DEL TICKET
========================================
Solo el jefe confirma el cierre definitivo.
========================================
*/
export async function confirmarFinalizacionTicket(ticketId, usuario = {}) {
  try {
    return await apiPut(
      `/tickets/${ticketId}/confirmar-finalizacion`,
      {
        rol: usuario?.rol,
        usuario_id: usuario?.id,
      }
    );
  } catch (error) {
    console.log("Error confirmarFinalizacionTicket:", error);

    return {
      error: obtenerMensajeError(
        error,
        "No se pudo confirmar la finalización del ticket."
      ),
    };
  }
}

/*
========================================
ACTUALIZAR CANTIDAD DE ITEM
========================================
*/
export async function actualizarCantidadItem(
  ticketId,
  itemId,
  nuevaCantidad
) {
  try {
    return await apiPut(`/tickets/${ticketId}/items/${itemId}`, {
      cantidad: nuevaCantidad,
    });
  } catch (error) {
    console.log("Error actualizarCantidadItem:", error);

    return {
      error: obtenerMensajeError(error, "No se pudo actualizar la cantidad."),
    };
  }
}

/*
========================================
ACTUALIZAR ITEM PENDIENTE
========================================
Cambiar:
- producto
- cantidad
- modo venta
========================================
*/
export async function actualizarItemPendiente(ticketId, itemId, cambios) {
  try {
    return await apiPut(`/tickets/${ticketId}/items/${itemId}`, cambios);
  } catch (error) {
    console.log("Error actualizarItemPendiente:", error);

    return {
      error: obtenerMensajeError(error, "No se pudo actualizar el producto."),
    };
  }
}

/*
========================================
MARCAR ITEM COMO ENTREGADO
========================================
Pendiente -> Entregado
========================================
*/
export async function marcarItemEntregado(ticketId, itemId) {
  try {
    return await apiPut(
      `/tickets/${ticketId}/items/${itemId}/entregar`,
      {}
    );
  } catch (error) {
    console.log("Error marcarItemEntregado:", error);

    return {
      error: obtenerMensajeError(error, "No se pudo marcar como entregado."),
    };
  }
}

/*
========================================
CANCELAR ITEM DEL TICKET
========================================
Pendiente -> Cancelado
También descuenta el subtotal del total
del ticket desde la API.
========================================
*/
export async function cancelarItemTicket(ticketId, itemId) {
  try {
    return await apiPut(
      `/tickets/${ticketId}/items/${itemId}/cancelar`,
      {}
    );
  } catch (error) {
    console.log("Error cancelarItemTicket:", error);

    return {
      error: obtenerMensajeError(error, "No se pudo cancelar el producto."),
    };
  }
}