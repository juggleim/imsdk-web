# Technical Content Marketing Plan

Goal: drive **long-tail search traffic** to `Juggleim/im-web-sdk` by publishing original technical articles that rank for keywords developers actually search.

## High-leverage keyword clusters

| Cluster | Search intent | Why it converts |
|---|---|---|
| `websocket reconnect strategy` | How-to | Developers actively building IM |
| `protobuf vs json for chat` | Comparison | Buyers weighing protocol choices |
| `build im from scratch` | Tutorial | Beginners deciding which SDK to learn |
| `open source im sdk comparison` | Comparison | Direct SDK-shoppers |
| `live chatroom architecture` | Architecture | Backend/scale eng audience |
| `webrtc signaling protocol design` | How-to | RTC builders |

## Article backlog (drafted, ready to publish)

### A1. "Building a Production WebSocket IM SDK: What We Learned at JuggleIM"
- Length: 2,500–3,500 words
- Outline:
  1. Why we built a custom Protobuf protocol (vs. JSON / Socket.IO)
  2. Heartbeat & reconnect math: why exponential backoff + jitter wins
  3. Offline messages & message dedup: server timestamp + client sequence
  4. Push reliability: ACK + retransmit window
  5. Bundle size tactics: tree-shakable ESM + Protobuf lazy-load
  6. Open Q&A — comment to drive GitHub Discussions traffic
- Channels: **dev.to**, **Medium**, **Juejin (translated)**, **Hashnode**

### A2. "Open-Source IM Showdown: JuggleIM vs WildfireChat vs Rocket.Chat"
- Length: 2,000 words, table-driven
- Outline:
  1. Criteria: protocol, self-hostability, multi-platform, license, maintenance
  2. Comparison table
  3. Where JuggleIM wins / loses honestly
  4. "Choose X if…" decision tree
- Channels: **dev.to**, personal blog, **Hacker News** *(soft-pitch headline)*

### A3. "From 0 to 1: Wiring a React Chat App with JuggleIM in 10 Minutes"
- Length: 1,500 words, hands-on
- Outline:
  1. Scaffold a Vite React app
  2. `npm i webim-sdk`
  3. 10 lines to connect, send, receive
  4. Add chatroom in another 10 lines
  5. Deploy to Vercel
- Channels: **dev.to**, **freeCodeCamp** *(if accepted)*, **Juejin (translated)*

### A4. "JuggleIM Roadmap 2026: Open Q&A with Maintainers"
- Length: 1,200 words
- Outline:
  1. What shipped in 1.9.x
  2. Public roadmap (matrix-style)
  3. Ask-me-anything → drive GitHub Discussions
- Channels: **GitHub Discussions → Announcements**, **Twitter/X thread**

## Drop-in opening for English posts

> Real-time messaging looks simple — until you have to ship it to production.
> Over the last few releases of [JuggleIM](https://github.com/Juggleim/im-web-sdk), our team has rebuilt parts of the Web SDK more than once to handle reconnect storms, message duplication, and brittle heartbeats. This post walks through the design decisions behind the current architecture and the lessons we learned the hard way.

## Channel checklist

- [ ] **dev.to** — primary, allows canonical URL → GitHub README
- [ ] **Medium** — syndication; add canonical link to dev.to post
- [ ] **Hashnode** — mirrors dev.to
- [ ] **Juejin / SegmentFault / 思否** — Chinese translation of A1 + A3
- [ ] **Hacker News** — submit *one* flagship post (A2) — never all of them
- [ ] **Twitter/X thread** — 7–10 tweets, end with repo link
- [ ] **Reddit** — `r/programming`, `r/webdev`, `r/node` (one post at a time)
- [ ] **Product Hunt** — schedule for a major release day
- [ ] **Newsletter mentions** — pitch JavaScript Weekly, Console, Pointer

## Cadence

- 1 long-form post every 2 weeks
- 1 short thread/tweet every week
- 1 community AMA every quarter

## Tracking

Use UTM parameters on every outbound link, e.g.:
`https://github.com/Juggleim/im-web-sdk?utm_source=devto&utm_medium=article&utm_campaign=a1-websocket`

Then attribute stars / clones per campaign in GitHub Insights → Traffic.
