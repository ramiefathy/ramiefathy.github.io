# AI Dermatology Scribe – Websocket Service

This service powers the live transcription, note generation, and analysis features for the AI Dermatology Scribe web client.

## Quick Start

```bash
cd services/ai-scribe
cp .env.example .env   # then populate with your Gemini API key, session secret, and allowed origins
pip install -r requirements.txt
python app.py
```

By default the server listens on `ws://0.0.0.0:8765`. Clients must supply the `token` query parameter or `X-Auth-Token` header that matches `SESSION_SECRET` in `.env`.

> **Tip:** generate a long random `SESSION_SECRET` for production deployments and update `ALLOWED_ORIGINS` to include trusted frontends (e.g., `https://ramiefathy.github.io`).

## Configuration

| Variable               | Description                                               |
|------------------------|-----------------------------------------------------------|
| `GEMINI_API_KEY`       | Google Gemini API key                                     |
| `GEMINI_DEFAULT_MODEL` | Model used for transcript-to-note generation              |
| `GEMINI_VISION_MODEL`  | Model used for multimodal image analysis                  |
| `GEMINI_SUGGESTION_MODEL` | Model used for real-time suggestion prompts           |
| `SESSION_SECRET`       | Shared secret required for websocket authentication       |
| `ALLOWED_ORIGINS`      | Comma-separated list of allowed `Origin` headers          |

## Deployment Notes

- The server is stateless; scale out with any process manager.
- Enable HTTPS termination at the proxy layer and forward traffic to the websocket port.
- Rotate `SESSION_SECRET` periodically and update the client configuration through the UI.
- Logging is written to stdout and can be captured by your hosting provider.

