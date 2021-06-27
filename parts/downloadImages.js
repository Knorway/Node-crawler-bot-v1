const download = require('image-downloader');
const fs = require('fs');
require('colors');

try {
	fs.accessSync('download');
} catch (error) {
	fs.mkdirSync('download');
}

module.exports = function downloadImages(category) {
	try {
		fs.accessSync(`download/${category.label}`);
	} catch (error) {
		fs.mkdirSync(`download/${category.label}`);
	}

	return async (src) => {
		console.log('스크랩 된 상품 수: ', src.length);
		const results = src.map(async (e) => {
			const title = e.title.replace('/', '');
			try {
				await download.image({
					url: e.thumbnail,
					dest: `download/${category.label}/${title}_01.jpg`,
				});

				await download.image({
					url: e.mainImg,
					dest: `download/${category.label}/${title}_02.jpg`,
				});
				console.log(`저장 완료: ${title}`);
			} catch (error) {
				console.log(`[실패]: ${title}`.underline.red);

				// 로그 파일에 실패 항목 기재
				const log = fs.createWriteStream('download/log.txt', { flags: 'a' });
				log.once('open', () => {
					log.write(`[실패(${category.label})]: ${title}\n`);
					log.end();
				});
			}
		});

		await Promise.all(results);
	};
};
