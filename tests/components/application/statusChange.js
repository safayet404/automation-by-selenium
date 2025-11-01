const { By, until } = require("selenium-webdriver");
const {
  clickButtonByText,
  clickButton,
  selectFromDropdown,
} = require("../../helpers");
const { setStatus } = require("../status/selectStatus");

async function statusChange(driver, timeout = 30000) {
  await clickButtonByText(driver, "Status", timeout);
  await clickButton(driver, "Change Current Status");

  await setStatus(driver, "Application Submitted");
}

module.exports = {
  statusChange,
};
