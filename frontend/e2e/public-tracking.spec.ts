import { expect, test } from "@playwright/test";

test("shows a safe invalid tracking state", async ({ page }) => {
  await page.route("**/api/v1/public/tracking/invalid-token", (route) =>
    route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "NOT_FOUND", message: "Tracking link not found." },
      }),
    }),
  );
  await page.goto("/track/invalid-token");
  await expect(
    page.getByRole("heading", { name: "Tracking link unavailable" }),
  ).toBeVisible();
});
