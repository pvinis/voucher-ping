import { useState } from "react"
import SubscribeForm from "./components/SubscribeForm"
import VoucherList from "./components/VoucherList"
import LastChecked from "./components/LastChecked"

function App() {
	const [subscribed, setSubscribed] = useState(false)
	const [email, setEmail] = useState("")
	const [error, setError] = useState<string | null>(null)

	const handleSubscribe = async (subscribedEmail: string) => {
		try {
			// For this demo, we'll just simulate a successful subscription
			// In a real app, you would call an API endpoint here
			console.log(`Subscribing email: ${subscribedEmail}`)
			////

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 500))

			setSubscribed(true)
			setEmail(subscribedEmail)
			setError(null)
		} catch (err) {
			setError("Failed to subscribe. Please try again later.")
			console.error("Subscription error:", err)
		}
	}

	return (
		<div className="min-h-screen flex flex-col">
			<header className="bg-indigo-600 text-white py-6">
				<div className="container mx-auto px-4">
					<h1 className="text-3xl font-bold">Voucher Ping</h1>
					<p className="mt-2">Get notified when new vouchers become available</p>
				</div>
			</header>

			<main className="grow container mx-auto px-4 py-8">
				<div className="max-w-3xl mx-auto">
					{!subscribed ? (
						<div className="bg-white shadow-md rounded-sm p-6 mb-8">
							<h2 className="text-2xl font-semibold mb-4">Get Voucher Alerts</h2>
							<p className="mb-6 text-gray-600">
								We'll send you an email whenever new vouchers are available. No spam, just
								notifications.
							</p>
							<SubscribeForm onSubscribe={handleSubscribe} error={error} />
						</div>
					) : (
						<div className="bg-green-50 border border-green-200 rounded-sm p-6 mb-8">
							<h2 className="text-2xl font-semibold text-green-700 mb-2">You're subscribed!</h2>
							<p className="text-green-600">
								We'll send notifications to <strong>{email}</strong> when new vouchers are
								available.
							</p>
						</div>
					)}

					<div className="mt-12">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-2xl font-semibold">Latest Vouchers</h2>
							<LastChecked />
						</div>
						<VoucherList />
					</div>
				</div>
			</main>

			<footer className="bg-gray-100 py-6">
				<div className="container mx-auto px-4 text-center text-gray-500">
					<p>© {new Date().getFullYear()} Voucher Ping. All rights reserved.</p>
					<p className="mt-2">
						Made by <span className="font-medium">Pavlos Vinieratos</span> • For hire:{" "}
						<a 
							href="https://quad.codes" 
							className="text-indigo-600 hover:text-indigo-800 underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							quad.codes
						</a>
					</p>
				</div>
			</footer>
		</div>
	)
}

export default App
