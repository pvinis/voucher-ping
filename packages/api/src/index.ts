import { Hono } from "hono"
import { cors } from "hono/cors"
import { Resend } from "resend"
import { config } from "dotenv"
import { join } from "path"

const rootDir = join(process.cwd(), "..", "..")
config({ path: join(rootDir, ".env") })

const PORT = process.env.PORT || 3001
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? "1f918c14-b245-4b04-99c9-aa3b3ec8ed61"

/** Comma-separated list of allowed origins; defaults to local dev only. */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
	.split(",")
	.map((o) => o.trim())
	.filter(Boolean)

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const app = new Hono()

app.use(
	"/*",
	cors({
		origin: ALLOWED_ORIGINS,
		allowMethods: ["POST", "OPTIONS"],
		allowHeaders: ["Content-Type"],
	}),
)

app.get("/health", (c) => c.json({ ok: true }))

app.post("/api/subscribe", async (c) => {
	try {
		const body = await c.req.json<{ email?: string }>()
		const email = body.email?.trim()

		if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
			return c.json({ success: false, message: "Invalid email" }, 400)
		}

		if (!resend) {
			// Without a key nothing is stored anywhere, so don't tell the user they
			// are subscribed.
			console.error("RESEND_API_KEY is not set — cannot store subscriber")
			return c.json({ success: false, message: "Subscriptions are temporarily unavailable" }, 503)
		}

		const { error } = await resend.contacts.create({
			email,
			audienceId: AUDIENCE_ID,
			unsubscribed: false,
		})

		if (error) {
			console.error("Failed to add to Resend audience:", error)
			return c.json({ success: false, message: "Failed to subscribe" }, 502)
		}

		console.log(`Added ${email} to Resend audience`)
		return c.json({ success: true, message: "Successfully subscribed!" })
	} catch (error) {
		console.error("Subscription error:", error)
		return c.json({ success: false, message: "Failed to subscribe" }, 500)
	}
})

console.log(`API server running on http://localhost:${PORT}`)

export default {
	port: PORT,
	fetch: app.fetch,
}
