const { By, until } = require("selenium-webdriver");

async function selectStatus(driver, statusText) {
  // 1. Click the dropdown field
  const dropdown = await driver.findElement(
    By.xpath("//label[text()='Status']/following::input[1]")
  );
  await dropdown.click();

  // 2. Click the option containing text
  await driver.wait(
    until.elementLocated(
      By.xpath(
        `//div[contains(@role,'option') or contains(@class,'v-list-item')]//*[contains(text(),'${statusText}')]`
      )
    ),
    5000
  );
  const option = await driver.findElement(
    By.xpath(
      `//div[contains(@role,'option') or contains(@class,'v-list-item')]//*[contains(text(),'${statusText}')]`
    )
  );
  await option.click();

  // 3. Read selected value
  const value = await dropdown.getAttribute("value");
  console.log("Selected status:", value);
  return value;
}

module.exports = {
  selectStatus,
};
