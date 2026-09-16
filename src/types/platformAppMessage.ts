export type PlatformAppMessage = {
  app_slug: string;
  message: string;
  is_active: boolean;
  updated_at: string;
  updated_by: string | null;
};

export type SavePlatformAppMessageInput = {
  app_slug: string;
  message: string;
  is_active: boolean;
};
