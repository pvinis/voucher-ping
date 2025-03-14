import { useState } from "react";
import type { FormEvent } from "react";

interface SubscribeFormProps {
	onSubscribe: (email: string) => void;
	error: string | null;
}

const SubscribeForm = ({ onSubscribe, error }: SubscribeFormProps) => {
	const [email, setEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);

	const validateEmail = (email: string): boolean => {
		const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return regex.test(email);
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();

		// Clear validation errors
		setValidationError(null);

		// Validate email
		if (!email.trim()) {
			setValidationError("Email is required");
			return;
		}

		if (!validateEmail(email)) {
			setValidationError("Please enter a valid email address");
			return;
		}

		// Submit the form
		setIsSubmitting(true);
		try {
			await onSubscribe(email);
			// Reset form on success (if not redirected)
			setEmail("");
		} catch (err) {
			// Error handling is done via props.error in parent component
			console.error("Error in subscription form:", err);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label
					htmlFor="email"
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					Email Address
				</label>
				<input
					type="email"
					id="email"
					value={email}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						setEmail(e.target.value)
					}
					className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
					placeholder="you@example.com"
					disabled={isSubmitting}
					required
				/>
				{validationError && (
					<p className="mt-1 text-sm text-red-600">
						{validationError}
					</p>
				)}
			</div>

			{error && (
				<div className="p-3 bg-red-50 border border-red-200 rounded-md">
					<p className="text-sm text-red-600">{error}</p>
				</div>
			)}

			<button
				type="submit"
				disabled={isSubmitting}
				className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600
          hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
          ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
			>
				{isSubmitting ? "Subscribing..." : "Subscribe to Alerts"}
			</button>

			<p className="text-xs text-gray-500 mt-2">
				We'll only use your email to send voucher notifications. You can
				unsubscribe at any time.
			</p>
		</form>
	);
};

export default SubscribeForm;
