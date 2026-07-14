import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Derive up to two uppercase initials from the first non-empty source.
 * e.g. getInitials(name, email, "Admin User")
 */
export function getInitials(...sources: Array<string | null | undefined>): string {
  const source = sources.map((value) => value?.trim()).find(Boolean) ?? ""
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}
