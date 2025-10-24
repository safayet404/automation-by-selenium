const { until, By } = require("selenium-webdriver");
const { clickByTextAnywhere } = require("../../helpers");

async function clickFirstCheckButton(driver) {
  // wait for the table
  const tableBody = await driver.wait(
    until.elementLocated(By.css(".v-data-table__tbody")),
    10000
  );

  // scroll the table wrapper fully to the right so nothing hides the icons
  await driver.executeScript(() => {
    const wrapper = document.querySelector(".v-table__wrapper");
    if (wrapper) wrapper.scrollLeft = wrapper.scrollWidth;
  });

  // wait for the button
  const checkIcon = await driver.wait(
    until.elementLocated(By.css("button.bg-success i.tabler-check")),
    5000
  );

  // make sure it’s in view
  await driver.executeScript(
    "arguments[0].scrollIntoView({block:'center'});",
    checkIcon
  );

  // click via JavaScript to bypass any overlay interception
  await driver.executeScript("arguments[0].click();", checkIcon);

  console.log("✅ Check icon clicked safely");
}
async function acceptApplication(driver, baseUrl, timeout = 30000) {
  await driver.get(`${baseUrl}/application-request`);

  clickFirstCheckButton(driver);

  await clickByTextAnywhere(driver, "Yes, accept it!");

  console.log("check icon clicked");
}

module.exports = { acceptApplication };
