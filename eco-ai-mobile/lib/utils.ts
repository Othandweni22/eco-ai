/**
 * Identical to the original lib/utils.ts - works fine on RN.
 * `cn()` is used for conditionally merging className strings; with NativeWind
 * this is the same idiom as on web.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
