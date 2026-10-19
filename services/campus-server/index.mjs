import { createCampusServer } from "./server.mjs";

const appOrigin = process.env.CAMPUS_APP_ORIGIN;
const serviceKey = process.env.CAMPUS_SERVICE_KEY;
if (!appOrigin || !serviceKey || serviceKey.length < 32)
  throw new Error(
    "Set CAMPUS_APP_ORIGIN and a 32+ character CAMPUS_SERVICE_KEY",
  );
const url = new URL(appOrigin);
if (
  url.protocol !== "https:" &&
  !["localhost", "127.0.0.1"].includes(url.hostname)
)
  throw new Error("HTTPS required outside loopback");
async function request(operation, value, connection) {
  const response = await fetch(new URL("/api/campus/service", appOrigin), {
    method: "POST",
    headers: {
      authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ operation, value, ...(connection?{connection}:{}) }),
    signal: AbortSignal.timeout(operation==="depart"?2000:5000),
  });
  if (!response.ok) throw new Error("Campus authorization unavailable");
  return response.json();
}
const campus = await createCampusServer({
  port: Number(process.env.PORT || 2567),
  host: process.env.CAMPUS_BIND_HOST || "127.0.0.1",
  origin: url.origin,
  serviceKey,
  verify: (value) => request("redeem", value),
  refresh: (value) => request("check", value),
  departed:(value,connection)=>request("depart",value,connection),
});
console.log(
  "Campus server listening; room capacity 10. No learner data logged.",
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, async () => {
    await campus.close();
    process.exit(0);
  });
