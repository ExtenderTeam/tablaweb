import { NextRequest, NextResponse } from "next/server";
import { getMobileApiBase, getAuthHeaders } from "@/lib/kreta";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const institute = req.nextUrl.searchParams.get("institute_code");
  const from = req.nextUrl.searchParams.get("from"); // YYYY-MM-DD
  const to = req.nextUrl.searchParams.get("to");

  if (!auth || !institute) {
    return NextResponse.json(
      { error: "Hiányzó Authorization vagy institute_code" },
      { status: 400 }
    );
  }

  const token = auth.replace("Bearer ", "");
  const base = getMobileApiBase(institute);

  // Default: current week
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const datumTol = from || monday.toISOString().slice(0, 10);
  const datumIg = to || sunday.toISOString().slice(0, 10);

  try {
    const url = `${base}sajat/OrarendElemek?datumTol=${datumTol}&datumIg=${datumIg}`;
    const res = await fetch(url, {
      headers: getAuthHeaders(token),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: "Órarend lekérése sikertelen", details: text.slice(0, 300) },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Hálózati hiba", details: err.message },
      { status: 500 }
    );
  }
}