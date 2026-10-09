/**
 * AUTORE — community board uchun namunaviy maqolalar (NEWS / FREE / REVIEW / TIPS), mavjud diler va foydalanuvchilar nomidan
 *
 *   node scripts/seed-community.js          → qo'shadi / yangilaydi (qayta ishga tushirsa ham dublikat bo'lmaydi)
 *   node scripts/seed-community.js --reset  → faqat shu skript qo'shgan maqolalarni o'chiradi
 *
 * Ma'lumotlar: scripts/data/community-articles.json
 * Rasmlar:     uploads/article/community-*.jpg
 *              ("car:<fayl>" — uploads/car dagi mavjud rasm nusxalanadi; "download:<nom>" — oldindan yuklab qo'yilgan Wikimedia rasmi)
 * Mualliflar:  autore-next/public/img/fiber/CREDITS.md
 *
 * Avtorlar members kolleksiyasida memberNick bo'yicha qidiriladi (a'zolar o'zgartirilmaydi).
 * Har bir avtorning memberArticles hisoblagichi ACTIVE maqolalar soni bo'yicha qayta hisoblanadi.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const data = require('./data/community-articles.json');

const RESET = process.argv.includes('--reset');
const MONGO_URL = process.env.NODE_ENV === 'production' ? process.env.MONGO_PROD : process.env.MONGO_DEV;
const UPLOADS = path.join(__dirname, '..', 'uploads');
const DAY = 24 * 60 * 60 * 1000;

async function recountArticles(members, boardArticles, memberIds) {
	for (const _id of memberIds) {
		const count = await boardArticles.countDocuments({ memberId: _id, articleStatus: 'ACTIVE' });
		await members.updateOne({ _id }, { $set: { memberArticles: count } });
	}
}

async function main() {
	if (!MONGO_URL) throw new Error('.env faylida MONGO_DEV / MONGO_PROD topilmadi');
	await mongoose.connect(MONGO_URL);
	const db = mongoose.connection.db;
	const members = db.collection('members');
	const boardArticles = db.collection('boardArticles');
	console.log(`MongoDB: ${db.databaseName}`);

	// avtorlar: memberNick → _id
	const nicks = [...new Set(data.articles.map((a) => a.author))];
	const found = await members.find({ memberNick: { $in: nicks } }, { projection: { memberNick: 1 } }).toArray();
	const ids = Object.fromEntries(found.map((m) => [m.memberNick, m._id]));
	const absent = nicks.filter((n) => !ids[n]);
	if (absent.length) throw new Error(`Bu a'zolar topilmadi: ${absent.join(', ')} (avval seed-korean-cars.js / seed-demo-members.js)`);

	if (RESET) {
		const res = await boardArticles.deleteMany({
			$or: data.articles.map((a) => ({ articleTitle: a.title, memberId: ids[a.author] })),
		});
		await recountArticles(members, boardArticles, Object.values(ids));
		console.log(`O'chirildi: ${res.deletedCount} ta maqola`);
		await mongoose.disconnect();
		return;
	}

	// rasmlar: uploads/car dan nusxa olinadiganlari ko'chiriladi, qolganlari joyida bo'lishi shart
	for (const a of data.articles) {
		const target = path.join(UPLOADS, 'article', a.image.file);
		if (fs.existsSync(target)) continue;
		if (a.image.from.startsWith('car:')) {
			fs.copyFileSync(path.join(UPLOADS, 'car', a.image.from.slice(4)), target);
		} else {
			throw new Error(`Rasm topilmadi: ${target}`);
		}
	}

	// maqolalar — (sarlavha + avtor) bo'yicha upsert; createdAt faqat birinchi marta yoziladi
	let inserted = 0;
	for (const a of data.articles) {
		const createdAt = new Date(Date.now() - a.daysAgo * DAY);
		const res = await boardArticles.updateOne(
			{ articleTitle: a.title, memberId: ids[a.author] },
			{
				$set: {
					articleCategory: a.category,
					articleStatus: 'ACTIVE',
					articleContent: a.content,
					articleImage: `uploads/article/${a.image.file}`,
					articleViews: a.views,
					updatedAt: new Date(),
				},
				$setOnInsert: {
					articleTitle: a.title,
					memberId: ids[a.author],
					articleLikes: 0,
					articleComments: 0,
					createdAt,
				},
			},
			{ upsert: true },
		);
		if (res.upsertedCount) inserted++;
	}

	await recountArticles(members, boardArticles, Object.values(ids));

	const byCategory = await boardArticles
		.aggregate([{ $match: { articleStatus: 'ACTIVE' } }, { $group: { _id: '$articleCategory', n: { $sum: 1 } } }])
		.toArray();
	console.log(`Maqolalar: ${data.articles.length} ta (${inserted} ta yangi)`);
	console.log('Kategoriyalar:', byCategory.map((c) => `${c._id}=${c.n}`).join(', '));
	await mongoose.disconnect();
}

main().catch(async (err) => {
	console.error(err.message);
	await mongoose.disconnect();
	process.exit(1);
});
