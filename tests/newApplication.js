// tests/newApplication.js
const path = require("path");
const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

(async function run() {
  // ---------- Browser setup ----------
  const options = new chrome.Options().addArguments(
    "--disable-notifications",
    "--disable-popup-blocking",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--ignore-certificate-errors",
    "--remote-allow-origins=*"
  );

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  await driver
    .manage()
    .setTimeouts({ pageLoad: 60000, script: 30000, implicit: 0 });

  // ---------- Utilities ----------
  async function robustGet(url) {
    for (let i = 1; i <= 3; i++) {
      await driver.get(url);
      await driver.wait(async () => {
        const rs = await driver.executeScript("return document.readyState");
        return rs === "complete";
      }, 30000);
      const cur = await driver.getCurrentUrl();
      if (!/^data:|^about:blank|^chrome:\/\//i.test(cur)) return;
      if (i === 3) throw new Error(`Navigation stuck on ${cur}`);
      await driver.sleep(1000 * i);
    }
  }

  async function waitNoOverlay(timeout = 15000) {
    await driver.wait(async () => {
      const scrims = await driver.findElements(By.css(".v-overlay__scrim"));
      let any = false;
      for (const s of scrims) {
        try {
          if (await s.isDisplayed()) any = true;
        } catch {}
      }
      return !any;
    }, timeout);
  }

  // 🔒 NEW: bullet-proof modal killer
  async function closeSupportModalIfOpen(timeout = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      // Is a dialog visible?
      const dialogs = await driver.findElements(
        By.xpath(
          "//*[contains(@class,'v-overlay') and contains(@class,'active')]//*[contains(.,'Need Help?') or @role='dialog']"
        )
      );

      if (dialogs.length === 0) break;

      // Try the “Not Now” button
      let clicked = false;
      const notNowButtons = await driver.findElements(
        By.xpath(
          "//button[normalize-space(.)='Not Now' or contains(.,'Not Now')]"
        )
      );
      if (notNowButtons.length) {
        try {
          const btn = notNowButtons[0];
          await driver.executeScript(
            "arguments[0].scrollIntoView({block:'center'});",
            btn
          );
          await btn.click();
          clicked = true;
        } catch {}
      }

      // Fallback: click the dark scrim
      if (!clicked) {
        const scrims = await driver.findElements(By.css(".v-overlay__scrim"));
        if (scrims.length) {
          try {
            await scrims[0].click();
            clicked = true;
          } catch {}
        }
      }

      // Last resort: ESC
      if (!clicked) {
        try {
          const body = await driver.findElement(By.css("body"));
          await body.sendKeys(Key.ESCAPE);
        } catch {}
      }

      // Wait for overlay to go away; loop if it reappears
      try {
        await waitNoOverlay(8000);
      } catch {}
      await driver.sleep(150);
    }
  }

  async function clickButton(text, timeout = 30000) {
    await closeSupportModalIfOpen();
    await waitNoOverlay();
    const btn = await driver.wait(
      until.elementLocated(
        By.xpath(
          `//button[normalize-space(.)='${text}'] | //a[normalize-space(.)='${text}']`
        )
      ),
      timeout
    );
    await driver.wait(until.elementIsVisible(btn), 10000);
    await driver.wait(until.elementIsEnabled(btn), 10000);
    await btn.click();
    await closeSupportModalIfOpen();
  }
  async function clickVuetifyButtonLoose(text, timeout = 30000) {
    // normalize the text we’re looking for: lower-case, ignore '?'
    const norm = text.toLowerCase().replace(/\?/g, "");

    // Find a Vuetify button (button/div[@class~='v-btn']/[@role='button']) whose *visible text subtree*
    // contains our normalized phrase (case-insensitive, ignores '?', collapses spaces).
    const xp = `
    (
      //*[self::button or @role='button' or contains(@class,'v-btn')]
        [contains(
          translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ?', 'abcdefghijklmnopqrstuvwxyz '),
          '${norm}'
        )]
    )[1]
  `;

    // Wait for it to exist and be visible
    const el = await driver.wait(until.elementLocated(By.xpath(xp)), timeout);
    await driver.wait(until.elementIsVisible(el), 10000);

    // Scroll into view
    await driver.executeScript(
      "arguments[0].scrollIntoView({block:'center'});",
      el
    );

    // Try normal click; if intercepted, JS-click; if that fails, use Actions
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

  async function typeByLabel(labelText, value) {
    await closeSupportModalIfOpen();
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
    await input.clear();
    await input.sendKeys(value);
  }

  async function clickRadioByLabel(labelText) {
    await closeSupportModalIfOpen();
    const lbl = await driver.wait(
      until.elementLocated(
        By.xpath(`//label[normalize-space(.)='${labelText}']`)
      ),
      30000
    );
    await driver.wait(until.elementIsVisible(lbl), 10000);
    await lbl.click();
  }

  async function uploadFile(absolutePath) {
    const input = await driver.wait(
      until.elementLocated(By.css('input[type="file"]')),
      30000
    );
    await input.sendKeys(absolutePath);
  }

  async function waitEnabledByLabel(labelText, timeout = 30000) {
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
          !/disabled/.test(cls)
        );
      } catch {
        return false;
      }
    }, timeout);
    return trigger;
  }

  async function waitForFilePondComplete(timeout = 60000) {
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

  // Wait for a button (by visible text) to be enabled and return it
  async function waitEnabledButtonByText(text, timeout = 30000) {
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

  async function selectFromDropdown(labelText, optionText) {
    await closeSupportModalIfOpen();
    await waitNoOverlay();

    const trigger = await waitEnabledByLabel(labelText);
    await driver.executeScript(
      "arguments[0].scrollIntoView({block:'center'});",
      trigger
    );
    await driver.sleep(100);

    try {
      await trigger.click();
    } catch {
      await driver.executeScript("arguments[0].click();", trigger);
    }

    // Click option in the active Vuetify list overlay
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
      await option.click();
    } catch {
      // Fallback: type and ENTER in case it's an autocomplete
      try {
        const innerInput = await trigger.findElement(By.css("input"));
        await innerInput.clear();
        await innerInput.sendKeys(optionText, Key.ENTER);
      } catch {
        const body = await driver.findElement(By.css("body"));
        await body.sendKeys(optionText, Key.ENTER);
      }
    }

    await closeSupportModalIfOpen(); // <- if the modal pops again mid-flow
    await waitNoOverlay();
  }

  try {
    // ===== 1) Login =====
    await robustGet("https://dev.shabujglobal.org/");
    await closeSupportModalIfOpen();

    const email = await driver.wait(
      until.elementLocated(By.css('input[type="email"]')),
      30000
    );
    await email.sendKeys("qa.admin@shabujglobal.org"); // <-- change if needed

    const password = await driver.wait(
      until.elementLocated(By.css('input[type="password"]')),
      30000
    );
    await password.sendKeys("password123@sge."); // <-- change if needed

    await clickButton("Login");
    await driver.wait(until.urlContains("/dashboard"), 30000);

    // ===== 2) New Application =====
    await robustGet("https://dev.shabujglobal.org/application/new");
    await closeSupportModalIfOpen();
    await driver.wait(
      until.elementLocated(
        By.xpath("//label[normalize-space(.)='Country to Apply']")
      ),
      30000
    );

    // ===== 3) Step 1 — dependent dropdowns =====
    await selectFromDropdown("Country to Apply", "Cyprus");
    await selectFromDropdown("Country of Student Passport", "Angola");
    await selectFromDropdown("Intake", "September 2025"); // <-- include Intake here
    await selectFromDropdown("Course Type", "Post Graduate");
    await selectFromDropdown("University", "University of Limassol");
    await selectFromDropdown(
      "Course",
      "Master of Science in Business Intelligence and Data Analytics"
    );
    await clickButton("Next");

    // ===== 4) Step 2 — Academic Requirement =====
    await clickButton("Next");

    // ===== 5) Step 3 — New or Existing =====
    await clickVuetifyButtonLoose("Is This New Student?");

    // ===== 6) Step 4 — Upload then Next =====
    // ===== 6) Step 4 — Upload then Next =====
    const fileToUpload = path.resolve(__dirname, "fixtures", "signature.jpg"); // ensure this exists
    await uploadFile(fileToUpload);

    // 👇 Wait until FilePond has fully finished (no “Uploading”, shows “Upload complete”)
    await waitForFilePondComplete(60000);

    // 👇 Only now click "Next" (and only when enabled)
    const nextBtn = await waitEnabledButtonByText("Next", 20000);
    try {
      await nextBtn.click();
    } catch {
      await driver.executeScript("arguments[0].click();", nextBtn);
    }

    // ===== 7) Step 5 — Student details =====
    await typeByLabel("Student Passport No.", "P12345678");
    await typeByLabel("Date of birth", "1999-05-12");
    await typeByLabel("Student First Name", "Carolyn");
    await typeByLabel("Student Last Name", "Fox");
    await typeByLabel("Student WhatsApp Number", "193");
    await typeByLabel("Counsellor Number", "229");
    await typeByLabel("Enter Student Email", "carolyn.fox@mailinator.com");
    await typeByLabel("Counsellor Email", "counsellor@mailinator.com");
    await typeByLabel("Student Address", "221B Baker Street");
    await typeByLabel("Student City", "London");
    await selectFromDropdown("Student Country", "Andorra");
    await clickRadioByLabel("Male");
    await clickRadioByLabel("Yes");

    await clickButton("Submit");

    // ===== 8) Verify =====
    await driver.wait(
      until.elementLocated(
        By.xpath(
          "//*[contains(translate(., 'SUCCESS', 'success'), 'success') or contains(.,'submitted') or contains(.,'created')]"
        )
      ),
      30000
    );
    console.log("✅ New application created successfully.");
  } catch (e) {
    console.error("❌ Automation failed:", e);
  } finally {
    // await driver.sleep(4000);
    await driver.quit();
  }
})();
