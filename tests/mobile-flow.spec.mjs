import { test, expect } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true
});

test("mobile practice flow reaches results", async ({ page }) => {
  await page.goto(process.env.BASE_URL || "http://127.0.0.1:8080/");
  await expect(page.locator("#appTitle")).toBeVisible();
  await page.locator("#participantInput").fill("MOBILE001");
  await page.getByRole("button", { name: "开始当前实验" }).click();
  await expect(page.locator("#blockTitle")).toBeVisible();
  await page.getByRole("button", { name: "继续" }).click();

  for (let step = 0; step < 24; step += 1) {
    await page.waitForFunction(() => {
      const thought = document.querySelector("#thoughtScreen")?.classList.contains("screen-active");
      const results = document.querySelector("#resultsScreen")?.classList.contains("screen-active");
      const left = document.querySelector("#leftResponseButton");
      return thought || results || (left && !left.disabled);
    }, null, { timeout: 6000 });

    const onResults = await page.locator("#resultsScreen.screen-active").count();
    if (onResults) break;

    const onThought = await page.locator("#thoughtScreen.screen-active").count();
    if (onThought) {
      await page.getByRole("button", { name: /专注任务/ }).click();
      continue;
    }

    await page.locator("#leftResponseButton:not([disabled])").click();
  }

  await expect(page.locator("#resultsScreen.screen-active #resultTitle")).toBeVisible();
  await expect(page.locator("#resultCards .result-card")).toHaveCount(4);
  await page.screenshot({ path: "tests/mobile-results.png", fullPage: true });
});
