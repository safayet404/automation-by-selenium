const { By, until, Key } = require("selenium-webdriver");
const { closeSupportModalIfOpen, waitNoOverlay } = require("./overlay");
const { waitEnabledByLabel } = require("./elements");

async function typeByLabel(driver, labelText, value) {
  await closeSupportModalIfOpen(driver);
  const input = await driver.wait(
    until.elementLocated(
      By.xpath(`
        //label[normalize-space(.)='${labelText}']/following::input[1]
        | //label[normalize-space(.)='${labelText}']//input[1]
        | //label[normalize-space(.)='${labelText}']/following::textarea[1]
        | //label[normalize-space(.)='${labelText}']//textarea[1]
      `)
    ),
    30000
  );
  await driver.wait(until.elementIsVisible(input), 10000);
  await driver.wait(async () => await input.isEnabled(), 10000);

  // If readonly, remove it to allow typing (common in masked/date inputs)
  await driver.executeScript(
    "if(arguments[0].hasAttribute('readonly')) arguments[0].removeAttribute('readonly');",
    input
  );

  try {
    await input.click();
    await input.clear();
    await input.sendKeys(value);
  } catch {
    // Fallback to JS set + dispatch events
    await driver.executeScript(
      `
        const el = arguments[0], val = arguments[1];
        const setter =
          Object.getOwnPropertyDescriptor(el.__proto__,'value')
          || Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')
          || Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value');
        if (setter && setter.set) setter.set.call(el, val); else el.value = val;
        el.dispatchEvent(new Event('input',{bubbles:true}));
        el.dispatchEvent(new Event('change',{bubbles:true}));
        el.dispatchEvent(new Event('blur',{bubbles:true}));
      `,
      input,
      value
    );
  }
}

async function clickRadioByLabel(driver, labelText) {
  await closeSupportModalIfOpen(driver);
  const lbl = await driver.wait(
    until.elementLocated(
      By.xpath(`//label[normalize-space(.)='${labelText}']`)
    ),
    30000
  );
  await driver.wait(until.elementIsVisible(lbl), 10000);
  await lbl.click();
}

async function uploadFile(driver, absPath) {
  const file = await driver.wait(
    until.elementLocated(By.css('input[type="file"]')),
    30000
  );
  await file.sendKeys(absPath);
}

async function waitForFilePondComplete(driver, timeout = 60000) {
  await driver.wait(async () => {
    const uploading = await driver.findElements(
      By.xpath(
        "//*[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'uploading')]"
      )
    );
    const completed = await driver.findElements(
      By.xpath(
        "//*[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'upload complete')]"
      )
    );
    return uploading.length === 0 && completed.length >= 1;
  }, timeout);
}

async function selectFromDropdown(driver, labelText, optionText) {
  await closeSupportModalIfOpen(driver);
  await waitNoOverlay(driver);

  const trigger = await waitEnabledByLabel(driver, labelText);
  await driver.executeScript(
    "arguments[0].scrollIntoView({block:'center'});",
    trigger
  );
  await driver.sleep(120);
  try {
    await trigger.click();
  } catch {
    await driver.executeScript("arguments[0].click();", trigger);
  }

  // Try picking from open overlay list; fallback to type+ENTER
  try {
    const option = await driver.wait(
      until.elementLocated(
        By.xpath(`
          //div[contains(@class,'v-overlay') and contains(@class,'active')]
            //*[contains(@class,'v-list') or @role='listbox']
            //div[contains(@class,'v-list-item-title') and normalize-space(.)='${optionText}']
          | //div[contains(@class,'v-overlay') and contains(@class,'active')]
            //*[normalize-space(.)='${optionText}' and (contains(@class,'v-list-item-title') or self::li or self::div)]
        `)
      ),
      30000
    );
    await driver.wait(until.elementIsVisible(option), 10000);
    try {
      await option.click();
    } catch {
      await driver.executeScript("arguments[0].click();", option);
    }
  } catch {
    try {
      const inner = await trigger.findElement(By.css("input"));
      await inner.clear();
      await inner.sendKeys(optionText, Key.ENTER);
    } catch {
      const body = await driver.findElement(By.css("body"));
      await body.sendKeys(optionText, Key.ENTER);
    }
  }

  await closeSupportModalIfOpen(driver);
  await waitNoOverlay(driver);
}

module.exports = {
  typeByLabel,
  clickRadioByLabel,
  uploadFile,
  waitForFilePondComplete,
  selectFromDropdown,
};
