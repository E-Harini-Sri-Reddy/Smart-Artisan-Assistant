/**
 * One-time migration helper for legacy User.role === "organization" records.
 *
 * Usage (from server/):
 *   node scripts/migrateLegacyOrgs.js
 *
 * What it does:
 * - For each user with role "organization" and an organizationName,
 *   creates an Organization + admin Membership if none exists.
 * - Does NOT delete data.
 * - Does NOT invent a shared "Default Organization".
 * - Does NOT attach unscoped Production/Payment documents automatically
 *   (those require manual review — see MIGRATION notes in final report).
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";
import Membership from "../models/Membership.js";
import { createOrganizationWithAdmin } from "../services/organizationService.js";

dotenv.config();

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is required");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.");

  const legacyOrgs = await User.find({
    role: "organization",
    organizationName: { $exists: true, $ne: "" },
  });

  let created = 0;
  let skipped = 0;

  for (const user of legacyOrgs) {
    const existing = await Membership.findOne({
      user: user._id,
      status: "active",
    });
    if (existing) {
      skipped += 1;
      continue;
    }
    await createOrganizationWithAdmin(user, user.organizationName);
    created += 1;
    console.log(`Migrated org for ${user.email}: ${user.organizationName}`);
  }

  console.log(`Done. created=${created} skipped=${skipped}`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
