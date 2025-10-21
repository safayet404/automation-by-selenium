// tests/newApplication.js
const path = require("path");
const { By, until } = require("selenium-webdriver");
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
const { login } = require("./login");

(async function run() {
  const driver = await createDriver();

  try {
    // 1) Login using the SAME driver
    await login(driver, {
      baseUrl: "https://dev.shabujglobal.org/",
      email: "qa.admin@shabujglobal.org",
      password: "password123@sge.",
    });

    // 2) Go to New Application (you were missing this step)
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
