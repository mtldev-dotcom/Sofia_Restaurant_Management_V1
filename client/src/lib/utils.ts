import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Calculate the position after rotation
 */
export function rotatePoint(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  angle: number
): { x: number; y: number } {
  // Convert angle to radians
  const radians = (angle * Math.PI) / 180;
  
  // Translate point to origin
  const translatedX = x - centerX;
  const translatedY = y - centerY;
  
  // Apply rotation
  const rotatedX = translatedX * Math.cos(radians) - translatedY * Math.sin(radians);
  const rotatedY = translatedX * Math.sin(radians) + translatedY * Math.cos(radians);
  
  // Translate back
  return {
    x: rotatedX + centerX,
    y: rotatedY + centerY
  };
}

/**
 * Snap a value to the nearest grid line
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}
