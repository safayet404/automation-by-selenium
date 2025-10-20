const { Builder, By, until } = require("selenium-webdriver");

async function loginExample() {
  const driver = await new Builder().forBrowser("chrome").build();

  try {
    // 1. SET A PAGE LOAD TIMEOUT (Crucial fix for data:,)
    // This gives the browser up to 30 seconds to fully load the page before the script proceeds.
    await driver.manage().setTimeouts({ pageLoad: 30000 });

    // Navigate to the URL
    await driver.get("https://dev.shabujglobal.org/");

    // Wait for the email field to be present
    const email = await driver.wait(
      until.elementLocated(By.css('input[type="email"]')),
      10000
    );
    await email.sendKeys("qa.admin@shabujglobal.org");

    // Wait for the password field to be present
    const password = await driver.wait(
      until.elementLocated(By.css('input[type="password"]')),
      10000
    );
    await password.sendKeys("password123@sge.");

    // No need for a static sleep, a good 'wait' is better.
    // However, keeping a small sleep here can sometimes help if the UI has dynamic rendering post-input.
    await driver.sleep(1000);

    // Wait for the Login button to be both located AND enabled before clicking
    const loginBtnLocator = By.xpath("//button[contains(.,'Login')]");

    const loginBtn = await driver.wait(
      until.elementLocated(loginBtnLocator),
      15000 // Time to locate the button
    );

    // Wait for the button to be clickable (a combination of elementIsEnabled and elementIsVisible)
    await driver.wait(until.elementIsVisible(loginBtn), 5000);
    await driver.wait(until.elementIsEnabled(loginBtn), 5000);

    await loginBtn.click();

    // Wait for the URL to change to the dashboard
    await driver.wait(until.urlContains("/dashboard"), 15000);

    console.log("✅ Logged in successfully");
  } catch (err) {
    // Log the error for debugging
    console.error("❌ Error during login process:", err.message);
  } finally {
    // Always quit the driver
    await driver.quit();
  }
}

loginExample();
