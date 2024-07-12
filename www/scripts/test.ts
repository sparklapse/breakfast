import { nanoid } from "nanoid";
import { createHmac } from "node:crypto";

const nonce = nanoid();
const scopes = ["remote"];

const payload = {
  nonce,
  scopes,
};

const secret = "secret";
const payloadRaw = btoa(JSON.stringify(payload));
const hmac = createHmac("sha256", secret);
hmac.update(payloadRaw);
const hash = hmac.digest("hex");

const token = `${payloadRaw}.${hash}`;

console.log("Payload: ", payload);
console.log("Token: ", token);
