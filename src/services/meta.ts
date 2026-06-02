import api from "@/lib/api";

export type WhatsAppNumberSetupPayload = {
  authorization_token: string;
  phone_number_id: string;
  waba_id: string;
  business_id: string;
};

export async function setupWhatsappNumber(payload: WhatsAppNumberSetupPayload) {
  const response = await api.post("/whatsapp-credential/number-setup", payload);
  return response.data;
}

export async function getWhatsappCredential() {
  const response = await api.get("/whatsapp-credential/get");
  return response.data;
}
