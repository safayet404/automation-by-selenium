const { until, By } = require("selenium-webdriver");
const {
  clickButtonByText,
  slowTypeAndSelectAutocomplete,
  clickButton,
  clickByTextAnywhere,
  closeSupportModalIfOpen,
} = require("../../helpers");

async function assignAo(driver, baseUrl, timeout = 30000) {
  await closeSupportModalIfOpen(driver);
  await clickButtonByText(driver, "Assign Application Officer", timeout);
  await slowTypeAndSelectAutocomplete(
    driver,
    "Select Application Officer",
    "qa.ao@shabujglobal.org",
    { charDelayMs: 120, pauseAfterTokensMs: 500 }
  );
  await clickButton(driver, "Assign Officer");
  const dialog = await driver.wait(
    until.elementLocated(
      By.xpath(
        "//*[@role='dialog' or @role='alertdialog' or " +
          "contains(@class,'swal2-container') or contains(@class,'v-overlay')]"
      )
    ),
    10000
  );
  await driver.wait(until.elementIsVisible(dialog), 5000);

  await clickByTextAnywhere(driver, "Confirm Assignment");
}

module.exports = { assignAo };
