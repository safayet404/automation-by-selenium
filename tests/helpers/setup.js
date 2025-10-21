const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

async function createDriver() {
  const options = new chrome.Options().addArguments(
    "--disable-notifications",
    "--disable-popup-blocking",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--ignore-certificate-errors",
    "--remote-allow-origins=*"
  );

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  await driver.manage().setTimeouts({
    pageLoad: 60000,
    script: 30000,
    implicit: 0,
  });

  return driver;
}

module.exports = { createDriver };
