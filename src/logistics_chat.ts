import { RealtimeClient, shipmentEvent, type ShipmentEvent } from "./infrai_realtime.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("INFRAI_API_KEY is required");
const infrai = new RealtimeClient(key);

export async function publishShipmentUpdate(input: unknown) {
  const event: ShipmentEvent = shipmentEvent.parse(input);
  const channel = `shipment-${event.shipmentId}`;
  await infrai.createChannel(channel);
  return infrai.publish(channel, "shipment.status", event, event.shipmentId);
}

if (process.argv[1]?.endsWith("logistics_chat.ts")) {
  const result = await publishShipmentUpdate({ shipmentId: "SHP-2048", status: "exception", note: "Dock closed; driver rerouted", actor: "dispatch-cli" });
  console.log(JSON.stringify(result));
}

// API idiom: infrai.realtime.channel.create
