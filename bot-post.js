const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const ACCOUNT_5 = process.env.ACCOUNT_5;
const PASSWORD_5 = process.env.PASSWORD_5;

const category = 'category1';
const data = JSON.parse(fs.readFileSync(`downloads/${category}.json`));

const bot = async () => {
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();
	page.setUserAgent(
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36'
	);
	page.setViewport({ width: 1740, height: 900 });

	// 로그인
	await page.goto(process.env.TARGET_PAGE_LOGIN);
	await page.type('#login', ACCOUNT_5);
	await page.type('input[name=managerPw]', PASSWORD_5);
	await page.keyboard.down('Enter');
	await page.waitForNavigation();

	await page.goto(process.env.TARGET_PAGE_REGISTER, {
		waitUntil: 'networkidle0',
	});

	// 포스트 등록 시작
	try {
		for (let i = 0; i < data.length; i++) {
			console.log(`[${category}] 등록 시작`);
			// 상품 정보 입력
			await page.evaluate(
				(data, i) => {
					const titleContainer = document.querySelector(
						'#depth-toggle-layer-defaultInfo .table .table-cols'
					);
					const titleInput = titleContainer.querySelector(
						'tbody tr:nth-child(2) > td input'
					);
					const price = document.querySelector(
						'#gd_goods_price > table > tbody > tr:nth-child(2) > td:nth-child(2) > div > input'
					);
					titleInput.value = data[i].title; // 상품 이름
					price.value = data[i].price.replaceAll(',', ''); // 상품 가격
				},
				data,
				i
			);

			// 상품 썸네일 이미지 등록
			const uploadInput = await page.$('#imageOriginal input[type=file]');
			await uploadInput.uploadFile(`downloads/${category}/${data[i].title}_01.jpg`);

			// 상품 메인 이미지 등록 시작
			await page.waitForSelector('#textareaDescriptionShop');
			// iframe 획득 및 upload 팝업 버튼 클릭
			const richEditor = page
				.frames()
				.filter((e) => e._url === process.env.TARGET_IFRAME_EDITOR);
			await richEditor[0].evaluate(() => {
				document
					.querySelector('#se2_tool > div > ul.se2_multy > li > button')
					.click();
			});
			const popupPromise = new Promise((x) =>
				browser.once('targetcreated', (target) => x(target.page()))
			);
			const popup = await popupPromise;
			await popup.evaluate(() => {
				document
					.querySelector(
						'#uploadSelect > div:nth-child(1) > label:nth-child(3)'
					)
					.click();
			});
			// 메인 이미지 등록 팝업 제어
			await popup.waitForNavigation({ waitUntil: 'networkidle0' });
			const uploadInput2 = await popup.$('#uploadInputBox');
			await uploadInput2.uploadFile(
				`downloads/${category}/${data[i].title}_02.jpg`
			);
			await popup.waitForSelector('#uploadInputBox');
			await popup.click('#btn_confirm');
			// 팝업창 종료
			await richEditor[0].evaluate(() => {
				document
					.querySelector(
						'#se2_tool > div > ul:nth-child(3) > li.husky_seditor_ui_justifycenter > button'
					)
					.click();
			});
			await page.waitForSelector(
				'#frmGoods > div.page-header.js-affix.affix > div > input.btn.btn-red'
			);
			await page.waitForResponse(
				(response) =>
					response.url().includes('data/editor/goods') &&
					response.status() === 200
			);
			// 상품 등록 버튼 클릭
			await page.click(
				'#frmGoods > div.page-header.js-affix.affix > div > input.btn.btn-red'
			);
			await page.waitForNavigation({ waitUntil: 'networkidle0' });
		}
	} catch (error) {
		console.log(error);
	}
	await page.close();
	await browser.close();
	console.log(`[${category}] 등록 완료`);
};

bot();
