import { apiGet, apiPost, apiPut, apiDelete } from "../services/api";

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
    return { error: "No se pudo crear el ticket." };
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
export async function cancelarItemTicket(ticketId, itemId) {
  try {
    return await apiPut(`/tickets/${ticketId}/items/${itemId}/cancelar`, {});
  } catch (error) {
    console.log("Error cancelarItemTicket:", error);
    return { error: "No se pudo cancelar el producto." };
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
    return { error: "No se pudieron agregar productos a la mesa." };
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
    return { error: "No se pudieron agregar productos." };
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
    return { error: "No se pudo eliminar el producto." };
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
    return { error: "No se pudo mandar la comanda." };
  }
}

/*
========================================
FINALIZAR TICKET
========================================
Permite enviar:
- metodo_pago
- monto_pagado
- cambio
========================================
Ejemplo:
finalizarTicket(5,{
  metodo_pago:"efectivo",
  monto_pagado:500,
  cambio:120
})
========================================
*/
export async function finalizarTicket(ticketId, datosPago = {}) {
  try {
    return await apiPut(`/tickets/${ticketId}/finalizar`, datosPago);
  } catch (error) {
    console.log("Error finalizarTicket:", error);
    return { error: "No se pudo finalizar el ticket." };
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
    return { error: "No se pudo actualizar la cantidad." };
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
    return { error: "No se pudo actualizar el producto." };
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
    return { error: "No se pudo marcar como entregado." };
  }
}