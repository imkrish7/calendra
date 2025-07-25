import { ScheduleForm } from '@/components/forms/ScheduleForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSchdules } from '@/server/actions/schedules';
import { auth } from '@clerk/nextjs/server'
import React from 'react'

const SchedulePage = async () => {
    const { userId, redirectToSignIn } = await auth()

    if (!userId) return redirectToSignIn();

    const scheduls = await getSchdules(userId)


  return (<Card className="max-w-md mx-auto border-8 border-blue-200 shadow-2xl shadow-accent-foreground">
                <CardHeader>
                    <CardTitle>Schedule</CardTitle> {/* Display title for the page */}
                </CardHeader>
                <CardContent>
                    <ScheduleForm schedule={schedule} /> 
                    {/* Render the ScheduleForm component with the fetched schedule */}
                </CardContent>
            </Card>)
}

export default SchedulePage