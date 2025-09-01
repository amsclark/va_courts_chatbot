test.describe("Recording 9/1/2025 at 2:00:21 PM", () => {
  test("tests Recording 9/1/2025 at 2:00:21 PM", async ({ page }) => {
    await page.setViewportSize({
          width: 1264,
          height: 599
        })
    await page.goto("chrome://new-tab-page/");
    await page.goto("https://clarkmanagementconsulting.com/va_testing.html");
    await page.locator("df-messenger").click()
    await page.locator("df-messenger").click()
    await page.locator("df-messenger").type("my boyfriend hit me");
    page.keyboard.down("{Enter}");
    await page.locator("df-messenger").click()
  });
});
