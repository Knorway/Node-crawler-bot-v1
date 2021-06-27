module.exports = function login(URL, ACCOUNT, PASSWORD) {
	return async (page) => {
		await page.goto(URL, {
			waitUntil: 'networkidle0',
		});
		await page.click('input[name="id"]');
		await page.keyboard.type(ACCOUNT);
		await page.click('input[name="passwd"]');
		await page.keyboard.type(PASSWORD);
		await page.click('input[src="./img/main_login/btn_login.gif"]');
		await page.waitForNavigation({ waitUntil: 'networkidle0' });
	};
};
