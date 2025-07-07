import { Resend } from "resend"

const PORT = process.env.PORT || 3001
const resend = new Resend(process.env.RESEND_API_KEY)

const server = Bun.serve({
	port: PORT,
	async fetch(req) {
		const url = new URL(req.url)

		const headers = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
			"Content-Type": "application/json",
		}

		if (req.method === "OPTIONS") {
			return new Response(null, { headers })
		}

		if (url.pathname === "/api/subscribe" && req.method === "POST") {
			try {
				const body = (await req.json()) as { email?: string }
				const { email } = body

				if (!email || typeof email !== "string") {
					return new Response(JSON.stringify({ success: false, message: "Invalid email" }), {
						status: 400,
						headers,
					})
				}

				if (process.env.RESEND_API_KEY && process.env.RESEND_AUDIENCE_ID) {
					try {
						await resend.contacts.create({
							email,
							audienceId: process.env.RESEND_AUDIENCE_ID,
						})
						console.log(`Added ${email} to Resend audience`)
					} catch (resendError) {
						console.error("Failed to add to Resend audience:", resendError)
					}
				} else {
					console.log("Resend audience not configured, skipping audience addition")
				}

				return new Response(
					JSON.stringify({ success: true, message: "Successfully subscribed!" }),
					{ headers },
				)
			} catch (error) {
				console.error("Subscription error:", error)
				return new Response(JSON.stringify({ success: false, message: "Failed to subscribe" }), {
					status: 500,
					headers,
				})
			}
		}

		return new Response("Not Found", { status: 404 })
	},
})

console.log(`API server running on http://localhost:${PORT}`)
