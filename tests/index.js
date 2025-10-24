const { assignAo } = require("./components/application/assingAO");
const { newStudent } = require("./components/application/newStudentFlow");
const {
  latestApplication,
  openLatestApplication,
} = require("./components/application/openLatestApplication");
const {
  createDriver,
  clickButtonByText,
  closeSupportModalIfOpen,
} = require("./helpers");
const { login } = require("./login");
const path = require("path");
const { Builder, By, Key } = require("selenium-webdriver");
const { closeByEscOrX, isOverlayOpen } = require("./helpers/esc/esc");
const {
  dismissSupportModalIfPresent,
  withSupportGuard,
} = require("./helpers/dialog/supportModal");
const { logout } = require("./components/auth/logout");
const {
  acceptApplication,
} = require("./components/application/acceptApplication");

const run = async () => {
  const driver = await createDriver();

  try {
    await login(driver, {
      baseUrl: "https://dev.shabujglobal.org/",
      email: "qa.admin@shabujglobal.org",
      password: "password123@sge.",
    });
    dismissSupportModalIfPresent(driver);

    await newStudent(driver, {
      baseUrl: "https://dev.shabujglobal.org",
      countryToApply: "Cyprus",
      passportCountry: "Angola",
      intake: "September 2025",
      courseType: "Post Graduate",
      university: "University of Limassol",
      courseName:
        "Master of Science in Business Intelligence and Data Analytics",
      signaturePath: path.resolve(__dirname, "fixtures", "signature.jpg"),
      student: {
        passportNo: `P${Date.now()}`,
        dobISO: "1999-05-12",
        firstName: "Carolyn",
        lastName: "Fox",
        whatsapp: "193",
        counsellorNumber: "229",
        email: `user${Date.now()}@mailinator.com`,
        counsellorEmail: "counsellor@mailinator.com",
        address: "221B Baker Street",
        city: "London",
        country: "Andorra",
      },
      timeout: 30000,
    });
    console.log("✅ New student application created successfully.");

    await dismissSupportModalIfPresent(driver);

    await openLatestApplication(driver, "https://dev.shabujglobal.org");
    await assignAo(driver, "https://dev.shabujglobal.org");
    await dismissSupportModalIfPresent(driver);
    const closed = await closeByEscOrX(driver, { retries: 2, waitMs: 150 });

    console.log(
      "Overlay closed?",
      closed,
      "| Still open?",
      await isOverlayOpen(driver)
    );

    await logout(driver);

    await login(driver, {
      baseUrl: "https://dev.shabujglobal.org/",
      email: "qa.ao@shabujglobal.org",
      password: "password123@sge.",
    });

    await dismissSupportModalIfPresent(driver);

    await acceptApplication(driver, "https://dev.shabujglobal.org");
  } catch (e) {
    console.error("❌ Flow failed:", e);
  } finally {
    // await driver.quit();
  }
};

run();
