# Launch Console cleanup + guarded Joker DNS patch

## Launch Console

- Removed the internal marketing/hero block.
- Removed Branding & Public Contact from Platform.
- Platform no longer sends or validates logo, hero image, color, tagline, public description, contact email, phone, or website during launch.
- Branding/public contact now remain customer-admin responsibilities.
- Application Template is now a dropdown.
- `SMB Scheduling & Operations` remains the only launchable template today.
- `Appointments & Booking` and `Service & Work Orders` are shown as disabled planned options rather than pretending they are already provisionable.
- Renumbered Enabled Modules to step 4 and Provision to step 5.

## Joker DNS safety

The Joker helper now treats `dns-zone-put` as the dangerous full-zone replacement operation that it is.

Before any write it:
1. Reads the complete `onetimelabs.net` zone with defaults included.
2. Refuses an empty zone response.
3. Validates the requested subdomain label and CNAME target.
4. Refuses to modify a hostname that already has any record.
5. Builds the outgoing zone from the exact returned zone text plus exactly one appended CNAME.
6. Verifies the pre-write diff contains every old record and exactly one new record.
7. Refuses an oversized URL-encoded zone request rather than risk truncation.

After the write it:
1. Re-reads the Joker zone immediately.
2. Confirms every original record is still present.
3. Confirms exactly one record was added.
4. Confirms that added record is the requested CNAME.

There is deliberately no automatic rollback. If post-write verification fails, the code stops and reports the failure rather than issuing a second destructive full-zone replacement automatically.

## Files changed

- `src/pages/launchConsole/LaunchConsole.tsx`
- `src/pages/launchConsole/LaunchConsole.css`
- `src/types/businessLaunch.ts`
- `api/admin/business-launch.ts`
- `api/_lib/jokerDns.ts`

No `.env.local`, package files, build output, or unrelated source files are included.
