const path = require("path");
const {
  createDriver,
  robustGet,
  closeSupportModalIfOpen,
  clickButton,
  clickVuetifyButtonLoose,
  waitForFilePondComplete,
  waitEnabledButtonByText,
  typeByLabel,
  clickRadioByLabel,
  uploadFile,
  selectFromDropdown,
} = require("./helpers");

(async function run() {
  const driver = await createDriver();

  try {
    // 1) Login
    await robustGet(driver, "https://dev.shabujglobal.org/");
    await closeSupportModalIfOpen(driver);

    const { By, until } = require("selenium-webdriver");
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

    await clickButton(driver, "Login");
    await driver.wait(until.urlContains("/dashboard"), 30000);

    // 2) New Application Page
    await robustGet(driver, "https://dev.shabujglobal.org/application/new");
    await closeSupportModalIfOpen(driver);

    await driver.wait(
      until.elementLocated(
        By.xpath("//label[normalize-space(.)='Country to Apply']")
      ),
      30000
    );

    // 3) Selections
    await selectFromDropdown(driver, "Country to Apply", "Cyprus");
    await selectFromDropdown(driver, "Country of Student Passport", "Angola");
    await selectFromDropdown(driver, "Intake", "September 2025");
    await selectFromDropdown(driver, "Course Type", "Post Graduate");
    await selectFromDropdown(driver, "University", "University of Limassol");
    await selectFromDropdown(
      driver,
      "Course",
      "Master of Science in Business Intelligence and Data Analytics"
    );

    await clickButton(driver, "Next");
    await clickButton(driver, "Next");

    await clickVuetifyButtonLoose(driver, "Is This New Student?");

    // 4) File upload
    const fileToUpload = path.resolve(__dirname, "fixtures", "signature.jpg");
    await uploadFile(driver, fileToUpload);
    await waitForFilePondComplete(driver, 60000);

    const nextBtn = await waitEnabledButtonByText(driver, "Next", 20000);
    try {
      await nextBtn.click();
    } catch {
      await driver.executeScript("arguments[0].click();", nextBtn);
    }

    // 5) Form fill
    await typeByLabel(driver, "Student Passport No.", "P12345678");
    await typeByLabel(driver, "Date of birth", "1999-05-12");
    await typeByLabel(driver, "Student First Name", "Carolyn");
    await typeByLabel(driver, "Student Last Name", "Fox");
    await typeByLabel(driver, "Student WhatsApp Number", "193");
    await typeByLabel(driver, "Counsellor Number", "229");
    await typeByLabel(
      driver,
      "Enter Student Email",
      "carolyn.fox@mailinator.com"
    );
    await typeByLabel(driver, "Counsellor Email", "counsellor@mailinator.com");
    await typeByLabel(driver, "Student Address", "221B Baker Street");
    await typeByLabel(driver, "Student City", "London");
    await selectFromDropdown(driver, "Student Country", "Andorra");
    await clickRadioByLabel(driver, "Male");
    await clickRadioByLabel(driver, "Yes");

    await clickButton(driver, "Submit");

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
