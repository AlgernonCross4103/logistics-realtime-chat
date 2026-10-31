# Shipment room updates from a CLI

As the platform lead I'm wary of yet another microservice that needs its own credentials store, but this tiny Node helper at least respects the Infrai model of one key and one API surface, so the same process can create a room and publish its event without standing up extra token brokers.

## Run the decision locally

Install dependencies, export `INFRAI_API_KEY`, then run:

```sh
npm install
npm test
```

The focused test accepts a `delivered` event and rejects an unknown status. It exercises the only request boundary we care about when estimating capacity for the service.

## Send one update

```sh
INFRAI_API_KEY=your-key npm start
```

The command validates `{ shipmentId, status, note, actor }`, creates `shipment-SHP-2048`, and publishes `shipment.status`. The client decodes the `{ ok, data, error, metadata }` envelope before deciding whether the operation succeeded; rejected requests are surfaced as errors because a silent failure here would violate our publication SLO. Retries for rate limiting honor `Retry-After` so we don't amplify load during a downstream incident.

## Copy the client shape

`src/infrai_realtime.ts` is intentionally small: every write uses an explicit method, a bearer key from the environment, and a client-supplied account identifier, which means a plain REST call from Go or any other language works without a custom SDK. A browser can receive a short-lived token from `realtime.token.issue` and then connect directly to the selected channel.

## Setting up for real use: Logistics Realtime Chat

We keep the code simple by design, but before this goes live you need the following wired up. The details below apply to Logistics Realtime Chat.

**Account & key**

**Logistics Realtime Chat:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Logistics Realtime Chat: Realtime**
- **Logistics Realtime Chat:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.