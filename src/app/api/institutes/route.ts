import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Public institutes list
    const res = await fetch(
      "https://kretaglobalapi.e-kreta.hu/intezmenyek/kreta/publikus",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ekreta-web/1.0)",
        },
        next: { revalidate: 3600 }, // cache 1 hour
      }
    );

    if (!res.ok) {
      // fallback
      const fallback = await fetch(
        "https://kretaglobalmobileapi2.ekreta.hu/api/v3/Institute",
        {
          headers: {
            apiKey: "7856d350-1fda-45f5-822d-e1a2f3f1acf0",
            "User-Agent": "hu.ekreta.tanulo/1.0.5/Android/0/0",
          },
        }
      );
      if (!fallback.ok) {
        return NextResponse.json(
          { error: "Nem sikerült lekérni az intézményeket" },
          { status: 502 }
        );
      }
      const data = await fallback.json();
      return NextResponse.json(data);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Hiba az intézmények lekérésekor" },
      { status: 500 }
    );
  }
}