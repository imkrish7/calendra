import { DAYS_OF_WEEK_IN_ORDER } from "@/constants";
import { relations } from "drizzle-orm";
import { pgTable, text, uuid, integer, boolean, timestamp, index, pgEnum } from "drizzle-orm/pg-core";

const createdAt= timestamp("createdAt").notNull().defaultNow()
const updatedAt = timestamp("updatedAt").notNull().defaultNow().$onUpdate(()=> new Date())


export const scheduleDayOfWeek = pgEnum("day", DAYS_OF_WEEK_IN_ORDER)

export const EventTable = pgTable(
    "events",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: text("name").notNull(),
        description: text("description"),
        durationInMinutes: integer("durationInMinutes").notNull(),
        clerkUserId: text("clerkUserId").notNull(),
        isActive: boolean("isActive").notNull(),
        createdAt,
        updatedAt
    },
    table => ([
        index("clerkUserId").on(table.clerkUserId),
        
    ])
)


export const ScheduleTable = pgTable(
    "schedules",
    {
        id: uuid("id").primaryKey().notNull().defaultRandom(),
        timezone: text("timezone").notNull(),
        clerkUserId: text("clerkUserId").notNull().unique(),
        updatedAt,
        createdAt
    }
)


export const scheduleAvailabilityTable = pgTable(
    "schedulAvailablities",
    {
        id: uuid("id").notNull().defaultRandom(),
        scheduleId: uuid("schduleId").notNull().references(() => ScheduleTable.id, { onDelete: "cascade" }),
        startTime: text("starttime").notNull(),
        endTime: text("endTime").notNull(),
        dayOfWeek: scheduleDayOfWeek("dayOfWeek").notNull(),
        createdAt,
        updatedAt
    },
    table => ([
        index("scheduleIndex").on(table.scheduleId),
    ])
)

export const scheduleRelations = relations(ScheduleTable, ({ many }) => {
    return {
        availabilities: many(scheduleAvailabilityTable)
    }
})

export const scheduleAvailabilityRelation = relations(scheduleAvailabilityTable, ({ one }) => {
    return {
        schedule: one(ScheduleTable, {
            fields: [scheduleAvailabilityTable.scheduleId],
            references: [ScheduleTable.id]
        })
    }
})