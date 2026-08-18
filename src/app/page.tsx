"use client";

import { useState, useEffect } from "react";

type Tab = "grades" | "timetable" | "absences";

interface AuthData {
  access_token: string;
  refresh_token?: string;
  institute_code: string;
  expires_in?: number;
}

export default function Home() {
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("grades");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [institute, setInstitute] = useState("");

  const [grades, setGrades] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [absences, setAbsences] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ekreta-auth");
    if (saved) {
      try {
        setAuth(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!auth) return;
    fetchData();
  }, [auth, tab]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          institute_code: institute.trim().toLowerCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Bejelentkezés sikertelen");
        setLoading(false);
        return;
      }

      const authData: AuthData = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        institute_code: data.institute_code || institute,
        expires_in: data.expires_in,
      };

      localStorage.setItem("ekreta-auth", JSON.stringify(authData));
      setAuth(authData);
    } catch (err: any) {
      setError("Hálózati hiba: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("ekreta-auth");
    setAuth(null);
    setGrades([]);
    setTimetable([]);
    setAbsences([]);
  }

  async function fetchData() {
    if (!auth) return;
    setDataLoading(true);
    setError("");

    const headers = {
      Authorization: `Bearer ${auth.access_token}`,
    };

    try {
      if (tab === "grades") {
        const res = await fetch(
          `/api/grades?institute_code=${auth.institute_code}`,
          { headers }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Hiba");
        setGrades(Array.isArray(data) ? data : []);
      } else if (tab === "timetable") {
        const res = await fetch(
          `/api/timetable?institute_code=${auth.institute_code}`,
          { headers }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Hiba");
        setTimetable(Array.isArray(data) ? data : []);
      } else if (tab === "absences") {
        const res = await fetch(
          `/api/absences?institute_code=${auth.institute_code}`,
          { headers }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Hiba");
        setAbsences(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      setError(err.message || "Adatok lekérése sikertelen");
    } finally {
      setDataLoading(false);
    }
  }

  if (!auth) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-slate-900">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-cyan-400 mb-2">e-Kréta</h1>
            <p className="text-slate-400 text-sm">
              Nem hivatalos mobilbarát kliens
            </p>
          </div>

          <form
            onSubmit={login}
            className="bg-slate-800 rounded-2xl p-6 shadow-xl space-y-4"
          >
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Intézménykód
              </label>
              <input
                type="text"
                value={institute}
                onChange={(e) => setInstitute(e.target.value)}
                placeholder="pl. klik012345678"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
                autoCapitalize="none"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Felhasználónév
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
                autoCapitalize="none"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Jelszó</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-xl p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-900 font-semibold rounded-xl py-3 transition"
            >
              {loading ? "Bejelentkezés..." : "Belépés"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            Ez egy nem hivatalos kliens. Az adataid csak a te böngésződben
            tárolódnak.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-slate-900">
      <header className="sticky top-0 z-10 bg-slate-800/95 backdrop-blur border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-cyan-400">e-Kréta</h1>
        <button
          onClick={logout}
          className="text-sm text-slate-400 hover:text-white"
        >
          Kijelentkezés
        </button>
      </header>

      <nav className="flex border-b border-slate-700 bg-slate-800">
        {(
          [
            ["grades", "Jegyek"],
            ["timetable", "Órarend"],
            ["absences", "Mulasztások"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 py-3 text-sm font-medium transition ${
              tab === id
                ? "text-cyan-400 border-b-2 border-cyan-400"
                : "text-slate-400"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-auto p-4 pb-8">
        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-xl p-3 mb-4">
            {error}
          </div>
        )}

        {dataLoading ? (
          <div className="text-center text-slate-400 py-12">Betöltés...</div>
        ) : (
          <>
            {tab === "grades" && <GradesList grades={grades} />}
            {tab === "timetable" && <TimetableList lessons={timetable} />}
            {tab === "absences" && <AbsencesList absences={absences} />}
          </>
        )}
      </main>
    </div>
  );
}

function GradesList({ grades }: { grades: any[] }) {
  if (!grades.length) {
    return (
      <p className="text-center text-slate-500 py-8">Nincs megjeleníthető jegy</p>
    );
  }

  const bySubject: Record<string, any[]> = {};
  grades.forEach((g) => {
    const name = g.Tantargy?.Nev || "Egyéb";
    if (!bySubject[name]) bySubject[name] = [];
    bySubject[name].push(g);
  });

  return (
    <div className="space-y-4">
      {Object.entries(bySubject).map(([subject, list]) => (
        <div key={subject} className="bg-slate-800 rounded-2xl p-4">
          <h2 className="font-semibold text-cyan-300 mb-3">{subject}</h2>
          <div className="flex flex-wrap gap-2">
            {list.map((g) => (
              <div
                key={g.Uid}
                className="bg-slate-900 rounded-xl px-3 py-2 text-center min-w-[3.5rem]"
              >
                <div className="text-xl font-bold text-white">
                  {g.Ertek ?? g.SzovegesErtekeles ?? "–"}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {g.RogzitesDatuma
                    ? new Date(g.RogzitesDatuma).toLocaleDateString("hu")
                    : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TimetableList({ lessons }: { lessons: any[] }) {
  if (!lessons.length) {
    return (
      <p className="text-center text-slate-500 py-8">
        Nincs óra a kiválasztott időszakban
      </p>
    );
  }

  const byDay: Record<string, any[]> = {};
  lessons.forEach((l) => {
    const day = l.KezdetIdopont
      ? new Date(l.KezdetIdopont).toLocaleDateString("hu", {
          weekday: "long",
          month: "short",
          day: "numeric",
        })
      : "Ismeretlen";
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(l);
  });

  return (
    <div className="space-y-4">
      {Object.entries(byDay).map(([day, list]) => (
        <div key={day} className="bg-slate-800 rounded-2xl p-4">
          <h2 className="font-semibold text-cyan-300 mb-3 capitalize">{day}</h2>
          <div className="space-y-2">
            {list
              .sort(
                (a, b) =>
                  new Date(a.KezdetIdopont || 0).getTime() -
                  new Date(b.KezdetIdopont || 0).getTime()
              )
              .map((l) => (
                <div
                  key={l.Uid}
                  className="flex gap-3 bg-slate-900 rounded-xl p-3"
                >
                  <div className="text-sm text-slate-400 w-12 shrink-0">
                    {l.Oraszam ?? "–"}.
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {l.Tantargy?.Nev || "Óra"}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {l.TanarNeve}
                      {l.TeremNeve ? ` • ${l.TeremNeve}` : ""}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 shrink-0">
                    {l.KezdetIdopont
                      ? new Date(l.KezdetIdopont).toLocaleTimeString("hu", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AbsencesList({ absences }: { absences: any[] }) {
  if (!absences.length) {
    return (
      <p className="text-center text-slate-500 py-8">Nincs mulasztás</p>
    );
  }

  return (
    <div className="space-y-2">
      {absences.map((a) => (
        <div
          key={a.Uid}
          className="bg-slate-800 rounded-xl p-4 flex justify-between items-start gap-3"
        >
          <div>
            <div className="font-medium">
              {a.Ora?.Tantargy?.Nev || a.Tipus?.Nev || "Mulasztás"}
            </div>
            <div className="text-sm text-slate-400">
              {a.Datum
                ? new Date(a.Datum).toLocaleDateString("hu")
                : ""}
              {a.Ora?.Oraszam ? ` • ${a.Ora.Oraszam}. óra` : ""}
            </div>
          </div>
          <div
            className={`text-xs px-2 py-1 rounded-full shrink-0 ${
              a.IgazolasAllapota === "Igazolt"
                ? "bg-green-900/50 text-green-300"
                : "bg-red-900/50 text-red-300"
            }`}
          >
            {a.IgazolasAllapota || a.Tipus?.Nev || "–"}
          </div>
        </div>
      ))}
    </div>
  );
}
