import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});

export const rateOverrideEntrySchema = z.object({
  roomCategoryId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  rate: z.number().int().positive().nullable(),
  availableRooms: z.number().int().min(0).nullable(),
  closed: z.boolean(),
  minStay: z.number().int().positive().nullable(),
  maxStay: z.number().int().positive().nullable(),
});

export const upsertRateOverridesSchema = z.object({
  entries: z.array(rateOverrideEntrySchema).min(1).max(500),
});

export const updateRoomCategoryBaseSchema = z
  .object({
    pricePerNight: z.coerce.number().int().positive("Price must be greater than 0").optional(),
    totalRooms: z.coerce.number().int().positive("Must be at least 1").optional(),
  })
  .refine((d) => d.pricePerNight !== undefined || d.totalRooms !== undefined, {
    message: "Provide at least one field to update",
  });

export const roomCategorySchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  totalRooms: z.coerce.number().int().positive("Must be at least 1"),
  pricePerNight: z.coerce.number().int().positive("Price must be greater than 0"),
  description: z.string().trim().max(500).default(""),
  amenities: z.string().trim().default(""),
  mealPlans: z.string().trim().default(""),
  photos: z.string().trim().default(""),
});

export const createHotelSchema = z
  .object({
    name: z.string().trim().min(3, "Name is too short").max(120),
    city: z.string().trim().min(2).max(80),
    country: z.string().trim().min(2).max(80),
    description: z.string().trim().min(20, "Add at least a short description").max(2000),
    coverImage: z.string().trim().url("Add a cover photo"),

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

    roomCategories: z.array(roomCategorySchema).min(1, "Add at least one room category").max(20),
  })
  .refine((d) => (d.latitude === undefined) === (d.longitude === undefined), {
    message: "Provide both latitude and longitude, or leave both blank",
    path: ["longitude"],
  });

export const managerEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

export const adminCreateUserSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().email("Enter a valid email"),
  role: z.enum(["BUYER", "SELLER", "ADMIN"]),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["BUYER", "SELLER", "ADMIN"]),
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
    roomCategoryId: z.string().trim().min(1, "Select a room category"),
  })
  .refine((d) => new Date(d.checkOut) > new Date(d.checkIn), {
    message: "Check-out must be after check-in",
    path: ["checkOut"],
  });

export const itineraryDaySchema = z.object({
  dayNumber: z.coerce.number().int().positive(),
  title: z.string().trim().min(2, "Title is too short").max(120),
  description: z.string().trim().max(1000).default(""),
});

export const createTourPackageSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(120),
  destination: z.string().trim().min(2, "Add a destination").max(120),
  description: z.string().trim().min(20, "Add at least a short description").max(2000),
  durationDays: z.coerce.number().int().positive("Must be at least 1"),
  durationNights: z.coerce.number().int().min(0),
  pricePerPerson: z.coerce.number().int().positive("Price must be greater than 0"),
  coverImage: z.string().trim().url("Add a cover photo"),
  photos: z.string().trim().default(""),
  inclusions: z.string().trim().default(""),
  exclusions: z.string().trim().default(""),
  highlights: z.string().trim().default(""),

  hostedBy: z.string().trim().min(2, "Enter who's hosting this trip").max(120),

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

  itinerary: z.array(itineraryDaySchema).min(1, "Add at least one itinerary day").max(30),
});

export const createPackageBookingSchema = z.object({
  packageId: z.string().min(1),
  guestName: z.string().trim().min(2, "Enter the guest name").max(80),
  email: z.string().trim().email("Enter a valid email"),
  travelDate: z.string().min(1, "Choose a travel date"),
  travelers: z.coerce.number().int().min(1).max(20),
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

export const MEAL_PLAN_OPTIONS = [
  "Breakfast Included",
  "Lunch Included",
  "Dinner Included",
  "Half Board",
  "Full Board",
  "Room Only",
];

export function mealPlansToList(mealPlans: string): string[] {
  const list = toList(mealPlans);
  return list.length > 0 ? list : ["Room Only"];
}
