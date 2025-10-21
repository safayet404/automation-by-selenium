// tests/login.js
const { By, until } = require("selenium-webdriver");
const {
  robustGet,
  closeSupportModalIfOpen,
  clickButton,
} = require("./helpers");

async function login(
  driver,
  {
    baseUrl = "https://dev.shabujglobal.org/",
    email = "qa.admin@shabujglobal.org",
    password = "password123@sge.",
  } = {}
) {
  await robustGet(driver, baseUrl);
  await closeSupportModalIfOpen(driver);

  const emailEl = await driver.wait(
    until.elementLocated(By.css('input[type="email"]')),
    30000
  );
  await emailEl.clear();
  await emailEl.sendKeys(email);

  const passEl = await driver.wait(
    until.elementLocated(By.css('input[type="password"]')),
    30000
  );
  await passEl.clear();
  await passEl.sendKeys(password);

  await clickButton(driver, "Login");

  await driver.wait(until.urlContains("/dashboard"), 30000);
}

module.exports = { login };
