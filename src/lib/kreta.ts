// e-Kréta API helper constants and types

export const IDP_BASE = "https://idp.e-kreta.hu";
export const GLOBAL_API = "https://kretaglobalapi.e-kreta.hu";
export const API_KEY = "21ff6c25-d1da-4a68-a811-c881a6057463";
export const USER_AGENT = "hu.ekreta.tanulo/1.0.5/Android/0/0";

// Official mobile client OAuth2 parameters (used by many clients)
export const CLIENT_ID = "kreta-ellenorzo-student-mobile-ios";
export const REDIRECT_URI = "https://mobil.e-kreta.hu/ellenorzo-student/prod/oauthredirect";
export const CODE_CHALLENGE = "HByZRRnPGb-Ko_wTI7ibIba1HQ6lor0ws4bcgReuYSQ";
export const CODE_VERIFIER = "DSpuqj_HhDX4wzQIbtn8lr8NLE5wEi1iVLMtMK0jY6c";
export const STATE = "kreten_student_mobile";

export function getMobileApiBase(instituteCode: string) {
  // Most common pattern used by current clients
  return `https://${instituteCode}.e-kreta.hu/ellenorzo/v3/`;
}

export function getAuthHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": USER_AGENT,
    apiKey: API_KEY,
    "Content-Type": "application/json",
  };
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  id_token?: string;
  scope?: string;
}

export interface Grade {
  Uid: string;
  Ertek?: string | number;
  SzovegesErtekeles?: string;
  Tantargy?: { Nev: string; Uid: string };
  Tema?: string;
  RogzitesDatuma?: string;
  KeszitesDatuma?: string;
  SulySzazalekErteke?: number;
  Tipus?: { Nev: string; Leiras?: string };
  ErtekeloTanarNeve?: string;
}

export interface Lesson {
  Uid: string;
  Tantargy?: { Nev: string };
  TanarNeve?: string;
  TeremNeve?: string;
  KezdetIdopont?: string;
  VegIdopont?: string;
  Oraszam?: number;
  Allapot?: { Nev: string };
  Helyettesites?: boolean;
  Tema?: string;
}

export interface Absence {
  Uid: string;
  Datum?: string;
  Ora?: { Oraszam?: number; Tantargy?: { Nev: string } };
  Tipus?: { Nev: string; Leiras?: string };
  IgazolasAllapota?: string;
  IgazolasTipusa?: { Nev: string };
}