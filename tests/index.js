const { newStudent } = require("./components/application/newStudentFlow");
const { createDriver } = require("./helpers");
const { login } = require("./login");
const path = require("path");

const run = async () => {
  const driver = await createDriver();

  try {
    await login(driver, {
      baseUrl: "https://dev.shabujglobal.org/",
      email: "qa.admin@shabujglobal.org",
      password: "password123@sge.",
    });

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
        passportNo: "P12345678",
        dobISO: "1999-05-12",
        firstName: "Carolyn",
        lastName: "Fox",
        whatsapp: "193",
        counsellorNumber: "229",
        email: "carolyn.fox@mailinator.com",
        counsellorEmail: "counsellor@mailinator.com",
        address: "221B Baker Street",
        city: "London",
        country: "Andorra",
      },
      timeout: 30000,
    });
    console.log("✅ New student application created successfully.");
  } catch (e) {
    console.error("❌ Flow failed:", e);
  } finally {
    await driver.quit();
  }
};

run();
