import axios from "axios";
import { API_BASE_URL } from "./config";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45_000,
});

const SESSION_KEY = "metacapital.sessionId";

export function getSessionId() {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, id);
  return id;
}

api.interceptors.request.use((config) => {
  config.headers.set("X-Session-Id", getSessionId());
  return config;
});

export async function getHealth() {
  const response = await api.get<{ ok: boolean; settings: Record<string, unknown> }>("/health", {
    timeout: 60_000,
  });
  return response.data;
}
