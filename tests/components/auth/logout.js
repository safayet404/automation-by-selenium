const { By, until } = require("selenium-webdriver");

/** Click avatar → click Logout/Sign out. */
async function logout(
  driver,
  { menuText = ["Logout", "Sign out"], timeout = 5000 } = {}
) {
  // Guard: make sure we actually have a WebDriver
  if (!driver || typeof driver.findElement !== "function") {
    throw new Error(
      "logout(): driver is missing or not a WebDriver instance. Did you pass it in?"
    );
  }

  // 1) Click the avatar
  const avatar = await driver.findElement(By.css(".v-avatar.cursor-pointer"));
  await avatar.click();

  // 2) Wait for the menu and click the logout item
  const xpath = `//span[${menuText
    .map((t) => `contains(normalize-space(.), '${t}')`)
    .join(" or ")}]`;
  const logoutItem = await driver.wait(
    until.elementLocated(By.xpath(xpath)),
    timeout
  );
  await driver.wait(until.elementIsVisible(logoutItem), timeout);
  await logoutItem.click();

  // 3) Optional: wait for URL change or login page
  // await driver.wait(until.urlContains("/login"), 8000).catch(() => {});
  console.log("✅ Logged out");
}

module.exports = { logout };
