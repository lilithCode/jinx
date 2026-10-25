# DareJar — Concept & Build Plan

> A cozy, studio-style party website where friends drop dares into a shared jar
> and pull them out at random. No accounts. One code. Pure chaos (the friendly kind).

---

## 1. The Concept (improved)

### Core metaphor: the **Jar**
Your original "space" becomes a **Jar**. That one word explains the whole product:
you put dares *in*, you pull dares *out*. It also gives us a mascot, an animation
(the jar shakes, the lid pops, a paper slip flies out) and a name.

| Your idea | Improved version |
|---|---|
| Create a space | **Fill a new Jar**: name, emoji/theme, number of players, spice level |
| Share a password | Share a **6-character Jar code** *and* a one-tap **invite link** (`darejar.app/j/K7QX9P`) |
| Enter the code | Enter the code, then **claim your player seat** (name + avatar). The seat stays locked to your device |
| Everyone types dares | Dares are **sealed**: you see only your own. Others appear as folded paper slips with a count ("Bilal added 6 slips") |
| Random dare button | **Shake the Jar**: synced for everyone in the room, so all screens play the animation together |
| Remove / OK | Four outcomes: **Done ✅**, **Chicken out 🐔** (goes back in the jar), **Veto 🚫** (removed forever), **Redraw 🔄** |

### New ideas that make it more fun
1. **Who has to do it?** Before the dare is shown, a little spinner picks the *victim*,
   or the host can set turn order. You never get your own dare (setting, on by default).
2. **Spice levels:** each dare is tagged 🌸 Mild / 🌶️ Spicy / 🔥 Chaotic. The host sets
   the jar's max spice. A "Chaotic" jar needs everyone to tap "I'm in".
3. **Scoreboard:** Done = +2, Chicken out = −1. At the end, a "Bravest" and a "Biggest Chicken" badge.
4. **Reactions:** while someone does a dare, others spam 😂🔥😱👏, which float up on every screen.
5. **Starter packs:** if the jar is empty or low, the host can add a pack
   ("Sleepover", "Online call", "Food dares", "Wholesome").
6. **Hall of Fame:** a timeline of completed dares. At the end it turns into a shareable
   recap card (image) for the group chat.
7. **Anonymous mode:** the author stays hidden after the dare is revealed. Who wrote it? 👀
8. **Jar expiry:** a jar lives 7 days by default (the host can extend it), then it is wiped.

---

## 2. User Flows

### A. Create a Jar (host)
```
Landing → "Fill a new Jar" card
  Step 1  Jar name ("Saturday Sleepover"), pick theme colour + emoji
  Step 2  Players: 2–12 (stepper), your own name + avatar
  Step 3  Rules: max spice, anonymous mode, "no own dares", dares per player limit
  → Jar created 🎉  Screen shows:
      big code  K 7 Q X 9 P   [Copy code] [Copy invite link] [Share…] [QR]
      "Waiting for friends… 1 / 4 joined" (live)
```

### B. Join a Jar (player)
```
Landing → centre card "Enter a Jar" → 6 segmented code boxes (auto-advance, paste-friendly)
  → valid code → "Saturday Sleepover · 2/4 seats taken"
  → enter name + pick avatar → seat claimed → into the room
Invite link /j/K7QX9P skips straight to the name step.
```

### C. Inside the Jar (room)
Tabs (bottom bar on mobile, side rail on desktop):
- **My Slips**: type a dare, hit Enter, and it folds into a paper slip and drops into the jar.
  You can edit or delete your own slips while they're still in the jar.
- **The Jar**: the big jar illustration with slip count per player and the **Shake the Jar** button.
- **Scores**: the scoreboard.
- **Hall of Fame**: completed dares and history.
- Host-only ⚙️: kick player, lock jar, regenerate code, change rules, end the game.

### D. The Draw (the hero moment)
1. Anyone (or only the current turn-holder, depending on the setting) taps **Shake the Jar**.
2. The server picks a dare and a victim, then broadcasts to all players.
3. Everyone's screen plays the same sequence (~3 s):
   - the jar wobbles (0.4 s), the lid pops, slips swirl out
   - slot-machine shuffle of folded slips that slows down (1.5 s)
   - the victim's avatar spins in ("It's **Ayesha's** turn!")
   - the slip unfolds/flips to reveal the dare, with a confetti burst
4. Action buttons: **Done ✅ / Chicken 🐔 / Veto 🚫 / Redraw 🔄**
   - Veto needs the victim + 1 other player, or the host (stops people from deleting everything).
5. Honours `prefers-reduced-motion`, which uses a simple fade/flip instead. Sounds are optional, muted by default.

---

## 3. UI / Visual Direction: "Studio-cozy"

Drawn from your references: the pink/plum anime dashboards (rounded pill buttons, big
hero card, chunky white cards), Space Alien (flat illustrated world, wavy section
edges, cute blob mascot) and Yuna (painterly clouds, soft pastel feature cards, serif warmth).

### Palette (design tokens)
| Token | Hex | Use |
|---|---|---|
| `--sakura` | `#F07A9A` | primary buttons, highlights |
| `--blush` | `#FFD3DE` | soft fills, pills |
| `--plum` | `#5B2A5E` | headings, dark sections, ink |
| `--orchid` | `#B65BC2` | secondary accent, gradients |
| `--peach` | `#FFB38A` | warm sections, Spicy tag |
| `--cream` | `#FFF7F2` | page background |
| `--midnight` | `#2A1733` | dark mode bg, "night sky" sections |
| `--mint` | `#9BE3C4` | success / Done |

Dark mode = "night jar": midnight-purple sky, stars, glowing pink jar.

### Type
- Display: **Fredoka** or **Baloo 2** (round, bubbly, like the reference headings)
- Accent/script: **Pacifico**, used sparingly for the logo only (echoes "Space Alien")
- Body: **Nunito**

### Shapes & motifs
- Radius 24–32 px cards, full pill buttons, thick soft shadows (`0 8px 0` "sticker" style on press)
- Wavy SVG section dividers, floating clouds, twinkling stars, drifting paper slips
- **Mascot "Jarbo"**: a little glass jar with blob eyes and a cork hat. It reacts: idle bob,
  shakes on draw, faints on a Chicken, sparkles on Done. Original art only (no anime IP
  like Bocchi/Kafka; commission or generate an original character).
- Micro-interactions: buttons squish on press, slips fold when added, avatars wiggle when they join.

### Landing page wireframe (desktop)
```
┌──────────────────────────────────────────────────────────────────┐
│ (Jarbo) DareJar          How it works   Packs   About   [☾]      │
├──────────────────────────────────────────────────────────────────┤
│   ☁️  ✨           pink→plum gradient hero, clouds        ✨  ☁️    │
│  ┌───────────────────────────────┐   ┌───────────────────────┐   │
│  │   Enter a Jar 🫙               │   │  ＋ Fill a new Jar     │   │
│  │   [K][7][Q][X][9][P]          │   │  Start a game for      │   │
│  │   (  Hop in  →  )             │   │  2–12 friends          │   │
│  │                     (Jarbo)   │   │  ( Create )            │   │
│  └───────────────────────────────┘   └───────────────────────┘   │
│ ~~~~~~~~~~~~~~~~~~~~~ wavy divider ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ │
│   How it works:  [1 Make a jar] [2 Drop dares] [3 Shake it!]    │  pastel cards
│   Spice levels:  🌸 Mild   🌶️ Spicy   🔥 Chaotic                 │
│   Night section: "Your dares stay sealed until the jar decides"  │
│   Footer: big pill "Fill a Jar" + Jarbo waving                   │
└──────────────────────────────────────────────────────────────────┘
```
Mobile: "Enter a Jar" card first and full width, "Fill a new Jar" as a sticky pill below it.

### Room wireframe (mobile)
```
┌──────────────────────────┐
│ Saturday Sleepover  K7Q… │  ← tap to copy/share
│ 🟣A 🩷B 🟠C 🟢D  (live)    │
├──────────────────────────┤
│        ( big jar )       │
│   23 slips · 🌶️ max      │
│                          │
│  ((  SHAKE THE JAR  ))   │
├──────────────────────────┤
│ 🫙 Jar  ✏️ Slips  🏆  📜 │  bottom tab bar
└──────────────────────────┘
```

---

## 4. Security & Safety

### Joining & codes
- **Codes**: 6 chars from an unambiguous alphabet (`ABCDEFGHJKMNPQRSTUVWXYZ23456789`, 31 chars),
  about 887 million combinations. Generated server-side with a CSPRNG and checked for uniqueness.
- **Rate limiting**: 5 wrong codes per minute per IP and device. After 10 failures, show a
  Cloudflare Turnstile challenge. Creating jars is limited to 10 per hour per IP.
- **Seat limit is enforced on the server.** The jar locks once all seats are claimed. The host can lock it early.
- **Device-bound seats**: joining creates an anonymous auth session (httpOnly cookie / JWT).
  Rejoining from the same device restores your seat. A new device needs the host to "release" the seat.
- Optional **Jar password** for extra privacy (hashed with Argon2/bcrypt).
- Host can **regenerate the code** (old code dies) and **kick** players.

### Data access
- **Sealed dares are actually secret.** The client never receives other players' dare
  text until it is drawn. Postgres **Row-Level Security**: a player can read
  `dares` only if `author_id = me` OR `status != 'in_jar'`.
- **The random pick happens on the server** (DB function), not in the browser, so
  nobody can cheat or peek. It uses `FOR UPDATE SKIP LOCKED` so two people shaking at once can't
  draw the same slip.
- Every write (add dare, resolve, kick) goes through server functions that check the caller's
  seat and role.

### Input & web hygiene
- Dare text: 3–200 chars, trimmed, rendered as **plain text** (never HTML), so no XSS.
- Max 30 slips per player, 300 per jar.
- Optional light profanity/harm filter with a "Report slip" button. The host can delete any slip.
- Security headers: strict CSP, HSTS, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`.
- Invite link codes are not logged in analytics.

### Privacy & wellbeing
- No email, no accounts, no tracking cookies. Only a display name.
- Jars and all their data are **auto-deleted** after expiry (scheduled job).
- Short "Play nice" rules on the create screen: no dangerous, illegal or humiliating dares.
  The Veto button is always available.
- 🔥 Chaotic jars show a "18+ / everyone consents" check that every player must confirm.

---

## 5. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js 15 (App Router) + TypeScript** | routing, SSR landing page, edge middleware |
| Styling | **Tailwind CSS** + CSS variables for tokens | quick theming and dark mode |
| Animation | **Framer Motion** (UI) + **Lottie** or SVG for Jarbo, **canvas-confetti** | polished draw sequence |
| Backend | **Supabase**: Postgres, Realtime, Anonymous Auth, RLS, Edge Functions | realtime sync + real security without running a server |
| Bot protection | Cloudflare **Turnstile** | free, privacy-friendly CAPTCHA |
| Rate limiting | Upstash Redis (`@upstash/ratelimit`) in Next middleware | simple per-IP limits |
| Hosting | **Vercel** (frontend) + Supabase cloud | free tiers cover a friends app |
| Testing | Vitest (logic), Playwright (2-browser join/draw flow), pgTAP or SQL tests for RLS | |

Fallback if you want zero backend at first: a local-only "pass the phone" mode (one device,
localStorage), which can ship as a bonus feature later.

---

## 6. Data Model

```sql
jars      (id uuid pk, code text unique, name, emoji, theme,
           max_players int, max_spice enum, settings jsonb,
           status enum('lobby','playing','locked','ended'),
           host_player_id, password_hash null, expires_at, created_at)

players   (id uuid pk, jar_id fk, auth_uid uuid, display_name, avatar, color,
           role enum('host','player'), score int default 0,
           is_kicked bool, joined_at)          -- unique(jar_id, auth_uid)

dares     (id uuid pk, jar_id fk, author_id fk players, text, spice enum,
           status enum('in_jar','drawn','done','chickened','vetoed'),
           times_drawn int, created_at)

draws     (id uuid pk, jar_id fk, dare_id fk, victim_id fk, drawn_by fk,
           outcome enum('pending','done','chicken','veto','redraw') ,
           created_at, resolved_at)

reactions (ephemeral: Realtime broadcast only, not stored)
```

### Server functions (RPC / Edge)
| Function | Does |
|---|---|
| `create_jar(name, max_players, settings, host_name, avatar)` | creates the jar + host seat, returns the code |
| `peek_jar(code)` | rate-limited; returns name, seats taken/total, needs-password |
| `join_jar(code, name, avatar, password?)` | claims a seat atomically (fails if full/locked) |
| `add_dare(text, spice)` / `edit_dare` / `delete_dare` | validated, own slips only |
| `shake_jar(jar_id)` | picks a random eligible dare + victim, creates a `draw`, broadcasts |
| `resolve_draw(draw_id, outcome)` | updates the dare + score; veto checks permissions |
| `host_*` | kick, lock, regenerate code, update rules, end the jar |
| cron `purge_expired()` | hourly; deletes expired jars (cascade) |

Realtime channels: `jar:{id}` for presence (who's online), `draw` events and reactions.

---

## 7. Pages / Routes

| Route | Purpose |
|---|---|
| `/` | Landing: Enter a Jar (centre), Fill a new Jar (side), how it works |
| `/new` | 3-step create wizard |
| `/j/[code]` | Invite link → name + avatar → join |
| `/jar/[code]` | The room (tabs: Jar, My Slips, Scores, Hall of Fame, Settings) |
| `/jar/[code]/recap` | End-of-game recap + shareable image |
| `/rules`, `/privacy` | Play-nice rules, privacy |
| 404 / expired | "This jar got washed 🧽" with Jarbo |

---

## 8. Build Phases

**Phase 0: Design system (1–2 days)**
Tokens, fonts, buttons/pills/cards/inputs, Jarbo mascot SVG, wavy dividers, light/dark.

**Phase 1: MVP (3–5 days)**
Landing, create wizard, join by code/link, add/edit/delete slips, server-side shake,
synced draw animation, Done/Chicken/Veto, realtime player list. RLS from day one.

**Phase 2: Fun layer (2–3 days)**
Spice levels, victim spinner, scoreboard, reactions, starter packs, Hall of Fame,
sounds, anonymous mode.

**Phase 3: Hardening (1–2 days)**
Rate limits, Turnstile, security headers, expiry cron, Playwright multi-player tests,
RLS tests, accessibility pass (keyboard, contrast, reduced motion).

**Phase 4: Extras (optional)**
Recap share image, PWA install, QR join, pass-the-phone offline mode, more themes
(Night Sky, Peach Desert, Bubblegum).

---

## 9. Decisions to confirm
1. **Name**: "DareJar" (alternatives: *Dare Den*, *Slip!*, *Jarbo*).
2. **Sealed dares**: should players be unable to read each other's dares before they're drawn? (recommended: yes)
3. **Audience**: teens and up with a Chaotic 18+ opt-in, or adults only?
4. **Backend**: Supabase (recommended), or start with a local-only prototype first?
