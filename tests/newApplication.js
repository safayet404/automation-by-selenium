// tests/newApplication.js
const path = require("path");
const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

(async function run() {
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

  async function robustGet(url) {
    for (let i = 1; i <= 3; i++) {
      await driver.get(url);
      await driver.wait(
        async () =>
          (await driver.executeScript("return document.readyState")) ===
          "complete",
        30000
      );
      const cur = await driver.getCurrentUrl();
      if (!/^data:|^about:blank|^chrome:\/\//i.test(cur)) return;
      if (i === 3) throw new Error(`Navigation stuck on ${cur}`);
      await driver.sleep(1000 * i);
    }
  }

  // ---------- Overlay / Modal ----------
  async function overlayIsActive() {
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

  async function closeSupportModalIfOpen(maxMs = 15000) {
    const t0 = Date.now();
    while (Date.now() - t0 < maxMs) {
      if (!(await overlayIsActive())) return;

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
      if (!(await overlayIsActive())) return;
    }
  }

  async function waitNoOverlay(timeout = 15000) {
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

  async function clickButton(text, timeout = 30000) {
    await closeSupportModalIfOpen();
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

  async function clickVuetifyButtonLoose(text, timeout = 30000) {
    const norm = text.toLowerCase().replace(/\?/g, "");
    const xp = `
      (
        //*[self::button or @role='button' or contains(@class,'v-btn')]
          [contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ?','abcdefghijklmnopqrstuvwxyz '),'${norm}')]
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
    await driver.wait(async () => await input.isEnabled(), 10000);

    await driver.executeScript(
      "if(arguments[0].hasAttribute('readonly')) arguments[0].removeAttribute('readonly');",
      input
    );

    try {
      await input.click();
      await input.clear();
      await input.sendKeys(value);
    } catch {
      await driver.executeScript(
        `
        const el = arguments[0], val = arguments[1];
        const setter = Object.getOwnPropertyDescriptor(el.__proto__,'value')
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

  async function uploadFile(absPath) {
    const file = await driver.wait(
      until.elementLocated(By.css('input[type="file"]')),
      30000
    );
    await file.sendKeys(absPath);
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
          !/disabled|is-disabled/.test(cls)
        );
      } catch {
        return false;
      }
    }, timeout);
    return trigger;
  }

  async function selectFromDropdown(labelText, optionText) {
    await closeSupportModalIfOpen();
    await waitNoOverlay();

    const trigger = await waitEnabledByLabel(labelText);
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

    await closeSupportModalIfOpen();
    await waitNoOverlay();
  }

  try {
    await robustGet("https://dev.shabujglobal.org/");
    await closeSupportModalIfOpen();

    const email = await driver.wait(
      until.elementLocated(By.css('input[type="email"]')),
      30000
    );
    await email.sendKeys("qa.admin@shabujglobal.org");
    const password = await driver.wait(
      until.elementLocated(By.css('input[type="password"]')),
      30000
    );
    await password.sendKeys("password123@sge.");
    await clickButton("Login");
    await driver.wait(until.urlContains("/dashboard"), 30000);

    await robustGet("https://dev.shabujglobal.org/application/new");
    await closeSupportModalIfOpen();
    await driver.wait(
      until.elementLocated(
        By.xpath("//label[normalize-space(.)='Country to Apply']")
      ),
      30000
    );

    await selectFromDropdown("Country to Apply", "Cyprus");
    await selectFromDropdown("Country of Student Passport", "Angola");
    await selectFromDropdown("Intake", "September 2025");
    await selectFromDropdown("Course Type", "Post Graduate");
    await selectFromDropdown("University", "University of Limassol");
    await selectFromDropdown(
      "Course",
      "Master of Science in Business Intelligence and Data Analytics"
    );
    await clickButton("Next");

    await clickButton("Next");

    await clickVuetifyButtonLoose("Is This New Student?");

    const fileToUpload = path.resolve(__dirname, "fixtures", "signature.jpg");
    await uploadFile(fileToUpload);
    await waitForFilePondComplete(60000);

    const nextBtn = await waitEnabledButtonByText("Next", 20000);
    try {
      await nextBtn.click();
    } catch {
      await driver.executeScript("arguments[0].click();", nextBtn);
    }

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

    await driver.wait(
      until.elementLocated(
        By.xpath(
          "//*[contains(translate(.,'SUCCESS','success'),'success') or contains(.,'submitted') or contains(.,'created')]"
        )
      ),
      30000
    );
    console.log("✅ New application created successfully.");
  } catch (e) {
    console.error("❌ Automation failed:", e);
  } finally {
    await driver.quit();
  }
})();
