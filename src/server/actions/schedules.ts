"use server"

import { db } from "@/drizzle/db"
import { scheduleAvailabilityTable, ScheduleTable } from "@/drizzle/schema"


type ScheduleRow = typeof ScheduleTable.$inferSelect
type AvailabilityRow = typeof scheduleAvailabilityTable.$inferSelect

export type FullSchedule = ScheduleRow & {
    availabilities :AvailabilityRow[]
}

export async function getSchdules(userId: string): Promise<FullSchedule | undefined> {
    try {

        const schedule = await db.query.ScheduleTable.findFirst({
            where: ({ clerkUserId }, { eq }) => eq(clerkUserId, userId),
            with: {
                availabilities: true
            }
        }) 

        return schedule as FullSchedule | undefined
    } catch (error) {
        console.error(error)
        throw new Error("Error while fetching error")
    }
    
}