// tests/helpers/supportModal.js
const { By, until } = require("selenium-webdriver");

/**
 * Dismiss the random Support modal if it appears.
 * Returns true if it was found and dismissed, false otherwise.
 */
async function dismissSupportModalIfPresent(
  driver,
  {
    appearTimeoutMs = 800, // small, because it opens randomly
    disappearTimeoutMs = 4000, // time to wait for it to vanish after click
  } = {}
) {
  // Candidate locators (robust and readable first)
  const modalRootCss = [
    // Common overlay containers (Vuetify / generic)
    ".v-overlay.v-overlay--active",
    ".v-dialog.v-overlay--active",
    ".modal.show",
    "[role='dialog']:not([aria-hidden='true'])",
  ].join(",");

  const notNowXPaths = [
    // Exact text
    "//button[normalize-space()='Not Now']",
    // Text contains (in case of extra spaces/icons)
    "//button[contains(normalize-space(.), 'Not Now')]",
    // Role=button on non-button elements
    "//*[@role='button' and contains(normalize-space(.), 'Not Now')]",
  ];

  try {
    // Quick probe: if no overlay root appears soon, bail fast
    await driver.wait(async () => {
      const overlays = await driver.findElements(By.css(modalRootCss));
      return overlays.length > 0;
    }, appearTimeoutMs);
  } catch {
    return false; // nothing popped
  }

  // Try to find a "Not Now" control and click it
  for (const xp of notNowXPaths) {
    const els = await driver.findElements(By.xpath(xp));
    if (!els.length) continue;

    const btn = els[0];

    // Ensure it's visible and clickable
    try {
      await driver.wait(until.elementIsVisible(btn), 1500);
    } catch {}

    // Try normal click → JS click → Actions click
    let clicked = false;
    try {
      await btn.click();
      clicked = true;
    } catch {
      try {
        await driver.executeScript(
          "arguments[0].scrollIntoView({block:'center'});",
          btn
        );
        await driver.executeScript("arguments[0].click();", btn);
        clicked = true;
      } catch {
        try {
          await driver
            .actions({ bridge: true })
            .move({ origin: btn })
            .click()
            .perform();
          clicked = true;
        } catch {}
      }
    }

    if (clicked) {
      // Wait for overlay to disappear
      try {
        await driver.wait(async () => {
          const overlays = await driver.findElements(By.css(modalRootCss));
          // consider it closed when no overlay OR overlay not displayed
          if (!overlays.length) return true;
          const displayed = await Promise.all(
            overlays.map((o) => o.isDisplayed().catch(() => false))
          );
          return !displayed.some(Boolean);
        }, disappearTimeoutMs);
      } catch {
        /* even if wait times out, proceed */
      }
      return true;
    }
  }

  // If we saw an overlay but couldn't find Not Now, ignore quietly
  return false;
}

/**
 * Wrapper to run a step with guard that auto-dismisses the Support modal
 * before and after the step (because the popup can appear randomly).
 */
async function withSupportGuard(driver, stepFn) {
  // 1) pre-step guard
  try {
    await dismissSupportModalIfPresent(driver);
  } catch {}
  // 2) run the step
  const result = await stepFn();
  // 3) post-step guard
  try {
    await dismissSupportModalIfPresent(driver);
  } catch {}
  return result;
}

module.exports = {
  dismissSupportModalIfPresent,
  withSupportGuard,
};
