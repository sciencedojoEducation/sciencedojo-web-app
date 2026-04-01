import Stripe from "stripe";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
});

async function test() {
  console.log("Creating strict test account...");
  const account = await stripe.accounts.create({
    type: "express",
    country: "US", // Let's try US, it's often more stable in testing
    email: "test.tutor.123@example.com",
    capabilities: {
      transfers: { requested: true }
    },
    business_type: "individual",
  });
  console.log("Created account:", account.id);

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: "http://localhost:3000/dashboard/tutor/earnings",
    return_url: "http://localhost:3000/dashboard/tutor/earnings?stripe_status=success",
    type: "account_onboarding",
  });

  console.log("Onboarding URL:", accountLink.url);
}
test().catch(console.error);
