import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});

export const roomCategorySchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  totalRooms: z.coerce.number().int().positive("Must be at least 1"),
  pricePerNight: z.coerce.number().int().positive("Price must be greater than 0"),
  description: z.string().trim().max(500).default(""),
  photos: z.string().trim().default(""),
});

export const createHotelSchema = z
  .object({
    name: z.string().trim().min(3, "Name is too short").max(120),
    city: z.string().trim().min(2).max(80),
    country: z.string().trim().min(2).max(80),
    description: z.string().trim().min(20, "Add at least a short description").max(2000),
    pricePerNight: z.coerce.number().int().positive("Price must be greater than 0"),
    currency: z.string().trim().default("INR"),
    images: z
      .string()
      .trim()
      .min(1, "Add at least one photo")
      .refine(
        (v) =>
          v
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .every((u) => /^https?:\/\//.test(u)),
        "Enter valid photo URLs"
      ),
    amenities: z.string().trim().default(""),
    roomsTotal: z.coerce.number().int().positive().default(1),

    contactEmail: z.string().trim().email("Enter a valid contact email"),
    contactPhone: z
      .string()
      .trim()
      .min(7, "Enter a valid contact number")
      .max(20)
      .regex(/^[0-9+\-\s()]+$/, "Enter a valid contact number"),

    bankAccountHolder: z.string().trim().min(2, "Enter the account holder name").max(120),
    bankAccountNumber: z.string().trim().min(6, "Enter a valid account number").max(34),
    bankIfsc: z.string().trim().min(4, "Enter a valid bank code").max(20),
    bankName: z.string().trim().min(2, "Enter the bank name").max(120),

    latitude: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : v),
      z.coerce.number().min(-90).max(90).optional()
    ),
    longitude: z.preprocess(
      (v) => (v === "" || v === undefined || v === null ? undefined : v),
      z.coerce.number().min(-180).max(180).optional()
    ),

    mealPlans: z.string().trim().default(""),

    roomCategories: z.array(roomCategorySchema).max(20).default([]),
  })
  .refine((d) => (d.latitude === undefined) === (d.longitude === undefined), {
    message: "Provide both latitude and longitude, or leave both blank",
    path: ["longitude"],
  });

export const createBookingSchema = z
  .object({
    hotelId: z.string().min(1),
    guestName: z.string().trim().min(2, "Enter the guest name").max(80),
    email: z.string().trim().email("Enter a valid email"),
    checkIn: z.string().min(1, "Choose a check-in date"),
    checkOut: z.string().min(1, "Choose a check-out date"),
    guests: z.coerce.number().int().min(1).max(20),
    mealPlan: z.string().trim().min(1, "Choose a meal plan").default("Room Only"),
    roomCategoryId: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : undefined)),
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

export function toList(value: string): string[] {
  return value
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
}

export const amenitiesToList = toList;

export const DEFAULT_MEAL_PLANS = ["Room Only", "Breakfast Included", "Half Board", "Full Board"];

export function mealPlansToList(mealPlans: string): string[] {
  const list = toList(mealPlans);
  return list.length > 0 ? list : ["Room Only"];
}
