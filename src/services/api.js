import { API_URL } from "@env";

export async function apiGet(endpoint) {
  const response = await fetch(`${API_URL}${endpoint}`);
  if (!response.ok) throw new Error("Error al consultar la API");
  return response.json();
}

export async function apiPost(endpoint, data) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error al enviar datos a la API");
  return response.json();
}

export async function apiPut(endpoint, data) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error al actualizar datos");
  return response.json();
}

export async function apiDelete(endpoint) {
  const response = await fetch(`${API_URL}${endpoint}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Error al eliminar datos");
  return response.json();
}
