const { until, By } = require("selenium-webdriver");
const {
  createDriver,
  robustGet,
  closeSupportModalIfOpen,
  selectFromDropdown,
  clickButton,
  clickVuetifyButtonLoose,
} = require("./helpers");
const { login } = require("./login");
const { slowTypeAndSelectAutocomplete } = require("./helpers/autoCompleteSlow");
const { clickYesSubmit } = require("./helpers/clickYesSubmit");

const existingStudent = async () => {
  const driver = await createDriver();
  try {
    await login(driver, {
      baseUrl: "https://dev.shabujglobal.org/",
      email: "qa.admin@shabujglobal.org",
      password: "password123@sge.",
    });

    await robustGet(driver, "https://dev.shabujglobal.org/application/new");
    await closeSupportModalIfOpen(driver);

    await driver.wait(
      until.elementLocated(
        By.xpath("//label[normalize-space(.)='Country to Apply']")
      ),
      30000
    );

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
    await clickButton(driver, "English Requirement");
    await clickButton(driver, "Next");

    await clickVuetifyButtonLoose(driver, "Is This Existing Student?");

    await slowTypeAndSelectAutocomplete(
      driver,
      "Search Existing Student",
      "student@abc.com",
      { charDelayMs: 120, pauseAfterTokensMs: 500 }
    );
    await clickButton(driver, "Next");
    try {
      //
      await clickYesSubmit(driver);
    } catch {}

    await driver.wait(
      until.elementLocated(
        By.xpath(
          "//*[contains(translate(.,'SUCCESS','success'),'success') or contains(.,'submitted') or contains(.,'created')]"
        )
      ),
      30000
    );
    console.log("✅ New application created successfully.");
  } catch (error) {
    console.error("Automation failed", error);
  } finally {
    await driver.quit();
  }
};

existingStudent();
