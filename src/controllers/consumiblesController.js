import { apiGet, apiPost } from "../services/api";

export async function obtenerPuntosVenta() {
  try {
    return await apiGet("/consumibles/puntos-venta");
  } catch (error) {
    console.log("Error obtenerPuntosVenta:", error);
    return [];
  }
}

export async function registrarSalidaConsumible(data) {
  try {
    return await apiPost("/consumibles/salidas", data);
  } catch (error) {
    console.log("Error registrarSalidaConsumible:", error);
    return { error: "No se pudo registrar el consumible." };
  }
}

export async function registrarSobraConsumible(data) {
  try {
    return await apiPost("/consumibles/sobras", data);
  } catch (error) {
    console.log("Error registrarSobraConsumible:", error);
    return { error: "No se pudo registrar la sobra." };
  }
}