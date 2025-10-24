const { until, By } = require("selenium-webdriver");
const {
  robustGet,
  closeSupportModalIfOpen,
  selectFromDropdown,
  clickButton,
  clickVuetifyButtonLoose,
  uploadFile,
  waitForFilePondComplete,
  waitEnabledButtonByText,
  typeByLabel,
  clickRadioByLabel,
} = require("../../helpers");

const newStudent = async (
  driver,
  {
    baseUrl = "https://dev.shabujglobal.org",
    countryToApply,
    passportCountry,
    intake,
    courseType,
    university,
    courseName,
    signaturePath,
    student,
    timeout = 3000,
  }
) => {
  await robustGet(driver, `${baseUrl}/application/new`);
  await closeSupportModalIfOpen(driver);

  await driver.wait(
    until.elementLocated(
      By.xpath("//label[normalize-space(.)='Country to Apply']")
    )
  );

  await selectFromDropdown(driver, "Country to Apply", countryToApply);
  await selectFromDropdown(
    driver,
    "Country of Student Passport",
    passportCountry
  );

  await selectFromDropdown(driver, "Intake", intake);
  await selectFromDropdown(driver, "Course Type", courseType);
  await selectFromDropdown(driver, "University", university);
  await selectFromDropdown(driver, "Course", courseName);

  await clickButton(driver, "Next");
  await clickButton(driver, "Next");

  await clickVuetifyButtonLoose(driver, "Is This New Student?");

  await uploadFile(driver, signaturePath);

  await waitForFilePondComplete(driver, 60000);

  const nextBtn = await waitEnabledButtonByText(driver, "Next", 20000);

  try {
    await nextBtn.click();
  } catch (error) {
    await driver.executeScript("arguments[0].click();", nextBtn);
  }

  await typeByLabel(driver, "Student Passport No.", student.passportNo);
  await typeByLabel(driver, "Date of birth", student.dobISO);
  await typeByLabel(driver, "Student First Name", student.firstName);
  await typeByLabel(driver, "Student Last Name", student.lastName);
  await typeByLabel(driver, "Student WhatsApp Number", student.whatsapp);
  await typeByLabel(driver, "Counsellor Number", student.counsellorNumber);
  await typeByLabel(driver, "Enter Student Email", student.email);
  await typeByLabel(driver, "Counsellor Email", student.counsellorEmail);
  await typeByLabel(driver, "Student Address", student.address);
  await typeByLabel(driver, "Student City", student.city);
  await selectFromDropdown(driver, "Student Country", student.country);

  await clickRadioByLabel(driver, "Male");
  await clickRadioByLabel(driver, "Yes");

  await clickButton(driver, "Submit");

  const yesBtn = await driver.wait(
    until.elementLocated(By.xpath("//button[normalize-space()='Yes']")),
    5000
  );

  await driver.wait(until.elementIsVisible(yesBtn), 2000);
  await yesBtn.click();

  return true;
};

module.exports = { newStudent };
