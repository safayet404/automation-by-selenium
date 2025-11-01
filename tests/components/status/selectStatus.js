// simple-status.js
const { By, until, Key } = require("selenium-webdriver");

async function setStatus(driver, text, timeout = 8000) {
  // Find the Status input, then its combobox container
  const input = await driver.wait(
    until.elementLocated(By.css("input[id^='app-autocomplete-Status-']")),
    timeout
  );
  const combo = await input.findElement(
    By.xpath("./ancestor::div[@role='combobox']")
  );

  // Bring into view and open the combobox (JS click avoids 'not interactable')
  await driver.executeScript(
    "arguments[0].scrollIntoView({block:'center'})",
    combo
  );
  await driver.executeScript("arguments[0].click()", combo);

  // Wait until it’s actually open (aria-expanded=true)
  await driver
    .wait(
      async () => (await combo.getAttribute("aria-expanded")) === "true",
      3000
    )
    .catch(() => {});

  // Type with keyboard to the focused element and confirm
  await driver
    .actions({ async: true })
    .pause(100)
    .sendKeys(text)
    .pause(150)
    .sendKeys(Key.ENTER)
    .perform();

  // Read back the selected value from the input
  return await input.getAttribute("value");
}

module.exports = { setStatus };

/* Usage:
const selected = await setStatus(driver, "Application Submitted");
console.log("Selected:", selected);
*/
