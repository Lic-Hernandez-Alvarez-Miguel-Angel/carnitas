import { API_URL } from "@env";

async function leerRespuesta(response) {
  const texto = await response.text();

  try {
    return texto ? JSON.parse(texto) : null;
  } catch {
    return texto;
  }
}

function obtenerMensajeError(data, mensajeDefault) {
  if (!data) return mensajeDefault;

  if (typeof data === "string") {
    return data;
  }

  return (
    data.error ||
    data.mensaje ||
    data.message ||
    mensajeDefault
  );
}

export async function apiGet(endpoint) {
  const response = await fetch(`${API_URL}${endpoint}`);

  const data = await leerRespuesta(response);

  if (!response.ok) {
    throw new Error(obtenerMensajeError(data, "Error al consultar la API"));
  }

  return data;
}

export async function apiPost(endpoint, data) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const responseData = await leerRespuesta(response);

  if (!response.ok) {
    throw new Error(obtenerMensajeError(responseData, "Error al enviar datos a la API"));
  }

  return responseData;
}

export async function apiPut(endpoint, data) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const responseData = await leerRespuesta(response);

  if (!response.ok) {
    throw new Error(obtenerMensajeError(responseData, "Error al actualizar datos"));
  }

  return responseData;
}

export async function apiDelete(endpoint) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "DELETE",
  });

  const data = await leerRespuesta(response);

  if (!response.ok) {
    throw new Error(obtenerMensajeError(data, "Error al eliminar datos"));
  }

  return data;
}