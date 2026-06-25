import { z } from "zod";

export const roleSchema = z.enum(["BUYER", "SELLER"]);

export const enterAsSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email"),
  role: roleSchema,
});

export const createHotelSchema = z.object({
  name: z.string().trim().min(3, "Name is too short").max(120),
  city: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
  description: z.string().trim().min(20, "Add at least a short description").max(2000),
  pricePerNight: z.coerce.number().int().positive("Price must be greater than 0"),
  currency: z.string().trim().default("INR"),
  imageUrl: z
    .string()
    .trim()
    .refine(
      (v) => v.startsWith("/uploads/") || /^https?:\/\/.+/.test(v),
      "Enter a valid image URL or upload a file"
    ),
  amenities: z.string().trim().default(""),
  roomsTotal: z.coerce.number().int().positive().default(1),
});

export const createBookingSchema = z
  .object({
    hotelId: z.string().min(1),
    guestName: z.string().trim().min(2, "Enter the guest name").max(80),
    email: z.string().trim().email("Enter a valid email"),
    checkIn: z.string().min(1, "Choose a check-in date"),
    checkOut: z.string().min(1, "Choose a check-out date"),
    guests: z.coerce.number().int().min(1).max(20),
  })
  .refine((d) => new Date(d.checkOut) > new Date(d.checkIn), {
    message: "Check-out must be after check-in",
    path: ["checkOut"],
  });

export function nightsBetween(checkIn: string | Date, checkOut: string | Date) {
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

export function formatMoney(amount: number, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function amenitiesToList(amenities: string): string[] {
  return amenities
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
}
