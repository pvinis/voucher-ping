import { PrismaClient } from "@prisma/client"
import type { Voucher, Subscriber, Metadata } from "@prisma/client"
export type { Voucher, Subscriber, Metadata } from "@prisma/client"

const prisma = new PrismaClient()

export type VoucherToBeAdded = Omit<Voucher, "id" | "discoveredAt">

export async function addVoucher(voucher: VoucherToBeAdded): Promise<Voucher> {
	const existingVoucher = await prisma.voucher.findUnique({
		where: { url: voucher.url },
	})

	if (existingVoucher) {
		return existingVoucher
	}

	return await prisma.voucher.create({
		data: {
			...voucher,
			discoveredAt: new Date().toISOString(),
			tags: voucher.tags as string[],
		},
	})
}

export async function getVouchers(): Promise<Voucher[]> {
	return await prisma.voucher.findMany({
		orderBy: { discoveredAt: "desc" },
	})
}

export async function getSubscribers(): Promise<{ email: string }[]> {
	// TODO: Implement subscribers functionality when User model is added
	return []
}

export async function getLastScraperRun(): Promise<Date | null> {
	const metadata = await prisma.metadata.findFirst()
	return metadata ? new Date(metadata.lastRunAt) : null
}

export async function updateLastScraperRun(): Promise<void> {
	const now = new Date().toISOString()

	await prisma.metadata.upsert({
		where: { id: "singleton" },
		create: {
			id: "singleton",
			lastRunAt: now,
		},
		update: {
			lastRunAt: now,
		},
	})
}
