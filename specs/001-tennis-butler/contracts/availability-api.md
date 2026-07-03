# Contract: Availability API

The app's single server interface. Consumed only by the TennisButler island (same origin).

## Request

```
GET /api/availability?date=YYYY-MM-DD&start=HH:MM&end=HH:MM&minDuration=60
```

| Param | Required | Rules |
|-------|----------|-------|
| `date` | yes | `YYYY-MM-DD`; within `[today, today+14]` where "today" is computed in `Australia/Sydney` |
| `start` | yes | `HH:MM`, 30-minute boundary, within 06:00–23:00 |
| `end` | yes | `HH:MM`, 30-minute boundary, within 06:00–23:00, strictly after `start` |
| `minDuration` | no | one of `30`, `60`, `90`, `120`; default `60` |

GET (not POST) so responses are cacheable by URL.

## Responses

### 200 — always, for any valid query (including total upstream failure)

`Content-Type: application/json`
`Cache-Control: public, s-maxage=60, stale-while-revalidate=120`

Body: `AvailabilityResponse` (see data-model.md). Guarantees:

- `results` contains **every** venue in the registry, sorted by `distanceKm` ascending.
- ClubSpark venues → `kind: 'availability'` with `status: 'ok' | 'timeout' | 'error'`; `windows` is non-empty only when `status === 'ok'` and free time matching `minDuration` exists in range.
- External venues → `kind: 'link-only'`; never carry availability claims.
- Every result carries a working `bookingUrl` regardless of status.
- No slot appears in `windows` unless upstream data affirmatively marked it bookable (fail closed).
- If the query date is today, windows are clipped to start no earlier than the current Sydney time.

### 400 — invalid query

```json
{ "error": "human-readable reason" }
```

Never used for upstream failures — those degrade per-venue inside a 200.

## Server behavior

- Fan-out: `Promise.allSettled` across ClubSpark venues, each fetch bound by `AbortSignal.timeout(4000)`; rejected/timed-out → `status: 'timeout' | 'error'`, `windows: []`.
- Upstream request header: `User-Agent: sanzh.ar-tennis-butler/1.0 (personal tool; contact: sanzhar.kushekbayev@gmail.com)`.
- One upstream request per venue per search; no retries in v1.
- Route config: `export const prerender = false`, `maxDuration: 15`.

## Example

```
GET /api/availability?date=2026-07-04&start=17:00&end=21:00&minDuration=60
```

```json
{
  "query": { "date": "2026-07-04", "start": "17:00", "end": "21:00", "minDurationMinutes": 60 },
  "generatedAt": "2026-07-03T09:15:00.000Z",
  "results": [
    {
      "kind": "availability",
      "venue": { "id": "five-dock-park", "name": "Five Dock Park Tennis Centre", "suburb": "Five Dock", "distanceKm": 1.8 },
      "status": "ok",
      "windows": [
        { "court": "Court 1", "start": "18:00", "end": "20:00", "guestPricePerHour": 25, "includesLighting": true },
        { "court": "Court 2", "start": "18:00", "end": "20:00", "guestPricePerHour": 25, "includesLighting": true }
      ],
      "bookingUrl": "https://play.tennis.com.au/fivedockparktenniscentre/Booking/BookByDate#?date=2026-07-04"
    },
    {
      "kind": "link-only",
      "venue": { "id": "birchgrove", "name": "Birchgrove Tennis", "suburb": "Birchgrove", "distanceKm": 3.1 },
      "bookingUrl": "https://birchgrovetennisonline.simplybook.me/v2/#book",
      "systemName": "SimplyBook.me"
    },
    {
      "kind": "availability",
      "venue": { "id": "ryde-balmain-meadowbank", "name": "Ryde Balmain Tennis (Meadowbank)", "suburb": "Meadowbank", "distanceKm": 6.4 },
      "status": "timeout",
      "windows": [],
      "bookingUrl": "https://play.tennis.com.au/rydebalmaintennis/Booking/BookByDate#?date=2026-07-04",
      "errorMessage": "Booking system didn't respond"
    }
  ]
}
```
