// tests/helpers/esc.js
const { By, Key } = require("selenium-webdriver");

/** Press ESC across common focus/contexts, plus a JS dispatch for libraries listening on document/window. */
async function pressEscRobust(driver, { retry = 2, waitMs = 150 } = {}) {
  // Ensure DOM is ready
  try {
    await driver.wait(
      async () =>
        (await driver.executeScript("return document.readyState")) ===
        "complete",
      10000
    );
  } catch {}

  // Give page focus
  try {
    const body = await driver.findElement(By.css("body"));
    await body.click();
  } catch {}

  const tryEscHere = async () => {
    // 1) Active element
    try {
      const active = await driver.switchTo().activeElement();
      await active.sendKeys(Key.ESCAPE);
    } catch {}

    // 2) <body>
    try {
      const body = await driver.findElement(By.css("body"));
      await body.sendKeys(Key.ESCAPE);
    } catch {}

    // 3) Actions API (document-level handlers)
    try {
      await driver.actions().keyDown(Key.ESCAPE).keyUp(Key.ESCAPE).perform();
    } catch {}

    // 4) JS dispatch for libs listening on document/window (not “trusted” but helps)
    try {
      await driver.executeScript(() => {
        const mk = (type) =>
          new KeyboardEvent(type, {
            key: "Escape",
            code: "Escape",
            keyCode: 27,
            which: 27,
            bubbles: true,
            cancelable: true,
          });
        document.dispatchEvent(mk("keydown"));
        document.dispatchEvent(mk("keyup"));
        window.dispatchEvent(mk("keydown"));
        window.dispatchEvent(mk("keyup"));
      });
    } catch {}
  };

  // Main document
  await tryEscHere();
  await driver.sleep(waitMs);

  // Try inside each iframe/frame
  try {
    const frames = await driver.findElements(By.css("iframe, frame"));
    for (const f of frames) {
      try {
        await driver.switchTo().frame(f);
        await tryEscHere();
        await driver.sleep(waitMs);
      } finally {
        await driver.switchTo().defaultContent();
      }
    }
  } catch {}

  // Retry in case the overlay attaches late
  for (let i = 0; i < retry; i++) {
    await driver.sleep(waitMs);
    await tryEscHere();
  }
}

/** Heuristic: detect common overlay frameworks (Vuetify, SweetAlert2) */
async function isOverlayOpen(driver) {
  try {
    return await driver.executeScript(() => {
      const sel = [
        // Vuetify overlays/dialogs
        ".v-overlay.v-overlay--active",
        ".v-dialog.v-overlay--active",
        // SweetAlert2
        ".swal2-container.swal2-top, .swal2-container.swal2-center, .swal2-container.swal2-bottom",
        // Generic modal patterns
        "[role='dialog']:not([aria-hidden='true'])",
        ".modal.show, .modal.is-active",
      ].join(",");
      return !!document.querySelector(sel);
    });
  } catch {
    return false;
  }
}

/** Clicks common close controls (X, Close, Cancel, Dismiss), with CSS + XPath, including Vuetify/SweetAlert2. */
async function clickAnyClose(driver) {
  const cssSelectors = [
    // SweetAlert2
    ".swal2-close, .swal2-cancel, .swal2-deny",
    // Accessible close buttons/icons
    "[aria-label='Close'], [title='Close'], [data-test='close']",
    // Bootstrap/Generic
    ".btn-close, .modal .btn-secondary, .modal .btn[data-dismiss='modal']",
    // Icon classes frequently used
    ".tabler-x, .mdi-close, .fa-times, .fa-xmark, .icon-x",
    // Vuetify icon buttons near dialog header
    ".v-dialog .v-btn--icon",
  ];

  // Try CSS selectors
  for (const sel of cssSelectors) {
    try {
      const els = await driver.findElements(By.css(sel));
      if (els.length) {
        await els[0].click();
        return true;
      }
    } catch {}
  }

  // Try text-based buttons with XPath
  const xpaths = [
    "//button[normalize-space()='Close']",
    "//button[normalize-space()='Cancel']",
    "//button[contains(., 'Dismiss')]",
    "//button[contains(., 'Got it')]",
    "//button[contains(., 'OK')]",
    // Sometimes dialogs use role=button on non-button elements
    "//*[@role='button' and (normalize-space()='Close' or normalize-space()='Cancel')]",
  ];

  for (const xp of xpaths) {
    try {
      const el = await driver.findElement(By.xpath(xp));
      await el.click();
      return true;
    } catch {}
  }

  // Try inside iframes as well
  try {
    const frames = await driver.findElements(By.css("iframe, frames"));
    for (const f of frames) {
      try {
        await driver.switchTo().frame(f);
        for (const sel of cssSelectors) {
          const els = await driver.findElements(By.css(sel));
          if (els.length) {
            await els[0].click();
            return true;
          }
        }
        for (const xp of xpaths) {
          try {
            const el = await driver.findElement(By.xpath(xp));
            await el.click();
            return true;
          } catch {}
        }
      } finally {
        await driver.switchTo().defaultContent();
      }
    }
  } catch {}

  return false;
}

async function closeByEscOrX(driver, { retries = 2, waitMs = 150 } = {}) {
  const before = await isOverlayOpen(driver);
  await pressEscRobust(driver, { retry: 1, waitMs });
  await driver.sleep(waitMs);
  const mid = await isOverlayOpen(driver);

  if (before && mid) {
    // ESC didn’t close it; try clicking close controls
    const clicked = await clickAnyClose(driver);
    if (clicked) return true;

    // One more small retry burst
    for (let i = 0; i < retries; i++) {
      await pressEscRobust(driver, { retry: 1, waitMs });
      await driver.sleep(waitMs);
      if (!(await isOverlayOpen(driver))) return true;
      if (await clickAnyClose(driver)) return true;
    }
    return !(await isOverlayOpen(driver));
  }

  return !mid; // true if no overlay left
}

module.exports = {
  pressEscRobust,
  isOverlayOpen,
  clickAnyClose,
  closeByEscOrX,
};
