# AI Dermatology Scribe – Websocket Service

This service powers the live transcription, note generation, and analysis features for the AI Dermatology Scribe web client.

## Quick Start

```bash
cd services/ai-scribe
cp .env.example .env   # then populate with your Gemini API key, session secret, and allowed origins
pip install -r requirements.txt
python app.py
```

By default the server listens on `ws://0.0.0.0:8765`.

### Authentication (JWT + legacy secret)
- Preferred: send a JWT signed with `JWT_SIGNING_SECRET` (HS256).
- **Browser clients (recommended):** use the WebSocket subprotocol header because browsers don't allow custom headers:
  - `Sec-WebSocket-Protocol: ramie-auth.<base64url(token)>`
  - In JS: `new WebSocket(wsUrl, ["ramie-auth." + base64url(token)])`
- **Non-browser clients:** may use `Authorization: Bearer <jwt>` or `X-Auth-Token: <token>`.
- Legacy clients may still send the raw `SESSION_SECRET`. When accepted, the server replies in `connection_ack` with a short‑lived JWT (15 minutes). Clients should reconnect using that JWT for subsequent sessions.
- `?token=` remains supported as a legacy fallback, but is discouraged because URLs are more likely to be logged or leaked.
- Invalid or missing tokens close the socket with code `4008`.

> **Tip:** keep `JWT_SIGNING_SECRET` different from `SESSION_SECRET` so clients who know the shared secret cannot mint arbitrary JWTs.

## Configuration

| Variable               | Description                                               |
|------------------------|-----------------------------------------------------------|
| `GEMINI_API_KEY`       | Google Gemini API key                                     |
| `GEMINI_DEFAULT_MODEL` | Model used for transcript-to-note generation              |
| `GEMINI_VISION_MODEL`  | Model used for multimodal image analysis                  |
| `GEMINI_SUGGESTION_MODEL` | Model used for real-time suggestion prompts           |
| `SESSION_SECRET`       | Shared secret required for websocket authentication       |
| `JWT_SIGNING_SECRET`   | Secret used to sign/verify JWTs (HS256)                   |
| `ALLOWED_ORIGINS`      | Comma-separated list of allowed `Origin` headers          |

## Deployment Notes

- The server is stateless; scale out with any process manager.
- Enable HTTPS termination at the proxy layer and forward traffic to the websocket port.
- Rotate `SESSION_SECRET` periodically and update the client configuration through the UI.
- Logging is written to stdout and can be captured by your hosting provider.
