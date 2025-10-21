const { By } = require("selenium-webdriver");

async function overlayIsActive(driver) {
  const overlays = await driver.findElements(
    By.css(".v-overlay.v-overlay--active, .v-overlay--active")
  );
  for (const o of overlays) {
    try {
      if (await o.isDisplayed()) return true;
    } catch {}
  }
  return false;
}

async function waitNoOverlay(driver, timeout = 15000) {
  await driver.wait(async () => {
    const scrims = await driver.findElements(By.css(".v-overlay__scrim"));
    for (const s of scrims) {
      try {
        if (await s.isDisplayed()) return false;
      } catch {}
    }
    return true;
  }, timeout);
}

async function closeSupportModalIfOpen(driver, maxMs = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    if (!(await overlayIsActive(driver))) return;

    const notNow = await driver.findElements(
      By.xpath(`
        //div[contains(@class,'v-overlay') and contains(@class,'v-overlay--active')]
          //*[self::button or @role='button']
          [contains(translate(normalize-space(.),
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'not now')]
      `)
    );

    if (notNow.length) {
      const btn = notNow[0];
      await driver.executeScript(
        "arguments[0].scrollIntoView({block:'center'});",
        btn
      );
      await driver.executeScript(
        `
          const el = arguments[0];
          el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
        `,
        btn
      );
    }

    await driver.sleep(250);
    if (!(await overlayIsActive(driver))) return;
  }
}

module.exports = { overlayIsActive, waitNoOverlay, closeSupportModalIfOpen };
