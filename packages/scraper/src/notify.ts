import { Resend } from "resend";
import type { Voucher } from "@voucher-ping/db";
import { getSubscribers } from "@voucher-ping/db";

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY;
let resend: Resend | null = null;

if (resendApiKey) {
	resend = new Resend(resendApiKey);
} else {
	console.warn(
		"RESEND_API_KEY not found in environment variables. Email notifications will be disabled.",
	);
}

/**
 * Generates HTML email content for voucher notifications
 */
function generateEmailTemplate(vouchers: Voucher[]): string {
	// Simple HTML email template
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
                    <img src="${voucher.imageUrl}" alt="${voucher.title}">
                    <div class="voucher-title">${voucher.title}</div>
                    <a href="${voucher.url}" class="voucher-link">View Voucher</a>
                </div>
            `,
				)
				.join("")}

            <p>Don't miss out on these opportunities!</p>
        </div>
        <div class="footer">
            <p>You're receiving this email because you subscribed to voucher notifications.
            <a href="{{unsubscribe_url}}" class="unsubscribe">Unsubscribe</a></p>
        </div>
    </body>
    </html>
    `;
}

/**
 * Sends email notifications to all subscribers about new vouchers
 */
export async function notifySubscribers(newVouchers: Voucher[]): Promise<void> {
	if (!resend) {
		console.warn("Email notifications disabled: No Resend API key");
		return;
	}

	if (newVouchers.length === 0) {
		console.log("No new vouchers to notify about");
		return;
	}

	// Get all subscribers
	const subscribers = await getSubscribers();
	if (subscribers.length === 0) {
		console.log("No subscribers to notify");
		return;
	}

	console.log(
		`Sending notifications to ${subscribers.length} subscribers about ${newVouchers.length} new vouchers`,
	);

	// Generate email content
	const html = generateEmailTemplate(newVouchers);

	// Send emails
	const emailPromises = subscribers.map(async (subscriber) => {
		try {
			const { data, error } = await resend!.emails.send({
				from: "Voucher Ping <notifications@yourdomain.com>",
				to: subscriber.email,
				subject: `${newVouchers.length} New Voucher${newVouchers.length > 1 ? "s" : ""} Available!`,
				html: html,
			});

			if (error) {
				throw error;
			}

			console.log(`Email sent to ${subscriber.email}: ${data?.id}`);
			return { email: subscriber.email, success: true };
		} catch (error) {
			console.error(
				`Failed to send email to ${subscriber.email}:`,
				error,
			);
			return { email: subscriber.email, success: false, error };
		}
	});

	const results = await Promise.all(emailPromises);
	const successCount = results.filter((r) => r.success).length;

	console.log(
		`Email notification summary: ${successCount}/${subscribers.length} sent successfully`,
	);
}

/**
 * For testing: logs notification info without sending emails
 */
export function mockNotifySubscribers(newVouchers: Voucher[]): void {
	console.log("MOCK NOTIFICATION");
	console.log(
		`Would send notifications about ${newVouchers.length} new vouchers:`,
	);
	newVouchers.forEach((voucher, i) => {
		console.log(`${i + 1}. ${voucher.title} - ${voucher.url}`);
	});
}
