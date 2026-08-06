export interface Organization {
  id: string;

  name: string;

  slug: string;

  active: boolean;

  customer_id: string | null;

  created_at: string;

  updated_at: string;
}