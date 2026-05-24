/**
 * services/mockOtp.ts — renamed for the API era.
 *
 * Same public surface as the dev mock (requestOtp / verifyOtp / requestVoiceOtp),
 * but each function now calls the Laravel /api/v1/auth/otp/* endpoints.
 * The AuthFlow component imports these exact names, so nothing in the UI
 * needs to change.
 *
 * In dev, when AFRICAS_TALKING_API_KEY is empty, the backend's LogSmsDriver
 * writes the code to storage/logs/laravel.log — `tail -f` it as you sign in.
 */

import { apiFetch } from "../lib/apiClient";

interface OtpResponse {
  ok: true;
  expires_in_sec: number;
}

interface VerifyResponse {
  ok: boolean;
  is_new: boolean;
  user?: {
    id: number;
    role: string;
    phone: string;
    name: string;
  };
}

export async function requestOtp(
  phone: string,
  region: "TZ" | "KE" = "TZ"
): Promise<{ ok: true; expiresInSec: number }> {
  const res = await apiFetch<OtpResponse>("/api/v1/auth/otp/request", {
    method: "POST",
    body: { phone, region, channel: "sms" },
  });
  return { ok: true, expiresInSec: res.expires_in_sec };
}

export async function requestVoiceOtp(
  phone: string,
  region: "TZ" | "KE" = "TZ"
): Promise<{ ok: true; expiresInSec: number }> {
  const res = await apiFetch<OtpResponse>("/api/v1/auth/otp/request", {
    method: "POST",
    body: { phone, region, channel: "voice" },
  });
  return { ok: true, expiresInSec: res.expires_in_sec };
}

/**
 * Verify an OTP. When the phone is new, the caller must pass `role` (and
 * optionally `name`) so the backend can create the account in one step.
 */
export async function verifyOtp(
  phone: string,
  code: string,
  opts?: { region?: "TZ" | "KE"; role?: string; name?: string }
): Promise<{ ok: boolean; reason?: string; isNew?: boolean }> {
  try {
    const res = await apiFetch<VerifyResponse>("/api/v1/auth/otp/verify", {
      method: "POST",
      body: {
        phone,
        code,
        region: opts?.region ?? "TZ",
        role: opts?.role,
        name: opts?.name,
      },
    });
    return { ok: res.ok, isNew: res.is_new };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Incorrect code" };
  }
}
