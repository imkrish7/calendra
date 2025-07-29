import MeetingForm from "@/components/forms/MeetingForm";
import NoTimeSlots from "@/components/NoTimeSlots";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getEvent } from "@/server/actions/events";
import { getValidDateFromSchedule } from "@/server/actions/schedules";
import { clerkClient } from "@clerk/nextjs/server";
import { addYears, eachMinuteOfInterval, endOfDay, roundToNearestMinutes } from "date-fns";
import { AlertTriangle } from "lucide-react";

export default async function BookingPage({
    params,
}: { params: Promise<{ clerkUserId: string, eventId: string }> }) {
    
    const { clerkUserId, eventId } = await params;

    const event = await getEvent(clerkUserId, eventId);

    const client = await clerkClient()
    const calendarUser = await client.users.getUser(clerkUserId)

    if (!event) {
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md
        flex items-center gap-2 text-sm max-w-md mx-auto mt-6">
            <AlertTriangle className="w-5 h-5" />
            <span>This event doesn&apos;t exist anymore</span>
        </div>
    }

    const startDate = roundToNearestMinutes(new Date(), {
        nearestTo: 15,
        roundingMethod: "ceil"
    })

    const endDate = endOfDay(addYears(startDate, 1));

    const validTimes = await getValidDateFromSchedule(
        eachMinuteOfInterval({ start: startDate, end: endDate }, { step: 15 }),
        event
    )

    if (validTimes.length === 0) {
        return <NoTimeSlots event={event!} calendarUser={calendarUser} />
    }

     return (
    <Card className="max-w-4xl mx-auto border-8 border-blue-200 shadow-2xl shadow-accent-foreground">
      <CardHeader>
        <CardTitle>
          Book {event!.name} with {calendarUser.fullName}
        </CardTitle>
        {event!.description && (
          <CardDescription>{event!.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <MeetingForm
          validTimes={validTimes}
          eventId={event!.id}
          clerkUserId={clerkUserId}
        />
      </CardContent>
    </Card>
  )   
}


