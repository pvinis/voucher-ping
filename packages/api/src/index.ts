import { Hono } from "hono"
import { cors } from "hono/cors"
import { Resend } from "resend"
import { config } from "dotenv"
import { join } from "path"

const rootDir = join(process.cwd(), "..", "..")
config({ path: join(rootDir, ".env") })

const PORT = process.env.PORT || 3001
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const app = new Hono()

app.use(
	"/*",
	cors({
		origin: "*",
		allowMethods: ["POST", "OPTIONS"],
		allowHeaders: ["Content-Type"],
	}),
)

app.post("/api/subscribe", async (c) => {
	try {
		const body = await c.req.json<{ email?: string }>()
		const { email } = body

		if (!email || typeof email !== "string") {
			return c.json({ success: false, message: "Invalid email" }, 400)
		}

		if (resend) {
			try {
				await resend.contacts.create({
					email,
					audienceId: "1f918c14-b245-4b04-99c9-aa3b3ec8ed61",
				})
				console.log(`Added ${email} to Resend audience`)
			} catch (resendError) {
				console.error("Failed to add to Resend audience:", resendError)
			}
		} else {
			console.log("Resend audience not configured, skipping audience addition")
		}

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
