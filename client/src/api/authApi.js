import axiosInstance from "./axiosInstance";

export async function signup({ email, password }) {
  const { data } = await axiosInstance.post("/api/auth/signup", { email, password });
  return data.user;
}

export async function login({ email, password }) {
  const { data } = await axiosInstance.post("/api/auth/login", { email, password });
  return data.user;
}

export async function logout() {
  await axiosInstance.post("/api/auth/logout");
}

export async function fetchMe() {
  const { data } = await axiosInstance.get("/api/auth/me");
  return data.user;
}

export async function updateTheme(theme) {
  const { data } = await axiosInstance.patch("/api/auth/me/theme", { theme });
  return data.user;
}
