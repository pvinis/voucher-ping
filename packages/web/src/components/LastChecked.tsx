import { useState, useEffect } from "react"
import { fetchLastScraperRun } from "../services/sqlite"

const LastChecked = () => {
	const [lastRun, setLastRun] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const getLastRun = async () => {
			try {
				setLoading(true)
				const timestamp = await fetchLastScraperRun()
				setLastRun(timestamp)
			} catch (error) {
				console.error("Error fetching last scraper run:", error)
			} finally {
				setLoading(false)
			}
		}

		getLastRun()
	}, [])

	const formatRelativeTime = (timestamp: string): string => {
		const now = new Date()
		const lastRunDate = new Date(timestamp)
		const diffInMs = now.getTime() - lastRunDate.getTime()
		const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
		const diffInHours = Math.floor(diffInMinutes / 60)
		const diffInDays = Math.floor(diffInHours / 24)

		if (diffInDays > 0) {
			return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`
		} else if (diffInHours > 0) {
			return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`
		} else if (diffInMinutes > 0) {
			return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`
		} else {
			return "Just now"
		}
	}

	if (loading) {
		return (
			<div className="text-sm text-gray-500">
				<span className="animate-pulse">Loading last check time...</span>
			</div>
		)
	}

	if (!lastRun) {
		return (
			<div className="text-sm text-gray-500">
				Last checked: <span className="text-gray-400">Unknown</span>
			</div>
		)
	}

	return (
		<div className="text-sm text-gray-500">
			Last checked: <span className="text-gray-600">{formatRelativeTime(lastRun)}</span>
		</div>
	)
}

export default LastChecked