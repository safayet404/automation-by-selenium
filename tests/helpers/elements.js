const { By, until } = require("selenium-webdriver");
const { closeSupportModalIfOpen } = require("./overlay");

async function clickButton(driver, text, timeout = 30000) {
  await closeSupportModalIfOpen(driver);

  const btn = await driver.wait(
    until.elementLocated(
      By.xpath(
        `(//button[.//span[normalize-space(.)='${text}'] or normalize-space(.)='${text}'] | //a[normalize-space(.)='${text}'])[1]`
      )
    ),
    timeout
  );
  await driver.wait(until.elementIsVisible(btn), 10000);
  await driver.wait(until.elementIsEnabled(btn), 10000);
  try {
    await btn.click();
  } catch {
    await driver.executeScript("arguments[0].click();", btn);
  }
}

async function clickButtonByText(driver, btnText, timeout) {
  const assignButton = await driver.wait(
    until.elementLocated(By.xpath(`//button[contains(.,'${btnText}')]`)),
    timeout
  );

  await driver.executeScript(
    "arguments[0].scrollIntoView({block:'center'});",
    assignButton
  );
  try {
    await assignButton.click();
  } catch {
    await driver.executeScript("arguments[0].click();", assignButton);
  }
}

async function clickVuetifyButtonLoose(driver, text, timeout = 30000) {
  const norm = text.toLowerCase().replace(/\?/g, "");
  const xp = `
    (
      //*[self::button or @role='button' or contains(@class,'v-btn')]
        [contains(translate(normalize-space(.),
          'ABCDEFGHIJKLMNOPQRSTUVWXYZ?','abcdefghijklmnopqrstuvwxyz '),'${norm}')]
    )[1]
  `;
  const el = await driver.wait(until.elementLocated(By.xpath(xp)), timeout);
  await driver.wait(until.elementIsVisible(el), 10000);
  await driver.executeScript(
    "arguments[0].scrollIntoView({block:'center'});",
    el
  );
  try {
    await el.click();
  } catch {
    try {
      await driver.executeScript("arguments[0].click();", el);
    } catch {
      await driver
        .actions({ bridge: true })
        .move({ origin: el })
        .press()
        .release()
        .perform();
    }
  }
}

async function waitEnabledButtonByText(driver, text, timeout = 30000) {
  const btn = await driver.wait(
    until.elementLocated(
      By.xpath(
        `(//button[.//span[normalize-space(.)='${text}'] or normalize-space(.)='${text}'])[1]`
      )
    ),
    timeout
  );
  await driver.wait(until.elementIsVisible(btn), 10000);
  await driver.wait(async () => await btn.isEnabled(), timeout);
  return btn;
}

async function waitEnabledByLabel(driver, labelText, timeout = 30000) {
  const trigger = await driver.wait(
    until.elementLocated(
      By.xpath(`
        //label[normalize-space(.)='${labelText}']
          /following::*[self::div or self::button or self::input or self::span][1]
      `)
    ),
    timeout
  );

  await driver.wait(async () => {
    try {
      const dis = await trigger.getAttribute("disabled");
      const aria = await trigger.getAttribute("aria-disabled");
      const cls = (await trigger.getAttribute("class")) || "";
      return (
        (!dis || dis === "false") &&
        (!aria || aria === "false") &&
        !/disabled|is-disabled/.test(cls)
      );
    } catch {
      return false;
    }
  }, timeout);

  return trigger;
}

module.exports = {
  clickButton,
  clickVuetifyButtonLoose,
  waitEnabledButtonByText,
  waitEnabledByLabel,
  clickButtonByText,
};
