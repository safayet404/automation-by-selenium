// tests/helpers/autoCompleteSlow.js
const { By, until, Key } = require("selenium-webdriver");
const { waitNoOverlay, closeSupportModalIfOpen } = require("./overlay");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Slowly types into a Vuetify v-autocomplete located by its label, then selects a matching option.
 *
 * @param {WebDriver} driver
 * @param {string} labelText               Visible label, e.g. "Search Existing Student"
 * @param {string} textToType              e.g. "student@abc.com"
 * @param {object}  opts
 * @param {number}  opts.charDelayMs       Delay per character (default 120ms)
 * @param {number}  opts.pauseAfterTokensMs Pause after '@' or '.' (default 400ms)
 * @param {number}  opts.timeout           Max wait per step (default 30000)
 * @param {boolean} opts.verifyContains    Ensure input value includes text after select (default true)
 */
async function slowTypeAndSelectAutocomplete(
  driver,
  labelText,
  textToType,
  {
    charDelayMs = 120,
    pauseAfterTokensMs = 400,
    timeout = 30000,
    verifyContains = true,
  } = {}
) {
  await closeSupportModalIfOpen(driver);
  await waitNoOverlay(driver);

  // 1) Focus the combobox near the label
  const combo = await driver.wait(
    until.elementLocated(
      By.xpath(`//label[normalize-space(.)='${labelText}']
                /following::*[@role='combobox' or contains(@class,'v-autocomplete')][1]`)
    ),
    timeout
  );
  await driver.executeScript(
    "arguments[0].scrollIntoView({block:'center'});",
    combo
  );
  try {
    await combo.click();
  } catch {
    await driver.executeScript("arguments[0].click();", combo);
  }

  // 2) Find the real input (dynamic id begins with "app-autocomplete-<Label>-")
  const input = await driver.wait(
    until.elementLocated(
      By.xpath(`//input[
        starts-with(@id,'app-autocomplete-${labelText}-')
        and @type='text'
      ]`)
    ),
    timeout
  );
  await driver.wait(until.elementIsVisible(input), 10000);

  // 3) Clear then slow-type each character; pause after '@' or '.' to let results refresh
  try {
    await input.clear();
  } catch {}
  await input.sendKeys(Key.chord(Key.CONTROL, "a"), Key.DELETE);
  for (const ch of textToType.split("")) {
    await input.sendKeys(ch);
    if (ch === "@" || ch === ".") {
      await sleep(pauseAfterTokensMs);
    } else {
      await sleep(charDelayMs);
    }
  }

  // 4) Wait for the overlay list to show items that contain the text, then click the list item container
  let option;
  try {
    option = await driver.wait(
      until.elementLocated(
        By.xpath(`
          //div[contains(@class,'v-overlay') and contains(@class,'active')]
            //*[contains(@class,'v-list') or @role='listbox']
            //*[self::div or self::li][contains(normalize-space(.),'${textToType}')]
            /ancestor::*[contains(@class,'v-list-item')][1]
        `)
      ),
      8000
    );
    await driver.wait(until.elementIsVisible(option), 10000);
    try {
      await option.click();
    } catch {
      await driver.executeScript("arguments[0].click();", option);
    }
  } catch {
    // 5) Fallback: keyboard selection of first item
    await input.sendKeys(Key.ARROW_DOWN, Key.ENTER);
  }

  // 6) Verify commit (overlay closed + input shows the chosen value)
  await waitNoOverlay(driver);
  if (verifyContains) {
    await driver.wait(async () => {
      const v = await input.getAttribute("value");
      return v && v.toLowerCase().includes(textToType.toLowerCase());
    }, 8000);
  }

  // Blur to finalize in some Vuetify configs
  await driver.executeScript("arguments[0].blur();", input);
}

module.exports = { slowTypeAndSelectAutocomplete };
