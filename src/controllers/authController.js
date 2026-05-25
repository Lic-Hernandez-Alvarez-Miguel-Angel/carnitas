import { apiPost } from "../services/api";

export const login = async (correo, password) => {
  try {
    const response = await apiPost("/login", {
      correo,
      password,
    });

    return response;
  } catch (error) {
    console.log("Error login:", error);
    return null;
  }
};