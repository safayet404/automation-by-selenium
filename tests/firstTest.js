const { Builder, By, until } = require("selenium-webdriver");

async function loginExample() {
  const driver = await new Builder().forBrowser("chrome").build();

  try {
    await driver.get("https://dev.shabujglobal.org/");

    const email = await driver.wait(
      until.elementLocated(By.css('input[type="email"]')),
      10000
    );
    await email.sendKeys("qa.admin@shabujglobal.org");

    const password = await driver.wait(
      until.elementLocated(By.css('input[type="password"]')),
      10000
    );
    await password.sendKeys("password123@sge.");

    await driver.sleep(2000);

    const loginBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(.,'Login')]")),
      15000
    );

    await driver.wait(until.elementIsEnabled(loginBtn), 5000);
    await loginBtn.click();

    await driver.wait(until.urlContains("/dashboard"), 15000);

    console.log("✅ Logged in successfully");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await driver.quit();
  }
}

loginExample();
