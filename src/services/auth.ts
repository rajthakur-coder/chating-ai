import api from "@/lib/api";

export type CurrentUser = {
  id?: string;
  email?: string;
  name?: string;
};

export type SignInPayload = {
  email: string;
  password: string;
};

export type SignInResponse = {
  id?: string;
  email?: string;
  name?: string;
  verified?: boolean;
  onboarding_completed?: boolean;
  message?: string;
};

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
