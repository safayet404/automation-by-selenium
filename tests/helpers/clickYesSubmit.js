// tests/helpers/clickYesSubmit.js
const { By, until } = require("selenium-webdriver");

async function clickYesSubmit(driver, { timeout = 15000 } = {}) {
  let modal;
  try {
    modal = await driver.wait(
      until.elementLocated(
        By.css(".swal2-container.swal2-center, .swal2-container")
      ),
      timeout
    );
    await driver.wait(until.elementIsVisible(modal), 5000);
  } catch {
    modal = await driver.wait(
      until.elementLocated(
        By.xpath(`
          //*[contains(@class,'v-overlay') or contains(@class,'dialog') or contains(@class,'modal')]
        `)
      ),
      timeout
    );
    await driver.wait(until.elementIsVisible(modal), 5000);
  }

  let btn;
  try {
    btn = await modal.findElement(By.css(".swal2-actions .swal2-confirm"));
  } catch {}

  if (!btn) {
    const xp = `
      .//*[self::button or @role='button' or contains(@class,'btn')]
        [contains(translate(normalize-space(.),
          'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),
          'yes, submit it')]
      | .//button[.//span[contains(translate(normalize-space(.),
          'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),
          'yes, submit it')]]
    `;
    btn = await modal.findElement(By.xpath(xp));
  }

  await driver.wait(until.elementIsVisible(btn), 5000);

  try {
    await driver.wait(async () => {
      const dis = await btn.getAttribute("disabled");
      const aria = await btn.getAttribute("aria-disabled");
      const cls = (await btn.getAttribute("class")) || "";
      return (
        (!dis || dis === "false") &&
        (!aria || aria === "false") &&
        !/disabled/.test(cls)
      );
    }, 8000);
  } catch {}

  await driver.executeScript(
    "arguments[0].scrollIntoView({block:'center'});",
    btn
  );

  try {
    await btn.click();
  } catch {
    try {
      await driver.executeScript("arguments[0].click();", btn);
    } catch {
      await driver
        .actions({ bridge: true })
        .move({ origin: btn })
        .press()
        .release()
        .perform();
    }
  }

  try {
    await driver.wait(async () => {
      const containers = await driver.findElements(By.css(".swal2-container"));
      if (containers.length === 0) return true;
      try {
        return !(await containers[0].isDisplayed());
      } catch {
        return true;
      }
    }, 8000);
  } catch {}
}

module.exports = { clickYesSubmit };
