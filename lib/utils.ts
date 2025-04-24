import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names with Tailwind's merge function
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a Sui address for display
 */
export function formatAddress(address: string | undefined, prefixLength = 6, suffixLength = 4): string {
  if (!address) return "";
  if (address.length <= prefixLength + suffixLength) return address;
  
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

/**
 * Formats a number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

/**
 * Formats a number to a specific number of decimal places
 */
export function formatDecimal(num: number, decimalPlaces = 2): string {
  return num.toFixed(decimalPlaces);
}

/**
 * Converts MIST to SUI (1 SUI = 10^9 MIST)
 */
export function mistToSui(mist: bigint): number {
  return Number(mist) / 1_000_000_000;
}

/**
 * Converts SUI to MIST
 */
export function suiToMist(sui: number): bigint {
  return BigInt(Math.floor(sui * 1_000_000_000));
}

/**
 * Sleep function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Truncates text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function groupBy<T>(array: T[], groupSize: number): T[][] {
  if (groupSize <= 0) {
    throw new Error("groupSize must be a positive number.");
  }

  const result: T[][] = [];
  for (let i = 0; i < array.length; i += groupSize) {
    result.push(array.slice(i, i + groupSize));
  }
  return result;
}
