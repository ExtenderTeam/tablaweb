import { NextRequest, NextResponse } from "next/server";
import { getMobileApiBase, getAuthHeaders } from "@/lib/kreta";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const institute = req.nextUrl.searchParams.get("institute_code");

  if (!auth || !institute) {
    return NextResponse.json(
      { error: "Hiányzó Authorization vagy institute_code" },
      { status: 400 }
    );
  }

  const token = auth.replace("Bearer ", "");
  const base = getMobileApiBase(institute);

  try {
    const res = await fetch(`${base}sajat/Mulasztasok`, {
      headers: getAuthHeaders(token),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: "Mulasztások lekérése sikertelen", details: text.slice(0, 300) },
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