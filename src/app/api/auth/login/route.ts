import { NextRequest, NextResponse } from "next/server";
import {
  IDP_BASE,
  CLIENT_ID,
  REDIRECT_URI,
  CODE_CHALLENGE,
  CODE_VERIFIER,
  USER_AGENT,
} from "@/lib/kreta";

/**
 * Bejelentkezés az e-Kréta rendszerbe.
 * A jelenlegi (2025-2026) OAuth2 + PKCE flow-t követi.
 * Megjegyzés: a Kréta gyakran változtat, ezért ez a proxy időnként frissítést igényelhet.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, institute_code } = body;

    if (!username || !password || !institute_code) {
      return NextResponse.json(
        { error: "Hiányzó adatok (username, password, institute_code)" },
        { status: 400 }
      );
    }

    // 1. lépés: Login oldal lekérése a RequestVerificationToken-hez
    const returnUrl = encodeURIComponent(
      `/connect/authorize/callback?prompt=login&nonce=${generateNonce()}&response_type=code&code_challenge_method=S256&scope=openid%20email%20offline_access%20kreta-ellenorzo-webapi.public%20kreta-eugyintezes-webapi.public%20kreta-fileservice-webapi.public%20kreta-mobile-global-webapi.public%20kreta-dkt-webapi.public%20kreta-ier-webapi.public&code_challenge=${CODE_CHALLENGE}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}&state=kreten_student_mobile&suppressed_prompt=login`
    );

    const loginPageRes = await fetch(
      `${IDP_BASE}/Account/Login?ReturnUrl=${returnUrl}`,
      {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "manual",
      }
    );

    const cookies = extractCookies(loginPageRes);
    const html = await loginPageRes.text();
    const rvtMatch = html.match(
      /name="__RequestVerificationToken"[^>]*value="([^"]+)"/
    );
    const rvt = rvtMatch ? rvtMatch[1] : null;

    if (!rvt) {
      // Fallback: próbáljuk a régebbi password grant módszert (néhány intézményen még működik)
      return await tryPasswordGrant(username, password, institute_code);
    }

    // 2. lépés: Bejelentkezés POST
    const formData = new URLSearchParams();
    formData.append("UserName", username);
    formData.append("Password", password);
    formData.append("InstituteCode", institute_code);
    formData.append("RememberLogin", "false");
    formData.append("__RequestVerificationToken", rvt);

    const loginRes = await fetch(`${IDP_BASE}/Account/Login`, {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookies,
        Origin: IDP_BASE,
        Referer: `${IDP_BASE}/Account/Login`,
      },
      body: formData.toString(),
      redirect: "manual",
    });

    const loginCookies = mergeCookies(cookies, extractCookies(loginRes));

    // 3. lépés: Authorization code megszerzése
    const authUrl = `${IDP_BASE}/connect/authorize/callback?prompt=login&nonce=${generateNonce()}&response_type=code&code_challenge_method=S256&scope=openid%20email%20offline_access%20kreta-ellenorzo-webapi.public%20kreta-eugyintezes-webapi.public%20kreta-fileservice-webapi.public%20kreta-mobile-global-webapi.public%20kreta-dkt-webapi.public%20kreta-ier-webapi.public&code_challenge=${CODE_CHALLENGE}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}&state=kreten_student_mobile&suppressed_prompt=login`;

    const authRes = await fetch(authUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Cookie: loginCookies,
      },
      redirect: "manual",
    });

    const location = authRes.headers.get("location") || "";
    const codeMatch = location.match(/[?&]code=([^&]+)/);
    const code = codeMatch ? codeMatch[1] : null;

    if (!code) {
      // Ha nem sikerült a modern flow, próbáljuk a password grant-ot
      return await tryPasswordGrant(username, password, institute_code);
    }

    // 4. lépés: Code cseréje tokenre
    const tokenBody = new URLSearchParams();
    tokenBody.append("code", code);
    tokenBody.append("code_verifier", CODE_VERIFIER);
    tokenBody.append("redirect_uri", REDIRECT_URI);
    tokenBody.append("client_id", CLIENT_ID);
    tokenBody.append("grant_type", "authorization_code");

    const tokenRes = await fetch(`${IDP_BASE}/connect/token`, {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenBody.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Token error:", errText);
      return await tryPasswordGrant(username, password, institute_code);
    }

    const tokens = await tokenRes.json();

    return NextResponse.json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type || "Bearer",
      institute_code,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Bejelentkezési hiba", details: error.message },
      { status: 500 }
    );
  }
}

async function tryPasswordGrant(
  username: string,
  password: string,
  institute_code: string
) {
  // Régebbi, de még sok helyen működő módszer
  const body = new URLSearchParams();
  body.append("userName", username);
  body.append("password", password);
  body.append("institute_code", institute_code);
  body.append("grant_type", "password");
  body.append("client_id", "kreta-ellenorzo-mobile-android");

  const res = await fetch(`${IDP_BASE}/connect/token`, {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
      "X-AuthorizationPolicy-Version": "v2",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      {
        error:
          "Bejelentkezés sikertelen. Ellenőrizd a felhasználónevet, jelszót és intézménykódot.",
        details: text.slice(0, 200),
      },
      { status: 401 }
    );
  }

  const tokens = await res.json();
  return NextResponse.json({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in,
    token_type: tokens.token_type || "Bearer",
    institute_code,
  });
}

function extractCookies(res: Response): string {
  const setCookie = res.headers.getSetCookie?.() || [];
  if (setCookie.length === 0) {
    const single = res.headers.get("set-cookie");
    if (single) return single.split(";")[0];
    return "";
  }
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

function mergeCookies(a: string, b: string): string {
  const map = new Map<string, string>();
  [...a.split("; "), ...b.split("; ")].forEach((pair) => {
    const [k, v] = pair.split("=");
    if (k && v) map.set(k.trim(), v.trim());
  });
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function generateNonce() {
  return (
    Math.random().toString(36).substring(2) +
    Math.random().toString(36).substring(2)
  );
}