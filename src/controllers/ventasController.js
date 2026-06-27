import { apiGet } from "../services/api";

export async function obtenerProductos() {
  try {
    return await apiGet("/productos");
  } catch (error) {
    console.log("Error obtenerProductos:", error);
    return [];
  }
}

export function calcularPrecioTacoCombinado(productosSeleccionados) {
  if (!productosSeleccionados || productosSeleccionados.length === 0) return 0;

  const precios = productosSeleccionados.map((p) => Number(p.precio_taco) || 0);
  return Math.max(...precios);
}

export function calcularImporteItem(
  producto,
  modoVenta,
  cantidad,
  combinacion = [],
  importeManual = 0
) {
  if (modoVenta === "importe") {
    return Number(importeManual) || 0;
  }

  if (!cantidad) return 0;

  if (modoVenta === "taco" && combinacion.length > 0) {
    const precioBase = calcularPrecioTacoCombinado(combinacion);
    return cantidad * precioBase;
  }

  if (!producto) return 0;

  switch (modoVenta) {
    case "taco":
      return cantidad * (Number(producto.precio_taco) || 0);
    case "medio":
      return cantidad * (Number(producto.precio_medio) || 0);
    case "kilo":
      return cantidad * (Number(producto.precio_kilo) || 0);
    case "gramos":
      return cantidad * (Number(producto.precio_gramo) || 0);
    case "pieza":
      return cantidad * (Number(producto.precio_pieza) || 0);
    default:
      return 0;
  }
}

export function construirItemTicket(
  producto,
  modoVenta,
  cantidad,
  combinacion = [],
  importeManual = 0
) {
  const cantidadNumero = modoVenta === "importe" ? 1 : parseFloat(cantidad) || 0;

  let nombreFinal = producto?.nombre || "";
  let categoriaFinal = producto?.categoria || "";

  if (modoVenta === "taco" && combinacion.length > 0) {
    nombreFinal = combinacion.map((p) => p.nombre).join(" + ");
    categoriaFinal = "carnitas-combinado";
  }

  const importe = calcularImporteItem(
    producto,
    modoVenta,
    cantidadNumero,
    combinacion,
    importeManual
  );

  return {
    itemId: `${Date.now()}-${Math.random()}`,
    productoId: producto?.id || null,
    nombre: nombreFinal,
    categoria: categoriaFinal,
    modoVenta,
    cantidad: cantidadNumero,
    importe,
    combinacion:
      modoVenta === "taco" && combinacion.length > 0
        ? combinacion.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            precio_taco: Number(p.precio_taco) || 0,
          }))
        : [],
  };
}

export function calcularTotalTicket(items) {
  return items.reduce((acc, item) => acc + item.importe, 0);
}
