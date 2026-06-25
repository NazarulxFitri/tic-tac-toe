# Tic Tac Toe — Arcade Arena

Neon arcade tic-tac-toe built with plain HTML, CSS, and JavaScript. Deploys as static files on Vercel.

## Modes

- **Vs CPU** — optimal minimax AI (`cpu.html`)
- **Online** — peer-to-peer multiplayer via PeerJS (`online.html`), works on Vercel with no backend

## Local dev

Any static file server works:

```bash
npx serve .
```

Then open `http://localhost:3000`

## Deploy on Vercel

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. No build command needed — static site

## Online play

1. Player A creates a room and shares the 6-character code
2. Player B joins with that code
3. Host plays **X**, guest plays **O**

Uses [PeerJS](https://peerjs.com) for browser-to-browser connection (free signaling server).
