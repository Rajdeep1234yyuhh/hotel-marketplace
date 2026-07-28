import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

/**
 * File-backed data store. Stands in for a real database until Firebase is
 * wired up — every function here mirrors what the Prisma calls used to do,
 * so swapping the internals later only touches this file.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

export type Role = "BUYER" | "SELLER" | "ADMIN";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

export type RoomCategory = {
  id: string;
  hotelId: string;
  name: string;
  totalRooms: number;
  pricePerNight: number;
  description: string;
  photos: string;
  createdAt: string;
};

export type Hotel = {
  id: string;
  name: string;
  city: string;
  country: string;
  description: string;
  pricePerNight: number;
  currency: string;
  rating: number;
  imageUrl: string;
  amenities: string;
  roomsTotal: number;
  published: boolean;
  contactEmail: string;
  contactPhone: string;
  bankAccountHolder: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankName: string;
  latitude: number | null;
  longitude: number | null;
  mealPlans: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type Booking = {
  id: string;
  hotelId: string;
  guestId: string;
  guestName: string;
  email: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  total: number;
  status: string;
  mealPlan: string;
  roomCategoryId: string | null;
  createdAt: string;
};

type Data = {
  users: User[];
  hotels: Hotel[];
  roomCategories: RoomCategory[];
  bookings: Booking[];
};

function emptyData(): Data {
  return { users: [], hotels: [], roomCategories: [], bookings: [] };
}

function load(): Data {
  if (!fs.existsSync(DB_PATH)) return emptyData();
  const raw = fs.readFileSync(DB_PATH, "utf8");
  if (!raw.trim()) return emptyData();
  return JSON.parse(raw) as Data;
}

function save(data: Data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export function newId() {
  return randomUUID();
}

function nowIso() {
  return new Date().toISOString();
}

export function resetDb() {
  save(emptyData());
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export function findUserById(id: string): User | null {
  return load().users.find((u) => u.id === id) ?? null;
}

export function findUserByEmail(email: string): User | null {
  return load().users.find((u) => u.email === email) ?? null;
}

export function listUsers(): User[] {
  return [...load().users].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function upsertUserByEmail(input: { name: string; email: string; role: Role }): User {
  const data = load();
  const existing = data.users.find((u) => u.email === input.email);
  if (existing) {
    existing.name = input.name;
    existing.role = input.role;
    save(data);
    return existing;
  }
  const user: User = {
    id: newId(),
    name: input.name,
    email: input.email,
    role: input.role,
    createdAt: nowIso(),
  };
  data.users.push(user);
  save(data);
  return user;
}

export function updateUserRole(id: string, role: Role): User {
  const data = load();
  const user = data.users.find((u) => u.id === id);
  if (!user) throw new Error("User not found");
  user.role = role;
  save(data);
  return user;
}

export function createUser(input: { name: string; email: string; role: Role }): User {
  const data = load();
  const user: User = { id: newId(), createdAt: nowIso(), ...input };
  data.users.push(user);
  save(data);
  return user;
}

// ---------------------------------------------------------------------------
// Room categories
// ---------------------------------------------------------------------------

export function findRoomCategoryById(id: string): RoomCategory | null {
  return load().roomCategories.find((r) => r.id === id) ?? null;
}

export function roomCategoriesForHotel(hotelId: string): RoomCategory[] {
  return load()
    .roomCategories.filter((r) => r.hotelId === hotelId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// ---------------------------------------------------------------------------
// Hotels
// ---------------------------------------------------------------------------

export function findHotelById(id: string): Hotel | null {
  return load().hotels.find((h) => h.id === id) ?? null;
}

export function listHotels(where?: { ownerId?: string; published?: boolean; q?: string }): Hotel[] {
  let hotels = load().hotels;
  if (where?.ownerId) hotels = hotels.filter((h) => h.ownerId === where.ownerId);
  if (where?.published !== undefined) {
    hotels = hotels.filter((h) => h.published === where.published);
  }
  if (where?.q) {
    const q = where.q.toLowerCase();
    hotels = hotels.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.country.toLowerCase().includes(q)
    );
  }
  return [...hotels].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createHotel(
  input: Omit<Hotel, "id" | "createdAt" | "updatedAt">,
  roomCategoryInputs: Omit<RoomCategory, "id" | "hotelId" | "createdAt">[] = []
): Hotel & { roomCategories: RoomCategory[] } {
  const data = load();
  const now = nowIso();
  const hotel: Hotel = { ...input, id: newId(), createdAt: now, updatedAt: now };
  data.hotels.push(hotel);

  const categories = roomCategoryInputs.map((c) => ({
    ...c,
    id: newId(),
    hotelId: hotel.id,
    createdAt: nowIso(),
  }));
  data.roomCategories.push(...categories);

  save(data);
  return { ...hotel, roomCategories: categories };
}

export function updateHotelPublished(id: string, published: boolean): Hotel | null {
  const data = load();
  const hotel = data.hotels.find((h) => h.id === id);
  if (!hotel) return null;
  hotel.published = published;
  hotel.updatedAt = nowIso();
  save(data);
  return hotel;
}

export function deleteHotel(id: string): boolean {
  const data = load();
  const idx = data.hotels.findIndex((h) => h.id === id);
  if (idx === -1) return false;
  data.hotels.splice(idx, 1);
  data.roomCategories = data.roomCategories.filter((r) => r.hotelId !== id);
  data.bookings = data.bookings.filter((b) => b.hotelId !== id);
  save(data);
  return true;
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export function createBooking(input: Omit<Booking, "id" | "createdAt" | "status">): Booking {
  const data = load();
  const booking: Booking = { ...input, id: newId(), status: "CONFIRMED", createdAt: nowIso() };
  data.bookings.push(booking);
  save(data);
  return booking;
}

export function countBookings(where?: { hotelId?: string }): number {
  let bookings = load().bookings;
  if (where?.hotelId) bookings = bookings.filter((b) => b.hotelId === where.hotelId);
  return bookings.length;
}

/** Map of hotelId -> booking count, computed in one pass for dashboard listings. */
export function bookingCountsByHotel(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const b of load().bookings) {
    counts[b.hotelId] = (counts[b.hotelId] ?? 0) + 1;
  }
  return counts;
}
