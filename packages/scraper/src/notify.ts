import { Resend } from "resend"
import type { Voucher } from "@voucher-ping/db"
import { RESEND_AUDIENCE_ID, RESEND_FROM_EMAIL, SITE_URL } from "./config"

const resendApiKey = process.env.RESEND_API_KEY
let resend: Resend | null = null

if (resendApiKey) {
	resend = new Resend(resendApiKey)
} else {
	console.warn(
		"RESEND_API_KEY not found in environment variables. Email notifications will be disabled.",
	)
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;")
}

function generateEmailTemplate(vouchers: Voucher[]): string {
	return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Vouchers Available!</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #4F46E5;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }
            .content {
                padding: 20px;
                background-color: #f9f9f9;
            }
            .voucher {
                margin-bottom: 25px;
                border: 1px solid #ddd;
                padding: 15px;
                border-radius: 5px;
                background-color: white;
            }
            .voucher img {
                max-width: 100%;
                height: auto;
                border-radius: 5px;
                margin-bottom: 10px;
            }
            .voucher-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .voucher-link {
                display: inline-block;
                background-color: #4F46E5;
                color: white;
                padding: 8px 15px;
                text-decoration: none;
                border-radius: 3px;
                margin-top: 10px;
            }
            .footer {
                text-align: center;
                padding: 20px;
                font-size: 12px;
                color: #666;
            }
            .unsubscribe {
                color: #999;
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>New Vouchers Available!</h1>
        </div>
        <div class="content">
            <p>We found ${vouchers.length} new voucher${vouchers.length > 1 ? "s" : ""} that might interest you:</p>

            ${vouchers
							.map(
								(voucher) => `
                <div class="voucher">
                    <img src="${escapeHtml(voucher.imageUrl)}" alt="${escapeHtml(voucher.title)}">
                    <div class="voucher-title">${escapeHtml(voucher.title)}</div>
                    <a href="${escapeHtml(voucher.url)}" class="voucher-link">View Voucher</a>
                </div>
            `,
							)
							.join("")}

            <p>Don't miss out on these opportunities!</p>
            <p><a href="${escapeHtml(SITE_URL)}">See all vouchers on Voucher Ping</a></p>
        </div>
        <div class="footer">
            <p>You're receiving this email because you subscribed to voucher notifications.
            <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" class="unsubscribe">Unsubscribe</a></p>
        </div>
    </body>
    </html>
    `
}

/**
 * Sends one broadcast to the Resend audience. Subscribers are not stored in our
 * database (the `Subscriber` table was dropped in the `remove_emails`
 * migration), so we never hold a recipient list ourselves — Resend owns the
 * audience and injects the per-recipient unsubscribe URL.
 */
export async function notifySubscribers(newVouchers: Voucher[]): Promise<void> {
	if (!resend) {
		console.warn("Email notifications disabled: No Resend API key")
		return
	}

	if (newVouchers.length === 0) {
		console.log("No new vouchers to notify about")
		return
	}

	const subject = `${newVouchers.length} New Voucher${newVouchers.length > 1 ? "s" : ""} Available!`

	const { data: broadcast, error: createError } = await resend.broadcasts.create({
		audienceId: RESEND_AUDIENCE_ID,
		from: RESEND_FROM_EMAIL,
		subject,
		html: generateEmailTemplate(newVouchers),
	})

	if (createError || !broadcast) {
		throw new Error(`Failed to create broadcast: ${JSON.stringify(createError)}`)
	}

	const { error: sendError } = await resend.broadcasts.send(broadcast.id)

	if (sendError) {
		throw new Error(`Failed to send broadcast ${broadcast.id}: ${JSON.stringify(sendError)}`)
	}

	console.log(`Broadcast ${broadcast.id} sent to audience ${RESEND_AUDIENCE_ID}: "${subject}"`)
}

export function mockNotifySubscribers(newVouchers: Voucher[]): void {
	console.log("MOCK NOTIFICATION")
	console.log(`Would send notifications about ${newVouchers.length} new vouchers:`)
	newVouchers.forEach((voucher, i) => {
		console.log(`${i + 1}. ${voucher.title} - ${voucher.url}`)
	})
}
