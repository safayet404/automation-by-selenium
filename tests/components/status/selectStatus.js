const { By, until, Key } = require("selenium-webdriver");

async function setStatusAndSubmit(driver, text, timeout = 8000) {
  const input = await driver.wait(
    until.elementLocated(By.css("input[id^='app-autocomplete-Status-']")),
    timeout
  );
  const combo = await input.findElement(
    By.xpath("./ancestor::div[@role='combobox']")
  );
  await driver.executeScript(
    "arguments[0].scrollIntoView({block:'center'})",
    combo
  );
  await driver.executeScript("arguments[0].click()", combo);
  await driver.clear();
  await driver
    .actions({ async: true })
    .sendKeys(text)
    .pause(200)
    .sendKeys(Key.ARROW_DOWN)
    .sendKeys(Key.ENTER)
    .perform();

  const submit = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(.,'Submit')]")),
    timeout
  );
  await driver.executeScript("arguments[0].click()", submit);

  return await input.getAttribute("value");
}

module.exports = { setStatusAndSubmit };
