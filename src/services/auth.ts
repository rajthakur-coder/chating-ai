import api from "@/lib/api";

export type CurrentUser = {
  id?: string;
  email?: string;
  name?: string;
};

export async function getCurrentUser() {
  const response = await api.get<CurrentUser>("/auth/me");
  return response.data;
}

export async function signOut() {
  const response = await api.post<{ message: string }>("/auth/sign-out");
  return response.data;
}
