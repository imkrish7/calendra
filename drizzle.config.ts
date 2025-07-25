import { defineConfig } from "drizzle-kit"

const databaseURL = process.env.DATABASE_URL;

if (!databaseURL) {
    throw new Error("Database url is not defined");
}

export default defineConfig({
    schema: "./src/drizzle/schema.ts",
    out: "./src/drizzle/migrations",
    dialect: "postgresql",
    strict: true,
    verbose: true,
    dbCredentials: {
        url: databaseURL,
    }
})