/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { db } from '@/drizzle/db';
import { EventTable } from '@/drizzle/schema';
import { eventFormSchema } from '@/schema/event';
import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod'


type EventRow = typeof EventTable.$inferSelect

export async function createEvent(
    unsafeData: z.infer<typeof eventFormSchema>
): Promise<void> {
    try {

        const { userId } = await auth()

        const { success, data } = eventFormSchema.safeParse(unsafeData);

        if (!success || !userId) {
            throw new Error("Invalid event data or user not authenticated!")
        }


        await db.insert(EventTable).values({ ...data, clerkUserId: userId });
        revalidatePath("/events")
        // redirect("/events")
        
    } catch (error: any) {
        console.log(error)
        throw new Error(`Failed to create event: ${error.message || error}`)
    }
}


export async function updateEvent(
    id: string,
    unsafeData: z.infer<typeof eventFormSchema>
): Promise<void> {
    try {
        const { userId } = await auth();
        const { success, data } = eventFormSchema.safeParse(unsafeData);
        if (!success || !data) {
           throw new Error("Invalid event data or user not authenticated!")
        }
        const { rowCount } = await db.update(EventTable).set({ ...data }).where(
            and(
                eq(EventTable.clerkUserId, userId!),
                eq(EventTable.id, id)
            )
        )

        if (rowCount === 0) {
            throw new Error("Event not found or user not authorized to update the event!")
        }
    } catch (error: any) {
        throw new Error(`Failed to update event: ${error.message || error}`)
    } finally {
        revalidatePath("/events")
        redirect("/events")
    }
}

export async function deleteEvent(id: string): Promise<void>{
    try {
        const { userId } = await auth();
        if (!userId) {
            throw new Error(`User is unauthorized to delete the event`)
        }

        const { rowCount } = await db.delete(EventTable).where(
            and(
                eq(EventTable.id, id),
                eq(EventTable.clerkUserId, userId)
            )
        )

        if (rowCount == 0) {
            throw new Error("Event does not exist");
        }
         revalidatePath("/events");
    } catch (error: any) {
      throw new Error("Error while deleting events:", error)  
    } 
}

export async function getEvents(id: string):Promise<EventRow[]> {
    try {
        const events = await db.query.EventTable.findMany({
            where: ({ clerkUserId: userIdCol }, { eq }) => eq(userIdCol, id),
            orderBy: ({name}, {asc, sql}) => asc(sql`lower(${name})`)
        })

        return events;
    } catch (error) {
        throw new Error("Error while fetching all events!")   
    }
}

export async function getActiveEvents(id: string):Promise<EventRow[]> {
    try {
         const events = await db.query.EventTable.findMany({
            where: ({ clerkUserId: userIdCol }, { eq }) => eq(userIdCol, id),
            orderBy: ({name}, {asc, sql}) => asc(sql`lower(${name})`)
        })

        return events;
        
    } catch (error) {
         throw new Error("Error while fetching active events!") 
    }
}

export async function getInactiveEvents(id: string):Promise<EventRow[]> {
    try {
         const events = await db.query.EventTable.findMany({
            where: ({ clerkUserId: userIdCol }, { eq }) => eq(userIdCol, id),
            orderBy: ({name}, {asc, sql}) => asc(sql`lower(${name})`)
        })

        return events;
        
    } catch (error) {
        console.error(error)
        throw new Error("Error while fetching active events!") 
    }
}

export async function getEvent(userId: string, eventId: string): Promise<EventRow | undefined> {
    try {
        const event = await db.query.EventTable.findFirst({
            where: ({id, clerkUserId}, {eq, and})=> and(eq(id, eventId), eq(clerkUserId, userId))
        })

        return event ?? undefined

    } catch (error) {
        console.log(error);
        throw new Error("Error while updating event")
    }
}