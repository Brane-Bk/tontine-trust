import { supabase } from "@/lib/supabase";

const TALYPAY_BASE_URL = "https://www.talypay-me.com/api/v1";
const TALYPAY_TOKEN = import.meta.env.VITE_TALYPAY_TOKEN;

export interface PaymentPayload {
  amount: number;
  currency?: string;
  customer_phone: string;
  profile_id: string;
  group_id?: string;
  transaction_type: "contribution" | "guarantee" | "payout" | "penalty";
  transaction_name: string;
  operator?: string;
}

export interface TalyPayResponse {
  success: boolean;
  reference?: string;
  status?: string;
  message?: string;
  amount?: number;
  currency?: string;
  raw?: unknown;
}

/**
 * Initie un paiement via l'API TalyPay.
 * - Envoie la requête à l'API
 * - Enregistre la transaction dans Supabase
 * - Retourne la réponse structurée
 */
export async function initPayment(payload: PaymentPayload): Promise<TalyPayResponse> {
  let apiResponse: any = null;
  let apiSuccess = false;

  try {
    const response = await fetch(`${TALYPAY_BASE_URL}/init-payment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TALYPAY_TOKEN}`,
        "Content-Type": "application/json",
        "Request-Environment": "production" // Requis par l'API TalyPay
      },
      body: JSON.stringify({
        amount: payload.amount,
        currency: payload.currency || "XOF",
        customer_phone: payload.customer_phone,
        payment_mode: payload.operator?.toUpperCase() || "MTN",
      }),
    });

    apiResponse = await response.json();
    apiSuccess = response.ok;
  } catch (networkError: any) {
    // Erreur réseau ou CORS
    console.error("TalyPay API Error:", networkError);
    apiResponse = { message: networkError.message || "Erreur réseau" };
    apiSuccess = false;
  }

  // Persister la transaction dans Supabase (succès ou échec)
  const { data: txData } = await supabase
    .from("transactions")
    .insert({
      profile_id: payload.profile_id,
      group_id: payload.group_id || null,
      type: payload.transaction_type,
      name: payload.transaction_name,
      amount: -Math.abs(payload.amount), // sortie d'argent = négatif
      talypay_reference: apiResponse?.reference || apiResponse?.transaction_id || null,
      talypay_status: apiSuccess ? "pending" : "failed",
      customer_phone: payload.customer_phone,
    })
    .select()
    .single();

  // Persister dans payment_requests
  await supabase.from("payment_requests").insert({
    profile_id: payload.profile_id,
    transaction_id: txData?.id || null,
    talypay_ref: apiResponse?.reference || apiResponse?.transaction_id || null,
    amount: payload.amount,
    currency: payload.currency || "XOF",
    customer_phone: payload.customer_phone,
    status: apiSuccess ? "pending" : "failed",
    api_response: apiResponse,
  });

  if (!apiSuccess) {
    return {
      success: false,
      message: apiResponse?.message || "Le paiement a échoué",
      raw: apiResponse,
    };
  }

  return {
    success: true,
    reference: apiResponse?.reference || apiResponse?.transaction_id || txData?.id,
    status: apiResponse?.status || "pending",
    amount: payload.amount,
    currency: payload.currency || "XOF",
    message: apiResponse?.message || "Paiement initié avec succès",
    raw: apiResponse,
  };
}
