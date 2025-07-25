import EventForm from '@/components/forms/EventForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getEvent } from '@/server/actions/events'
import { auth } from '@clerk/nextjs/server'
import React from 'react'

const EditEventPage = async ({
    params
}: {
    params: Promise<{eventId: string}>
    }) => {
    const { userId, redirectToSignIn } = await auth()
    const { eventId } = await params;

    if (!userId) return redirectToSignIn();

    const event = await getEvent(userId!, eventId)

    if (!event) {
        return <h1>Event not found!</h1>
    }

  return (
     <Card className="max-w-md mx-auto border-4 border-blue-100 shadow-2xl shadow-accent-foreground">
      <CardHeader>
        <CardTitle>Edit Event</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Render the EventForm with the event details, passing the event data as props */}
        <EventForm
          event={{ ...event, description: event.description || undefined }} // If description is null, pass undefined
        />
      </CardContent>
    </Card>
  )
}

export default EditEventPage