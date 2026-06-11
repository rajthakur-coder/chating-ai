import api from "@/lib/api";
import type { WhatsAppNumberSetupPayload } from "@/types/meta";

export type { WhatsAppNumberSetupPayload } from "@/types/meta";

export async function setupWhatsappNumber(payload: WhatsAppNumberSetupPayload) {
  const response = await api.post("/whatsapp-credential/number-setup", payload);
  return response.data;
}

export async function getWhatsappCredential() {
  const response = await api.get("/whatsapp-credential/get");
  return response.data;
}
