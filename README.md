# e-Kréta Web

Nem hivatalos, mobilbarát webes kliens az e-Kréta rendszerhez.

## Funkciók

- Bejelentkezés (intézménykód + felhasználónév + jelszó)
- Jegyek (tantárgy szerint csoportosítva)
- Órarend (aktuális hét)
- Mulasztások
- Teljesen mobilra optimalizált UI
- Tokenek csak a böngészőben tárolódnak

## Futtatás helyi környezetben

```bash
npm install
npm run dev
```

Nyisd meg: http://localhost:3000

## Deploy Vercel-re

1. Töltsd fel a projektet GitHub-ra
2. Csatlakoztasd a Vercel-hez
3. Deploy (nincs szükség környezeti változóra)

## Fontos megjegyzések

- Ez **nem hivatalos** kliens.
- Az e-Kréta bejelentkezési flow-ja időnként változik. Ha a bejelentkezés nem működik, a `src/app/api/auth/login/route.ts` fájlt kell frissíteni.
- Az adatok csak a te böngésződben (localStorage) tárolódnak.

## Licenc

MIT – szabadon használható és módosítható.
