const {
  clickButtonByText,
  clickButton,
  selectFromDropdown,
} = require("../../helpers");
const { selectStatus } = require("../status/selectStatus");

async function statusChange(driver, timeout = 30000) {
  await clickButtonByText(driver, "Status", timeout);
  await clickButton(driver, "Change Current Status");

  //   await selectStatus(driver, "Application Submitted");
  await selectFromDropdown(driver, "Status", "Application Submitted");
}

module.exports = {
  statusChange,
};
