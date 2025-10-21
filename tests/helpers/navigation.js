async function robustGet(driver, url) {
  for (let i = 1; i <= 3; i++) {
    await driver.get(url);

    // Wait for DOM ready
    await driver.wait(
      async () =>
        (await driver.executeScript("return document.readyState")) ===
        "complete",
      30000
    );

    const cur = await driver.getCurrentUrl();
    if (!/^data:|^about:blank|^chrome:\/\//i.test(cur)) return; // success
    if (i === 3) throw new Error(`Navigation stuck on ${cur}`);
    await driver.sleep(1000 * i);
  }
}

module.exports = { robustGet };
