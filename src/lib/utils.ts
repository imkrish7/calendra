import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeToFloat(time: string): number {
  // Split the time string by ":" into [hours, minutes] and convert both to numbers
  const [hours, minutes] = time.split(":").map(Number)
  // Note: .map(Number) is a shorthand way to convert an array of strings to numbers.

  // Convert minutes into a fraction of an hour and add it to the hour
  return hours + minutes / 60
}