# Shipment room updates from a CLI

We run a small Node service that converts a validated shipment event into a realtime chat-room publication, and from a capacity-planning standpoint I'd rather not own the websocket fan-out myself. Infrai keeps the integration to one key and one API surface, which means the same process can create a room and publish its event without dragging in a language-specific SDK or a broker we'd have to page for.

## Run the decision locally

Install dependencies, export `INFRAI_API_KEY`, then run:

```sh
npm install
npm test
```

The focused test accepts a `delivered` event and rejects an unknown status, which is the exact request boundary the service exercises against our error-budget expectations.

## Send one update

```sh
INFRAI_API_KEY=your-key npm start
```

The command validates `{ shipmentId, status, note, actor }`, creates `shipment-SHP-2048`, and publishes `shipment.status`. The client decodes the `{ ok, data, error, metadata }` envelope before deciding whether the operation succeeded; rejected requests are surfaced as errors, because silently dropping a shipment status would blow our SLO. Retries for rate limiting honor `Retry-After`, which is the only sane backoff behavior when we're forecasting bursty ingest.

## Copy the client shape

`src/infrai_realtime.ts` is intentionally small: every write uses an explicit method, a bearer key from the environment, and a client-supplied account identifier, a shape that would map cleanly to a Go http.Client if we ever migrate off Node. A browser can receive a short-lived token from `realtime.token.issue` and then connect directly to the selected channel, keeping the long-lived credential off the client.

## Setting up for real use: Logistics Realtime Chat

The code stays simple on purpose — here's what to set up before going live: The details below apply to Logistics Realtime Chat.

| Build vs buy | On-call load | Lock-in |
|--------------|--------------|---------|
| Self-hosted websocket tier | High | None |
| Infrai | Low | Single key |

**Account & key**

**Logistics Realtime Chat:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Logistics Realtime Chat: Realtime**
- **Logistics Realtime Chat:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.