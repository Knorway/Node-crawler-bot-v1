const dotenv = require('dotenv');

dotenv.config();
const IMG_PREFIX = process.env.IMG_PREFIX;

module.exports = function scrap(category) {
	let URL = category.url;

	return async (page, src) => {
		console.log(`[${category.label}] 스크랩 시작`);

		// 해당 카테고리 각 페이지 아이템 개별 링크 수집
		for (let p = 1; p <= category.page; p++) {
			URL = URL.replace(`page=${p === 1 ? 1 : p - 1}`, `page=${p}`);
			await page.goto(URL);

			const itemLinks = await page.evaluate((IMG_PREFIX) => {
				const itemLinks = [];
				const container = document.querySelector(
					'body table:nth-child(4) > tbody > tr:nth-child(3) > td > table > tbody'
				);
				const lines = container.querySelectorAll(':scope > tr');

				lines.forEach((line) => {
					for (let i = 0; i < line.childElementCount; i++) {
						const a = line.querySelector(
							`td:nth-child(${
								i + 1
							}) > table > tbody > tr:nth-child(2) > td > a`
						);
						if (!a) return;
						itemLinks.push(IMG_PREFIX + a?.getAttribute('href'));
					}
				});
				return itemLinks;
			}, IMG_PREFIX);

			// 개별 링크로 이동 후 이미지 태그 src 추출
			for (let i = 0; i < itemLinks.length; i++) {
				await page.goto(itemLinks[i]);

				const result = await page.evaluate(() => {
					try {
						const thumbnail = document
							?.querySelector('[name="imgName"]')
							?.getAttribute('src');
						const mainImg = document
							?.querySelector('div[align="center"] > img')
							?.getAttribute('src');
						const title = document?.querySelector(
							'body > table:nth-child(26) > tbody > tr:nth-child(3) > td > table > tbody > tr > td:nth-child(3) > table:nth-child(3) > tbody > tr:nth-child(2) > td:nth-child(3) > table > tbody > tr:nth-child(2) > td > font'
						)?.textContent;
						const price = document?.querySelector(
							'body > table:nth-child(26) > tbody > tr:nth-child(3) > td > table > tbody > tr > td:nth-child(3) > table:nth-child(3) > tbody > tr:nth-child(2) > td:nth-child(3) > table > tbody > tr:nth-child(4) > td > table > tbody > tr:nth-child(1) > td:nth-child(5) > b > font'
						)?.textContent;

						return {
							title,
							thumbnail,
							mainImg,
							price: price + '원',
						};
					} catch (error) {
						console.log('[링크 추출 실패]');
					}
				});

				src.push(result);
			}

			console.log(`[${category.label}] ${p} 페이지 완료`);
		}
	};
};
