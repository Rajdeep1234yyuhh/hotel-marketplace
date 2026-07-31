import { randomUUID } from "crypto";
import type { DocumentSnapshot, Query, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { firestore } from "@/lib/firebase-admin";

/**
 * Firestore-backed data store. Every function here mirrors what the
 * original Prisma/JSON-file calls used to do, so call sites only ever deal
 * with plain typed objects — Firestore specifics stay in this file.
 */

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
  images: string;
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

const usersCol = () => firestore.collection("users");
const hotelsCol = () => firestore.collection("hotels");
const roomCategoriesCol = () => firestore.collection("roomCategories");
const bookingsCol = () => firestore.collection("bookings");

export function newId() {
  return randomUUID();
}

function nowIso() {
  return new Date().toISOString();
}

function fromDoc<T>(doc: QueryDocumentSnapshot | DocumentSnapshot): T {
  return { id: doc.id, ...(doc.data() as object) } as T;
}

async function deleteAll(query: Query) {
  const snap = await query.get();
  for (let i = 0; i < snap.docs.length; i += 450) {
    const batch = firestore.batch();
    snap.docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

export async function resetDb() {
  await Promise.all([
    deleteAll(bookingsCol()),
    deleteAll(roomCategoriesCol()),
    deleteAll(hotelsCol()),
    deleteAll(usersCol()),
  ]);
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function findUserById(id: string): Promise<User | null> {
  const doc = await usersCol().doc(id).get();
  return doc.exists ? fromDoc<User>(doc) : null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const snap = await usersCol().where("email", "==", email).limit(1).get();
  return snap.empty ? null : fromDoc<User>(snap.docs[0]);
}

export async function listUsers(): Promise<User[]> {
  const snap = await usersCol().orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => fromDoc<User>(d));
}

export async function upsertUserByEmail(input: {
  name: string;
  email: string;
  role: Role;
}): Promise<User> {
  const existing = await usersCol().where("email", "==", input.email).limit(1).get();
  if (!existing.empty) {
    const ref = existing.docs[0].ref;
    await ref.update({ name: input.name, role: input.role });
    return { ...fromDoc<User>(existing.docs[0]), name: input.name, role: input.role };
  }
  const id = newId();
  const data = { name: input.name, email: input.email, role: input.role, createdAt: nowIso() };
  await usersCol().doc(id).set(data);
  return { id, ...data };
}

export async function updateUserRole(id: string, role: Role): Promise<User> {
  const ref = usersCol().doc(id);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("User not found");
  await ref.update({ role });
  return { ...fromDoc<User>(doc), role };
}

export async function createUser(input: { name: string; email: string; role: Role }): Promise<User> {
  const id = newId();
  const data = { ...input, createdAt: nowIso() };
  await usersCol().doc(id).set(data);
  return { id, ...data };
}

// ---------------------------------------------------------------------------
// Room categories
// ---------------------------------------------------------------------------

export async function findRoomCategoryById(id: string): Promise<RoomCategory | null> {
  const doc = await roomCategoriesCol().doc(id).get();
  return doc.exists ? fromDoc<RoomCategory>(doc) : null;
}

export async function roomCategoriesForHotel(hotelId: string): Promise<RoomCategory[]> {
  const snap = await roomCategoriesCol().where("hotelId", "==", hotelId).get();
  return snap.docs
    .map((d) => fromDoc<RoomCategory>(d))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// ---------------------------------------------------------------------------
// Hotels
// ---------------------------------------------------------------------------

export async function findHotelById(id: string): Promise<Hotel | null> {
  const doc = await hotelsCol().doc(id).get();
  return doc.exists ? fromDoc<Hotel>(doc) : null;
}

export async function listHotels(where?: {
  ownerId?: string;
  published?: boolean;
  q?: string;
}): Promise<Hotel[]> {
  let query: Query = hotelsCol();
  if (where?.ownerId) query = query.where("ownerId", "==", where.ownerId);
  if (where?.published !== undefined) query = query.where("published", "==", where.published);

  const snap = await query.get();
  let results = snap.docs
    .map((d) => fromDoc<Hotel>(d))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (where?.q) {
    const q = where.q.toLowerCase();
    results = results.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.country.toLowerCase().includes(q)
    );
  }
  return results;
}

export async function createHotel(
  input: Omit<Hotel, "id" | "createdAt" | "updatedAt">,
  roomCategoryInputs: Omit<RoomCategory, "id" | "hotelId" | "createdAt">[] = []
): Promise<Hotel & { roomCategories: RoomCategory[] }> {
  const id = newId();
  const now = nowIso();
  const hotelData = { ...input, createdAt: now, updatedAt: now };
  await hotelsCol().doc(id).set(hotelData);

  const categories: RoomCategory[] = [];
  if (roomCategoryInputs.length > 0) {
    const batch = firestore.batch();
    for (const c of roomCategoryInputs) {
      const categoryId = newId();
      const categoryData = { ...c, hotelId: id, createdAt: nowIso() };
      batch.set(roomCategoriesCol().doc(categoryId), categoryData);
      categories.push({ id: categoryId, ...categoryData });
    }
    await batch.commit();
  }

  return { id, ...hotelData, roomCategories: categories };
}

export async function updateHotelPublished(id: string, published: boolean): Promise<Hotel | null> {
  const ref = hotelsCol().doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const updatedAt = nowIso();
  await ref.update({ published, updatedAt });
  return { ...fromDoc<Hotel>(doc), published, updatedAt };
}

export async function deleteHotel(id: string): Promise<boolean> {
  const ref = hotelsCol().doc(id);
  const doc = await ref.get();
  if (!doc.exists) return false;
  await Promise.all([
    deleteAll(roomCategoriesCol().where("hotelId", "==", id)),
    deleteAll(bookingsCol().where("hotelId", "==", id)),
  ]);
  await ref.delete();
  return true;
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export async function createBooking(
  input: Omit<Booking, "id" | "createdAt" | "status">
): Promise<Booking> {
  const id = newId();
  const data = { ...input, status: "CONFIRMED", createdAt: nowIso() };
  await bookingsCol().doc(id).set(data);
  return { id, ...data };
}

export async function countBookings(where?: { hotelId?: string }): Promise<number> {
  let query: Query = bookingsCol();
  if (where?.hotelId) query = query.where("hotelId", "==", where.hotelId);
  const snap = await query.count().get();
  return snap.data().count;
}

/** Map of hotelId -> booking count, computed in one pass for dashboard listings. */
export async function bookingCountsByHotel(): Promise<Record<string, number>> {
  const snap = await bookingsCol().get();
  const counts: Record<string, number> = {};
  for (const doc of snap.docs) {
    const hotelId = (doc.data() as Booking).hotelId;
    counts[hotelId] = (counts[hotelId] ?? 0) + 1;
  }
  return counts;
}
