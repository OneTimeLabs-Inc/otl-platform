import { supabase } from "../lib/supabase";

import type {
  PlatformAppMessage,
  SavePlatformAppMessageInput,
} from "../types/platformAppMessage";


/* ==========================================================
   APP BROADCASTS 001
   Read the current global message for an application.
   ========================================================== */

export async function getPlatformAppMessage(
  appSlug: string,
): Promise<PlatformAppMessage | null> {

  const {
    data,
    error,
  } =
    await supabase
      .from("platform_app_messages")
      .select(
        [
          "app_slug",
          "message",
          "is_active",
          "updated_at",
          "updated_by",
        ].join(","),
      )
      .eq(
        "app_slug",
        appSlug,
      )
      .maybeSingle();


  if (error) {
    throw error;
  }


  return data as PlatformAppMessage | null;

}


/* ==========================================================
   APP BROADCASTS 002
   One row per app. Saving replaces that app's current
   global broadcast for every installed client.
   ========================================================== */

export async function savePlatformAppMessage(
  input: SavePlatformAppMessageInput,
): Promise<PlatformAppMessage> {

  const {
    data: authData,
  } =
    await supabase
      .auth
      .getUser();


  const {
    data,
    error,
  } =
    await supabase
      .from("platform_app_messages")
      .upsert(
        {
          app_slug:
            input.app_slug,

          message:
            input.message.trim(),

          is_active:
            input.is_active,

          updated_by:
            authData.user?.id ?? null,
        },
        {
          onConflict:
            "app_slug",
        },
      )
      .select(
        [
          "app_slug",
          "message",
          "is_active",
          "updated_at",
          "updated_by",
        ].join(","),
      )
      .single();


  if (error) {
    throw error;
  }


  return data as unknown as PlatformAppMessage;

}
