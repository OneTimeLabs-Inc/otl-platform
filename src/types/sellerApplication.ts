/* ==========================================================
   SELLER APPLICATION 001
   Shared Store seller application model
   ========================================================== */

export type SellerApplicationStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface SellerApplication {
  id: string;
  auth_user_id: string;
  email: string;
  display_name: string;
  slug: string;
  selling_description: string;
  status: SellerApplicationStatus;
  seller_id: string | null;
  review_note: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}
