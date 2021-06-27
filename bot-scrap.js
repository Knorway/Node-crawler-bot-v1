const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
const fs = require('fs');
const fsp = require('fs/promises');
const readline = require('readline');

// 봇 부품들
const login = require('./parts/login');
const scrap = require('./parts/scrap');
const downloadImages = require('./parts/downloadImages');
const categories = require('./parts/categories');

dotenv.config();
const URL = process.env.TARGET_URL;
const ACCOUNT = process.env.ACCOUNT;
const PASSWORD = process.env.PASSWORD;

const bot = async () => {
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();
	const info = { total: 0, failure: 0 };
	let src = [];

	// 로그인
	await login(URL, ACCOUNT, PASSWORD)(page);

	// 해당 카테고리 개별 아이템 링크 수집, src 추출 및 이미지 변환
	for (const category of categories) {
		await scrap(category)(page, src);
		await downloadImages(category)(src);

		await fsp.writeFile(`download/${category.label}.json`, JSON.stringify(src));
		info.total += src.length;
		src = [];
	}

	// 종료 및 log 파일 통계 작성
	const rl = readline.createInterface({
		input: fs.createReadStream('download/log.txt'),
		output: process.std,
	});

	rl.on('line', () => {
		info.failure += 1;
	});
	rl.on('close', () => {
		const log = fs.createWriteStream('download/log.txt', { flags: 'a' });
		log.once('open', () => {
			log.write(`\n전체 작업 수: ${info.total}\n`);
			log.write(`성공 작업 수: ${info.total - info.failure}\n`);
			log.write(`실패 작업 수: ${info.failure}\n`);
			log.close();

			console.log('[작업 완료]: download/log.txt 파일 참조');
		});
	});

	await browser.close();
};

bot();
