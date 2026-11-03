import { apiGet, apiPost, type AuthMePayload, type LoginPayload } from "./client";

export async function loginRequest(username: string, password: string): Promise<LoginPayload> {
  return apiPost<LoginPayload>("/auth/login", { username, password });
}

export async function logoutRequest(): Promise<{ loggedOut: boolean }> {
  return apiPost<{ loggedOut: boolean }>("/auth/logout");
}

export async function fetchMe(): Promise<AuthMePayload> {
  return apiGet<AuthMePayload>("/auth/me");
}
