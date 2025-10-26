// tests/helpers/closeAnyDialog.js
const { By, until, Key } = require("selenium-webdriver");

async function waitForAnyDialog(driver, timeout = 15000) {
  return driver.wait(
    until.elementLocated(
      By.xpath(
        [
          // SweetAlert2 container
          "//*[contains(@class,'swal2-container')]",
          // Vuetify v-overlay / v-dialog (teleported)
          "//*[contains(@class,'v-overlay') and (contains(@class,'v-overlay--active') or contains(@class,'active'))]",
          // Generic roles
          "//*[@role='dialog' or @role='alertdialog']",
        ].join(" | ")
      )
    ),
    timeout
  );
}

/**
 * Close whatever dialog is open using the most common strategies:
 * 1) Click a "Close/Cancel/Done/OK" button inside the dialog
 * 2) Click the SweetAlert close button (.swal2-close) if present
 * 3) Click the scrim/backdrop
 * 4) Send Escape
 * 5) (fallback) Click near the top-right corner of the dialog card
 */
async function closeAnyDialog(driver, { timeout = 15000 } = {}) {
  const overlay = await waitForAnyDialog(driver, timeout);
  await driver.wait(until.elementIsVisible(overlay), 5000);
  await driver.sleep(150); // transition buffer

  // 1) Look for a textual action button inside the dialog
  const textButtonsXp =
    ".//*[self::button or @role='button' or contains(@class,'v-btn') or contains(@class,'btn')]" +
    "[contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'close') " +
    " or contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'cancel') " +
    " or contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'done') " +
    " or contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'ok')]";

  let candidate = (await overlay.findElements(By.xpath(textButtonsXp)))[0];
  if (candidate) {
    await driver.executeScript(
      "arguments[0].scrollIntoView({block:'center'});",
      candidate
    );
    try {
      await candidate.click();
    } catch {
      await driver.executeScript("arguments[0].click();", candidate);
    }
  } else {
    // 2) SweetAlert close “X”
    const saClose = (await overlay.findElements(By.css(".swal2-close")))[0];
    if (saClose) {
      try {
        await saClose.click();
      } catch {
        await driver.executeScript("arguments[0].click();", saClose);
      }
    } else {
      // 3) Click scrim/backdrop (Vuetify)
      const scrim = (await driver.findElements(By.css(".v-overlay__scrim")))[0];
      if (scrim) {
        try {
          await scrim.click();
        } catch {
          await driver.executeScript("arguments[0].click();", scrim);
        }
      } else {
        // 4) ESC key
        try {
          const body = await driver.findElement(By.css("body"));
          await body.sendKeys(Key.ESCAPE);
        } catch {}

        // 5) As a last resort: click near top-right of the dialog card
        try {
          const card = (
            await overlay.findElements(By.css(".v-card, .swal2-popup"))
          )[0];
          if (card) {
            await driver
              .actions({ bridge: true })
              .move({ origin: card, x: 5, y: 5 }) // move inside card firsts
              .move({
                origin: card,
                x: (await card.getRect()).width - 10,
                y: 10,
              }) // top-right-ish
              .press()
              .release()
              .perform();
          }
        } catch {}
      }
    }
  }

  // Wait for the dialog to go away
  try {
    await driver.wait(async () => {
      const still = await driver.findElements(
        By.xpath(
          "//*[contains(@class,'swal2-container') or contains(@class,'v-overlay')]"
        )
      );
      if (!still.length) return true;
      try {
        return !(await still[0].isDisplayed());
      } catch {
        return true;
      }
    }, 7000);
  } catch {}
}

module.exports = { closeAnyDialog };
