"use server"

import { clerkClient } from "@clerk/nextjs/server";
import { addMinutes, endOfDay, startOfDay } from "date-fns";
import { calendar_v3, google } from "googleapis"

export async function getOAuthClient(clerkUserId: string) {
    try {
        const client = await clerkClient();

        const { data } = await client.users.getUserOauthAccessToken(clerkUserId, "google")

        if (data.length == 0 || !data[0].token) {
            throw new Error("No OAuth data or taken found for the user.")
        }

        const oAuthClient = new google.auth.OAuth2(
            process.env.GOOGLE_OAUTH_CLIENT_ID,
            process.env.GOOGLE_OATUTH_CLIENT_SECRET,
            process.env.GOOGLE_OAUTH_REDIRECT_URL
        )

        oAuthClient.setCredentials({ access_token: data[0].token });

        return oAuthClient;
        
    } catch (error) {
        console.info(error);
        throw error;
    }
}

export async function getCalendarEventTimes(
    clerkUserId: string,
    {start, end}: {start: Date, end: Date}
): Promise<{ start: Date, end: Date }[]>{
    try {

        const client = await getOAuthClient(clerkUserId);
        if (!client) {
            throw new Error("Error: while fetching google client")
        }

        const events = await google.calendar("v3").events.list({
            calendarId: "primary",
            eventTypes: ["default"],
            singleEvents: true,
            timeMin: start.toISOString(),
            timeMax: start.toISOString(),
            maxResults: 2500,
            auth: client
        })
        return events.data.items?.map(event => {
            if (event.start?.date && event.end?.date) {
                return {
                    start: startOfDay(new Date(event.start.date)),
                    end: endOfDay(new Date(event.end.date))
                }
            }

            if (event.start?.dateTime && event.end?.dateTime) {
                return {
                    start: new Date(event.start.dateTime),
                    end: new Date(event.end.dateTime)
                }
            }
            return undefined
        }).filter((date): date is {start: Date, end: Date}=> date != undefined) || []
    } catch (error) {
        console.error("Error: getCalendarEventTimes:", error);
        throw new Error("Error while fetching calender event times")
    }
}


export async function createCalendarEvent({
    clerkUserId,
    guestName,
    guestEmail,
    startTime,
    guestNotes,
    durationInMinutes,
    eventName,
  }: {
    clerkUserId: string // The unique ID of the Clerk user.
    guestName: string // The name of the guest attending the event.
    guestEmail: string // The email address of the guest.
    startTime: Date // The start time of the event.
    guestNotes?: string | null // Optional notes for the guest (can be null or undefined).
    durationInMinutes: number // The duration of the event in minutes.
    eventName: string // The name or title of the event.
    }): Promise<calendar_v3.Schema$Event> {
    
    try {

        const client = await getOAuthClient(clerkUserId)

        if (!client) {
            throw new Error("Error: unable to verify OaUth client")
        }

        const cClient = await clerkClient();
        const calendarUser = await cClient.users.getUser(clerkUserId)

        const primaryEmail = calendarUser.emailAddresses.find(
            ({id})=> id === calendarUser.primaryEmailAddressId
        )

        if (!primaryEmail) {
            throw new Error("Error: primary does not match!")
        }
        const calendarEvent = await google.calendar("v3").events.insert({
            calendarId: "primary",
            auth: client,
            sendUpdates: "all",
            requestBody: {
                attendees: [
                    { email: guestEmail, displayName: guestName },
                    {
                        email: primaryEmail.emailAddress,
                        displayName: `${calendarUser.firstName} ${calendarUser.lastName}`,
                        responseStatus: "accepted"
                    }
                ],

                description: guestNotes ? `Additional Details: ${guestNotes}` : "No additional details",
                start: {
                    dateTime: startTime.toISOString()
                },
                end: {
                    dateTime: addMinutes(startTime, durationInMinutes).toISOString()
                },
                summary: `${guestName} + ${calendarUser.firstName} ${calendarUser.lastName}: ${eventName}`
            }
        })

        return calendarEvent.data;
        
    } catch (error) {
        console.error("Error: creating google calender event")
        throw error;
    }
    
}