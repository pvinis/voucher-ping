import type { Voucher } from "@voucher-ping/db"
import { useState, useEffect } from "react"

export async function fetchVouchers(): Promise<Voucher[]> {
	try {
		const response = await fetch(
			"https://raw.githubusercontent.com/pvinis/voucher-ping/main/packages/db/data/db.json",
		)

		if (!response.ok) {
			throw new Error(`Failed to fetch vouchers: ${response.status} ${response.statusText}`)
		}

		const data = await response.json()
		return data.vouchers || []
	} catch (error) {
		console.error("Error fetching vouchers from GitHub:", error)
		throw error
	}
}

const VoucherList = () => {
	const [vouchers, setVouchers] = useState<Voucher[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const getVouchersData = async () => {
			try {
				setLoading(true)

				const data = await fetchVouchers()
				setVouchers(data)
				setError(null)
			} catch (err) {
				console.error("Error fetching vouchers:", err)
				setError(
					"Failed to load vouchers from GitHub. Please check your internet connection and try again later.",
				)
			} finally {
				setLoading(false)
			}
		}

		getVouchersData()
	}, [])

	// Format date to a readable string
	const formatDate = (dateString: string): string => {
		const date = new Date(dateString)
		return new Intl.DateTimeFormat("en-GB", {
			day: "numeric",
			month: "short",
			year: "numeric",
		}).format(date)
	}

	if (loading) {
		return (
			<div className="flex justify-center items-center py-12">
				<div className="animate-pulse text-gray-500">Loading vouchers...</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-sm p-4 text-red-700">{error}</div>
		)
	}

	if (vouchers.length === 0) {
		return (
			<div className="bg-gray-50 border border-gray-200 rounded-sm p-6 text-center text-gray-500">
				No vouchers available at the moment. Check back soon!
			</div>
		)
	}

	return (
		<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{vouchers.map((voucher) => (
				<div
					key={voucher.id}
					className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs hover:shadow-md transition-shadow"
				>
					<div className="relative pb-[56.25%]">
						{" "}
						{/* 16:9 aspect ratio */}
						<img
							src={voucher.imageUrl}
							alt={voucher.title}
							className="absolute inset-0 w-full h-full object-cover"
						/>
					</div>

					<div className="p-4">
						<h3 className="text-lg font-semibold mb-2">{voucher.title}</h3>

						<div className="flex items-center text-sm text-gray-500 mb-4">
							<svg
								className="w-4 h-4 mr-1"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
								></path>
							</svg>
							<span>Discovered on {formatDate(voucher.discoveredAt)}</span>
						</div>

						<a
							href={voucher.url}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-sm hover:bg-indigo-700 transition-colors"
						>
							View Voucher
						</a>
					</div>
				</div>
			))}
		</div>
	)
}

export default VoucherList
