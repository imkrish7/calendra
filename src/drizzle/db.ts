import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema"

console.log("DATAVASE",process.env.DATABASE_URL!)

const sql = neon(process.env.DATABASE_URL!)

export const db = drizzle(sql, {schema})