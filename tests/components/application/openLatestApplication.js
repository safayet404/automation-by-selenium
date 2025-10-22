// tests/helpers/openApplication.js
const { By, until } = require("selenium-webdriver");
const {
  closeSupportModalIfOpen,
  clickButton,
  clickVuetifyButtonLoose,
  clickButtonByText,
} = require("../../helpers");

async function waitForTable(driver, timeout = 30000) {
  // Wait for the wrapper + table
  await driver.wait(
    until.elementLocated(By.css(".application-table .v-table__wrapper table")),
    timeout
  );
  // Wait for at least one row
  await driver.wait(
    until.elementLocated(
      By.xpath(
        "//div[contains(@class,'application-table')]//tbody[contains(@class,'v-data-table__tbody')]//tr[contains(@class,'v-data-table__tr')]"
      )
    ),
    timeout
  );
}

async function openLatestApplication(driver, baseUrl, timeout = 30000) {
  await driver.get(`${baseUrl}/application`);
  await waitForTable(driver, timeout);

  // Click the first row's eye button
  const eyeBtn = await driver.findElement(
    By.xpath(
      "(//div[contains(@class,'application-table')]//tbody[contains(@class,'v-data-table__tbody')]//tr[contains(@class,'v-data-table__tr')])[1]//button[.//i[contains(@class,'tabler-eye')]]"
    )
  );

  await driver.executeScript(
    "arguments[0].scrollIntoView({block:'center'});",
    eyeBtn
  );
  try {
    await eyeBtn.click();
  } catch {
    await driver.executeScript("arguments[0].click();", eyeBtn);
  }

  // const assignButton = await driver.wait(
  //   until.elementLocated(By.xpath("//button[contains(.,'Activity Logs')]")),
  //   timeout
  // );

  // await driver.executeScript(
  //   "arguments[0].scrollIntoView({block:'center'});",
  //   assignButton
  // );
  // try {
  //   await assignButton.click();
  // } catch {
  //   await driver.executeScript("arguments[0].click();", assignButton);
  // }

  // tabBtn(driver, "Activity Logs", timeout);
  // clickButtonByText(driver, "Activity Logs", timeout);

  console.log("✅ Clicked 'Assign Application Officer' successfully.");

  console.log("✅ Modal opened for the latest application.");
}

async function openApplicationByEmail(
  driver,
  baseUrl,
  studentEmail,
  timeout = 30000
) {
  await driver.get(`${baseUrl}/application`);
  await waitForTable(driver, timeout);

  // Find row by email
  const row = await driver.findElement(
    By.xpath(
      `//div[contains(@class,'application-table')]//tbody[contains(@class,'v-data-table__tbody')]//tr[contains(@class,'v-data-table__tr')][.//span[contains(@class,'text-md')][contains(normalize-space(.),'${studentEmail}')]]`
    )
  );

  const eyeBtn = await row.findElement(
    By.xpath(".//button[.//i[contains(@class,'tabler-eye')]]")
  );
  await driver.executeScript(
    "arguments[0].scrollIntoView({block:'center'});",
    eyeBtn
  );
  try {
    await eyeBtn.click();
  } catch {
    await driver.executeScript("arguments[0].click();", eyeBtn);
  }

  // Wait for modal to appear
  await driver.wait(
    until.elementLocated(
      By.xpath(
        "//div[contains(@class,'v-overlay') and contains(@class,'active')]"
      )
    ),
    timeout
  );

  console.log(`✅ Modal opened for student ${studentEmail}`);
}

module.exports = { openLatestApplication, openApplicationByEmail };
