/**
 * AUTORE — CS markazi uchun Notice va FAQ'lar (oldin autore-next/libs/components/cs/Faq.tsx ichida qattiq yozilgan edi)
 *
 *   node scripts/seed-cs-notices.js          → qo'shadi / yangilaydi (qayta ishga tushirsa ham dublikat bo'lmaydi)
 *   node scripts/seed-cs-notices.js --reset  → faqat shu skript qo'shgan Notice/FAQ'larni o'chiradi
 *
 * Ma'lumotlar: scripts/data/cs-notices.json  ({ notices: [...], faqs: [...] }, har biri { title, content })
 * Muallif (memberId): bazadagi birinchi ADMIN a'zo — admin bo'lmasa skript to'xtaydi.
 * Tartib: /cs sahifasi eng yangisini birinchi ko'rsatadi, shuning uchun ro'yxatdagi birinchi element eng yangi qilib yoziladi.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const data = require('./data/cs-notices.json');

const RESET = process.argv.includes('--reset');
const MONGO_URL = process.env.NODE_ENV === 'production' ? process.env.MONGO_PROD : process.env.MONGO_DEV;

async function main() {
	if (!MONGO_URL) throw new Error('.env faylida MONGO_DEV / MONGO_PROD topilmadi');
	await mongoose.connect(MONGO_URL);
	const db = mongoose.connection.db;
	const notices = db.collection('notices');
	console.log(`MongoDB: ${db.databaseName}`);

	const items = [
		...data.notices.map((n) => ({ ...n, category: 'NOTICE' })),
		...data.faqs.map((f) => ({ ...f, category: 'FAQ' })),
	];

	if (RESET) {
		const res = await notices.deleteMany({
			$or: items.map((i) => ({ noticeCategory: i.category, noticeTitle: i.title })),
		});
		console.log(`O'chirildi: ${res.deletedCount} ta Notice/FAQ`);
		await mongoose.disconnect();
		return;
	}

	const admin = await db.collection('members').findOne({ memberType: 'ADMIN' }, { projection: { memberNick: 1 } });
	if (!admin) throw new Error("ADMIN a'zo topilmadi — avval admin hisobini yarating");

	// (kategoriya + sarlavha) bo'yicha upsert; createdAt faqat birinchi marta yoziladi
	const now = Date.now();
	let inserted = 0;
	let updated = 0;
	for (const category of ['NOTICE', 'FAQ']) {
		const list = items.filter((i) => i.category === category);
		for (let k = 0; k < list.length; k++) {
			const item = list[k];
			const createdAt = new Date(now - k * 1000); // birinchi element — eng yangi
			const res = await notices.updateOne(
				{ noticeCategory: category, noticeTitle: item.title },
				{
					$set: { noticeStatus: 'ACTIVE', noticeContent: item.content, memberId: admin._id, updatedAt: new Date() },
					$setOnInsert: { noticeCategory: category, noticeTitle: item.title, createdAt },
				},
				{ upsert: true },
			);
			if (res.upsertedCount) inserted++;
			else if (res.modifiedCount) updated++;
		}
	}

	console.log(`Admin: ${admin.memberNick}`);
	console.log(`Notice: ${data.notices.length}, FAQ: ${data.faqs.length} — yangi: ${inserted}, yangilangan: ${updated}`);
	await mongoose.disconnect();
}

main().catch(async (err) => {
	console.error('Xato:', err.message);
	await mongoose.disconnect();
	process.exit(1);
});
