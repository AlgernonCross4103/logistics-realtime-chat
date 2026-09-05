import assert from "node:assert/strict";
import { shipmentEvent } from "../src/infrai_realtime.ts";

const accepted = shipmentEvent.parse({ shipmentId: "SHP-1", status: "delivered", note: "Signed at bay 4", actor: "driver-7" });
assert.equal(accepted.status, "delivered");
assert.throws(() => shipmentEvent.parse({ shipmentId: "SHP-1", status: "lost", note: "?", actor: "driver-7" }));
console.log("shipment event boundary: pass");
