import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { env } from "@/config/env.js";
import { db } from "@/db/index.js";
import { users } from "@/db/schema/index.js";
import { normalizeEmailAddress } from "@/utils/contact-normalization.utils.js";

if (!env.SUPERADMIN_NAME || !env.SUPERADMIN_EMAIL || !env.SUPERADMIN_PASSWORD) {
  throw new Error(
    "SUPERADMIN_NAME, SUPERADMIN_EMAIL, and SUPERADMIN_PASSWORD are required.",
  );
}

const email = normalizeEmailAddress(env.SUPERADMIN_EMAIL);
const [existing] = await db
  .select()
  .from(users)
  .where(eq(users.email, email))
  .limit(1);
const passwordHash = await bcrypt.hash(env.SUPERADMIN_PASSWORD, 12);

if (existing) {
  await db
    .update(users)
    .set({
      fullName: env.SUPERADMIN_NAME,
      passwordHash,
      platformRole: "super_admin",
      active: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, existing.id));
  console.log(`Updated superadmin ${email}`);
} else {
  await db.insert(users).values({
    fullName: env.SUPERADMIN_NAME,
    email,
    passwordHash,
    platformRole: "super_admin",
    active: true,
    emailVerifiedAt: new Date(),
  });
  console.log(`Created superadmin ${email}`);
}
