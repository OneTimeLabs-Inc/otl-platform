import type { BusinessType } from "./businessLaunch";

export type SiteLayoutConfig = {
  palette?: {
    background?: string;
    surface?: string;
    text?: string;
    muted?: string;
    accent?: string;
    accent2?: string;
  };
  hero?: string;
  cards?: string;
  nav?: string;
  radius?: string;
  font?: string;
};

export type SiteLayout = {
  id: string;
  code: string;
  name: string;
  description: string;
  style_key: string;
  supported_business_types: BusinessType[];
  config: SiteLayoutConfig;
  preview_image_url: string | null;
  is_system: boolean;
  active: boolean;
};

export type UploadedLayoutManifest = {
  code?: string;
  name: string;
  description?: string;
  styleKey?: string;
  config: SiteLayoutConfig;
  previewImageUrl?: string;
};
