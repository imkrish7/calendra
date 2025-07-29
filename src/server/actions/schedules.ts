"use server"

import { db } from "@/drizzle/db"
import { scheduleAvailabilityTable, ScheduleTable } from "@/drizzle/schema"
import { scheduleFormSchema } from "@/schema/schedule"
import { auth } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { BatchItem } from "drizzle-orm/batch"
import { revalidatePath } from "next/cache"
import { z} from 'zod'
import { getCalendarEventTimes } from "../google/googleCalender"
import { addMilliseconds, addMinutes, areIntervalsOverlapping, isFriday, isMonday, isSaturday, isSunday, isThursday, isTuesday, isWednesday, isWithinInterval, setHours, setMinutes } from "date-fns"
import {fromZonedTime} from "date-fns-tz"
import { DAYS_OF_WEEK_IN_ORDER } from "@/constants"


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

export async function saveSchedule(
    unsafeData: z.infer<typeof scheduleFormSchema>
) {
    try {
        const { userId } = await auth()

        const { success, data } = scheduleFormSchema.safeParse(unsafeData)

        if (!success || !userId) {
            throw new Error("Error: user is not authorized to create schedule!")
        }

        const { availabilities, ...schedule } = data;

        const [{ id: scheduleId }] = await db.insert(ScheduleTable)
            .values({ ...schedule, clerkUserId: userId })
            .onConflictDoUpdate({
                target: ScheduleTable.clerkUserId,
                set: schedule
            }).returning({ id: ScheduleTable.id })
        
        
        const statements: [BatchItem<"pg">] = [
            db.delete(scheduleAvailabilityTable).where(eq(scheduleAvailabilityTable.scheduleId, scheduleId))
        ]

        if (availabilities.length > 0) {
            statements.push(
                db.insert(scheduleAvailabilityTable).values(
                    availabilities.map(availability => ({
                        ...availability,
                        scheduleId
                    }))
                )
            )
        }

        await db.batch(statements);
        
        
    } catch (error) {
        console.error(error)
        throw new Error("Error while saving a schedule")
    } finally {
        revalidatePath("/schedule")
    }
}

export async function getValidDateFromSchedule(
    timesInOrder: Date[],
    event: { clerkUserId: string, durationInMinutes: number } | undefined,
    
): Promise<Date[]>{
    if (!event) {
        throw new Error("Error: no event exist")
    }
    const { clerkUserId: userId, durationInMinutes } = event;

    const start = timesInOrder[0]
    const end = timesInOrder.at(-1);

    if (!start || !end) return []
    
    const schedule = await getSchdules(userId)

    if (!schedule) return []
    
    const groupByAvailabilities = Object.groupBy(
        schedule.availabilities,
        a=> a.dayOfWeek
    )

    const eventTimes = await getCalendarEventTimes(userId, {
        start,
        end
    })

    return timesInOrder.filter(intervalDate => {
        const availabilities = getAvailabilities(
            groupByAvailabilities,
            intervalDate,
            schedule.timezone
        )

        const interval = {
            start: intervalDate,
            end: addMinutes(intervalDate, durationInMinutes)
        }

        return (
            eventTimes.every(eventTime => {
                return !areIntervalsOverlapping(eventTime, interval)
            }) && availabilities.some(availability => {
                return isWithinInterval(interval.start, availability) &&
                isWithinInterval(interval.end, availability)
            })
        )
    })
}


function getAvailabilities(
  groupedAvailabilities: Partial<
    Record<
      (typeof DAYS_OF_WEEK_IN_ORDER)[number],
      (typeof scheduleAvailabilityTable.$inferSelect)[]
    >
  >,
  date: Date,
  timezone: string
): { start: Date; end: Date }[] {
  // Determine the day of the week based on the given date
  const dayOfWeek = (() => {
    if (isMonday(date)) return "monday"
    if (isTuesday(date)) return "tuesday"
    if (isWednesday(date)) return "wednesday"
    if (isThursday(date)) return "thursday"
    if (isFriday(date)) return "friday"
    if (isSaturday(date)) return "saturday"
    if (isSunday(date)) return "sunday"
    return null // If the date doesn't match any day (highly unlikely), return null
  })()

  // If day of the week is not determined, return an empty array
  if (!dayOfWeek) return []

  // Get the availabilities for the determined day
  const dayAvailabilities = groupedAvailabilities[dayOfWeek]

  // If there are no availabilities for that day, return an empty array
  if (!dayAvailabilities) return []

  // Map each availability time range to a { start: Date, end: Date } object adjusted to the user's timezone
  return dayAvailabilities.map(({ startTime, endTime }) => {
    // Parse startTime (e.g., "09:30") into hours and minutes
    const [startHour, startMinute] = startTime.split(":").map(Number)
    // Parse endTime (e.g., "17:00") into hours and minutes
    const [endHour, endMinute] = endTime.split(":").map(Number)

    // Create a start Date object set to the correct hour and minute, then convert it to the given timezone
    const start = fromZonedTime(
      setMinutes(setHours(date, startHour), startMinute),
      timezone
    )

    // Create an end Date object set to the correct hour and minute, then convert it to the given timezone
    const end = fromZonedTime(
      setMinutes(setHours(date, endHour), endMinute),
      timezone
    )

    // Return the availability interval
    return { start, end }
  })
}

