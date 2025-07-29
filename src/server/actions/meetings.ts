"use server"
import { db } from "@/drizzle/db";
import { meetingActionSchema } from "@/schema/meeting";
import { fromZonedTime } from "date-fns-tz";
import { z } from "zod"
import { getValidDateFromSchedule } from "./schedules";
import { createCalendarEvent } from "../google/googleCalender";

export async function createMeeting(
    usnsafeData: z.infer<typeof meetingActionSchema>
) {
   
    try {

        const { success, data } = meetingActionSchema.safeParse(usnsafeData);

        if (!success) {
            throw new Error("Invalid data!")
        }
        const event = await db.query.EventTable.findFirst({
            where: ({ clerkUserId, isActive, id }, { eq, and }) => and(
                eq(clerkUserId, data.clerkUserId),
                eq(isActive, true),
                eq(id, data.eventId)
            )
        })

        if (!event) {
            throw new Error("Event not found!")
        }

        const startInTimezone = fromZonedTime(data.startTime, data.timezone);

        const validTimes = await getValidDateFromSchedule([startInTimezone], event);

        if (validTimes.length === 0) {
            throw new Error("Selected time is not valid")
        }

        await createCalendarEvent({
            ...data,
            startTime: startInTimezone,
            durationInMinutes: event.durationInMinutes,
            eventName: event.name
        })

        return {clerkUserId: data.clerkUserId, eventId: data.eventId, startTime: data.startTime}
        
    } catch (error) {

        console.error("Error: creat meeting", error)
        throw error;
        
    }
}