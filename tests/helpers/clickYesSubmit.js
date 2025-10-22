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

async function waitForOverlayIfAny(driver, timeout = 15000) {
  try {
    await driver.wait(
      until.elementLocated(
        By.xpath(
          "//*[contains(@class,'swal2-container')] | " +
            "//*[contains(@class,'v-overlay') and (contains(@class,'v-overlay--active') or contains(@class,'active'))] | " +
            "//*[@role='dialog' or @role='alertdialog']"
        )
      ),
      timeout
    );
  } catch {
    /* maybe inline; ignore */
  }
}

/**
 * Click a visible control by its text anywhere on the page (modal-safe).
 * @param {WebDriver} driver
 * @param {string} text           Visible text to match ("Confirm Assignment")
 * @param {number} [timeout=15000]
 */
async function clickByTextAnywhere(driver, text, timeout = 15000) {
  const needle = text.toLowerCase().trim();

  await waitForOverlayIfAny(driver, timeout);

  // 1) XPath strategy (handles Vuetify v-btns and nested span content)
  const xp =
    "//*[(self::button or self::a or @role='button' or contains(@class,'v-btn') or contains(@class,'btn')) " +
    "  and (contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), '" +
    needle +
    "') " +
    "    or contains(translate(@aria-label,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), '" +
    needle +
    "') " +
    "    or contains(translate(@title,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), '" +
    needle +
    "'))]";

  let el;
  try {
    el = await driver.wait(until.elementLocated(By.xpath(xp)), timeout);
    await driver.wait(until.elementIsVisible(el), 8000);
  } catch {
    // 2) JS fallback: scan text of common clickables
    const found = await driver.executeScript(function (label) {
      const lbl = label.toLowerCase().trim();
      const q = "button, [role=button], a, .v-btn, .btn";
      const nodes = Array.from(document.querySelectorAll(q));
      for (const n of nodes) {
        const txt = (n.textContent || "")
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim();
        const aria = (n.getAttribute("aria-label") || "").toLowerCase();
        const title = (n.getAttribute("title") || "").toLowerCase();
        if (txt.includes(lbl) || aria.includes(lbl) || title.includes(lbl)) {
          n.scrollIntoView({ block: "center" });
          n.click();
          return true;
        }
      }
      return false;
    }, needle);
    if (found) return true;
    throw new Error(`No clickable element containing text "${text}" found`);
  }

  // Click with fallbacks
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

  // Best-effort: give the dialog a beat to react/close
  try {
    await driver.wait(async () => {
      const overlays = await driver.findElements(
        By.css(".swal2-container, .v-overlay")
      );
      if (overlays.length === 0) return true;
      try {
        return !(await overlays[0].isDisplayed());
      } catch {
        return true;
      }
    }, 8000);
  } catch {
    /* ignore */
  }

  return true;
}

module.exports = { clickYesSubmit, clickByTextAnywhere };
