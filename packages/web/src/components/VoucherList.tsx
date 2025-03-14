import { useState, useEffect } from "react";

// Mock data for now - in a real app, this would come from an API
const MOCK_VOUCHERS = [
	{
		id: "1",
		title: "Digital Skills Voucher",
		url: "https://vouchers.gov.gr/digital-skills",
		imageUrl:
			"https://placehold.co/600x400/4F46E5/FFFFFF?text=Digital+Skills",
		discoveredAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
	},
	{
		id: "2",
		title: "Green Energy Rebate",
		url: "https://vouchers.gov.gr/green-energy",
		imageUrl:
			"https://placehold.co/600x400/10B981/FFFFFF?text=Green+Energy",
		discoveredAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
	},
	{
		id: "3",
		title: "Tourism Support Program",
		url: "https://vouchers.gov.gr/tourism",
		imageUrl: "https://placehold.co/600x400/F59E0B/FFFFFF?text=Tourism",
		discoveredAt: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
	},
];

interface Voucher {
	id: string;
	title: string;
	url: string;
	imageUrl: string;
	discoveredAt: string;
}

const VoucherList = () => {
	const [vouchers, setVouchers] = useState<Voucher[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// Simulate API call to fetch vouchers
		const fetchVouchers = async () => {
			try {
				setLoading(true);

				// In a real app, this would be an API call
				await new Promise((resolve) => setTimeout(resolve, 800));

				setVouchers(MOCK_VOUCHERS);
				setError(null);
			} catch (err) {
				console.error("Error fetching vouchers:", err);
				setError("Failed to load vouchers. Please try again later.");
			} finally {
				setLoading(false);
			}
		};

		fetchVouchers();
	}, []);

	// Format date to a readable string
	const formatDate = (dateString: string): string => {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat("en-GB", {
			day: "numeric",
			month: "short",
			year: "numeric",
		}).format(date);
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center py-12">
				<div className="animate-pulse text-gray-500">
					Loading vouchers...
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
				{error}
			</div>
		);
	}

	if (vouchers.length === 0) {
		return (
			<div className="bg-gray-50 border border-gray-200 rounded p-6 text-center text-gray-500">
				No vouchers available at the moment. Check back soon!
			</div>
		);
	}

	return (
		<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{vouchers.map((voucher) => (
				<div
					key={voucher.id}
					className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
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
						<h3 className="text-lg font-semibold mb-2">
							{voucher.title}
						</h3>

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
							<span>
								Discovered on {formatDate(voucher.discoveredAt)}
							</span>
						</div>

						<a
							href={voucher.url}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
						>
							View Voucher
						</a>
					</div>
				</div>
			))}
		</div>
	);
};

export default VoucherList;
