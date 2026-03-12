import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function generateHexKey(length = 32): string {
  const chars = "0123456789abcdef";
  let key = "";
  for (let i = 0; i < length; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key.match(/.{4}/g)!.join("-");
}

export function calculatePSNR(mse: number, bitDepth = 16): number {
  return 10 * Math.log10(Math.pow(Math.pow(2, bitDepth) - 1, 2) / mse);
}

export function formatTimestamp(date: Date): string {
  return date.toISOString().replace("T", " ").substring(0, 19);
}
