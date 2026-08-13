import { NextResponse } from "next/server";

// Matches coordinates in the shapes Google Maps links actually use:
//   .../@12.9716,77.5946,15z          (map center after panning/zooming)
//   ...!3d12.9716!4d77.5946           (the pinned place itself, more precise
//                                      than @lat,lng when both are present)
//   ...?q=12.9716,77.5946
//   ...?ll=12.9716,77.5946
const COORD_PATTERNS = [
  /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
  /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
  /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
  /@(-?\d+\.\d+),(-?\d+\.\d+)/,
];

function extractLatLng(text: string): { lat: number; lng: number } | null {
  for (const pattern of COORD_PATTERNS) {
    const m = text.match(pattern);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }
  }
  return null;
}

// POST /api/resolve-map-link — turn a pasted Google Maps link (full or
// shortened, e.g. maps.app.goo.gl) into { latitude, longitude }. Shortened
// links carry no coordinates until the redirect is followed, which browsers
// won't let a page do cross-origin — so this happens server-side.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!url) {
    return NextResponse.json({ error: "Paste a Google Maps link" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "That doesn't look like a valid link" }, { status: 400 });
  }
  if (!/(^|\.)google\.[a-z.]+$|(^|\.)goo\.gl$/.test(parsed.hostname)) {
    return NextResponse.json(
      { error: "Paste a link from Google Maps" },
      { status: 400 }
    );
  }

  let coords = extractLatLng(parsed.toString());

  if (!coords) {
    try {
      const res = await fetch(parsed.toString(), {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      coords = extractLatLng(res.url) ?? extractLatLng(await res.text());
    } catch {
      // fall through — coords stays null, handled below
    }
  }

  if (!coords) {
    return NextResponse.json(
      {
        error:
          "Couldn't find a location in that link. Open the property in Google Maps, drop/select a pin, then share that link.",
      },
      { status: 422 }
    );
  }

  return NextResponse.json({ latitude: coords.lat, longitude: coords.lng });
}
