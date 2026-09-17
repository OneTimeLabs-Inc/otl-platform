# OneTime Labs Platform — Consulting Operations Setup

## 1. Run the database migration
Run `sql/004_consulting_operations.sql` against the Supabase project used by Platform.

This creates:
- `consulting_clients`
- `consulting_contracts`
- `consulting_invoices`

The tables use RLS with no browser policies. Platform's authenticated server-side admin API uses the service-role key.

## 2. Configure Stripe
Add this environment variable to the Platform Vercel project:

`STRIPE_SECRET_KEY=sk_...`

Use the Stripe secret key only on the server. Do not create a `VITE_` version of this variable.

## 3. Deploy Platform
The consulting feature adds one API function:

`/api/admin/consulting`

All consulting operations route through that single function.

## 4. Platform workflow
Open **Consulting** from the Platform sidebar.

1. Create a client.
2. Create a consultation contract / SOW draft.
3. Use **View** to review, copy, or print/save the agreement as PDF.
4. Create a Stripe draft invoice.
5. Review the invoice in Platform/Stripe.
6. Click **Send** when ready.

## Contract note
The generated agreement is a reusable operational template, not a substitute for legal review. Review and customize terms before execution.
