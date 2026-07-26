/**
 * Resend configuration. Subscribers are not stored locally (the `Subscriber`
 * table was dropped in the `remove_emails` migration) — they live in a Resend
 * audience, which is also what handles unsubscribes.
 */

/**
 * Audience the subscribe endpoint writes to and broadcasts are sent to.
 * Resend v6 deprecates `audienceId` in favour of `segmentId`; migrate when the
 * audience is replaced by a segment.
 */
export const RESEND_AUDIENCE_ID =
	process.env.RESEND_AUDIENCE_ID ?? "1f918c14-b245-4b04-99c9-aa3b3ec8ed61"

/** Verified sender. Must be on a domain verified in Resend or sends will fail. */
export const RESEND_FROM_EMAIL =
	process.env.RESEND_FROM_EMAIL ?? "Voucher Ping <onboarding@resend.dev>"

/** Public site, linked from the email footer. */
export const SITE_URL = process.env.SITE_URL ?? "https://voucher-ping.vercel.app"
