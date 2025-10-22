// tests/helpers/openApplication.js
const { By, until } = require("selenium-webdriver");

async function waitForTable(driver, timeout = 30000) {
  await driver.wait(
    until.elementLocated(By.css(".application-table .v-table__wrapper table")),
    timeout
  );
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

  const eyeBtn = await driver.findElement(
    By.xpath(
      "(//div[contains(@class,'application-table')]//tbody[contains(@class,'v-data-table__tbody')]//tr[contains(@class,'v-data-table__tr')])[1]//button[.//i[contains(@class,'tabler-eye')]]"
    )
  );

  await driver.executeScript(
    "arguments[0].scrollIntoView({block:'center'});",
    eyeBtn
  );

  // --- ACTION: Click the eye button to OPEN the modal ---
  try {
    await eyeBtn.click();
  } catch {
    await driver.executeScript("arguments[0].click();", eyeBtn);
  }
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
