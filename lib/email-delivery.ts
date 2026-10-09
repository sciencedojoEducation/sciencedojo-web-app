import type { CreateEmailOptions, CreateEmailRequestOptions, CreateEmailResponse } from "resend";

export type ProviderEmailRequestOptions = CreateEmailRequestOptions & { signal?: AbortSignal };

export type ProviderEmailResult =
  | { success: true; mock?: false; data: CreateEmailResponse }
  | { success: false; mock?: false; error: unknown };

export async function deliverProviderEmail(
  send: (message: CreateEmailOptions, options?: ProviderEmailRequestOptions) => Promise<CreateEmailResponse>,
  message: CreateEmailOptions,
  options?: ProviderEmailRequestOptions,
): Promise<ProviderEmailResult> {
  try {
    const response = await send(message, options);
    if (response.error) return { success: false, error: response.error };
    if (!response.data?.id) {
      return { success: false, error: new Error("The email provider returned no message ID.") };
    }
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error };
  }
}
