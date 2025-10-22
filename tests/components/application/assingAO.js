const {
  clickButtonByText,
  slowTypeAndSelectAutocomplete,
  clickButton,
  clickModalButton,
  clickByTextAnywhere,
} = require("../../helpers");

async function assignAo(driver, baseUrl, timeout = 30000) {
  clickButtonByText(driver, "Assign Application Officer", timeout);
  await slowTypeAndSelectAutocomplete(
    driver,
    "Select Application Officer",
    "qa.ao@shabujglobal.org",
    { charDelayMs: 120, pauseAfterTokensMs: 500 }
  );

  clickButton(driver, "Assign Officer");
  clickByTextAnywhere(driver, "Confirm Assignment");
  //   clickModalButton(driver, "Confirm Assignment");
}

module.exports = { assignAo };
