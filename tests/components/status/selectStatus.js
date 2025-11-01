const { By, until, Key } = require("selenium-webdriver");

async function setStatusAndSubmit(driver, text, timeout = 8000) {
  // 1) Find the Status combobox via the input id prefix and open it
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
  await driver.executeScript("arguments[0].click()", combo); // open without interacting with input

  // 2) Type to the focused element (NOT the input) and select
  await driver
    .actions({ async: true })
    .sendKeys(Key.chord(Key.CONTROL, "")) // select-all (linux/windows)
    .sendKeys(text)
    .pause(200) // let it filter
    .sendKeys(Key.ARROW_DOWN)
    .sendKeys(Key.ENTER) // choose the highlighted option
    .perform();

  // 3) Submit (use JS click to avoid hit-area issues)
  const submit = await driver.wait(
    until.elementLocated(
      By.xpath("//div[@role='dialog']//button[contains(.,'Submit')]")
    ),
    timeout
  );
  await driver.executeScript("arguments[0].click()", submit);

  // (optional) return the selected value
  return await input.getAttribute("value");
}

module.exports = { setStatusAndSubmit };
