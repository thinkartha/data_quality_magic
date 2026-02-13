import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string to a stable UTC-based short date (YYYY-MM-DD).
 * Avoids hydration mismatches caused by server/client timezone differences.
 */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Formats a date string to a stable UTC-based date+time (YYYY-MM-DD HH:mm:ss).
 * Avoids hydration mismatches caused by server/client timezone differences.
 */
export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  const hours = String(d.getUTCHours()).padStart(2, "0")
  const mins = String(d.getUTCMinutes()).padStart(2, "0")
  const secs = String(d.getUTCSeconds()).padStart(2, "0")
  return `${year}-${month}-${day} ${hours}:${mins}:${secs}`
}
