import api from "@/lib/api";
import type { CurrentUser, SignInPayload, SignInResponse } from "@/types/auth";

export type { CurrentUser, SignInPayload, SignInResponse } from "@/types/auth";

export async function signIn(payload: SignInPayload) {
  const response = await api.post<SignInResponse>("/auth/sign-in", payload);
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get<CurrentUser>("/auth/me");
  return response.data;
}

export async function signOut() {
  const response = await api.post<{ message: string }>("/auth/sign-out");
  return response.data;
}
