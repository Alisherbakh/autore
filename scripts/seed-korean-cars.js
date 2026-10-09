/**
 * AUTORE — Koreys mashinalari bilan boshlang'ich ma'lumot (seed)
 *
 *   npm run seed:cars           → dilerlar va e'lonlarni qo'shadi / yangilaydi (qayta ishga tushirsa ham dublikat bo'lmaydi)
 *   npm run seed:cars -- --reset → faqat shu skript qo'shgan e'lonlarni o'chiradi
 *
 * Ma'lumotlar: scripts/data/korean-cars.json
 * Rasmlar:     uploads/car/seed-<slug>.jpg + seed-<slug>-2..5.jpg (Wikimedia Commons), uploads/member/seed-dealer-<key>.jpg
 * Baza:        .env → NODE_ENV=production bo'lsa MONGO_PROD, aks holda MONGO_DEV (API bilan bir xil)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const data = require('./data/korean-cars.json');

const RESET = process.argv.includes('--reset');
const DEALER_PASSWORD = process.env.SEED_DEALER_PASSWORD || 'autore123'; // 5–12 belgi (MemberInput qoidasi)
const VIN_PREFIX = 'AUTORESEED'; // seed e'lonlarini tanib olish uchun (haqiqiy VIN emas)
const MONGO_URL = process.env.NODE_ENV === 'production' ? process.env.MONGO_PROD : process.env.MONGO_DEV;

const slug = (c) =>
	`${c.brand} ${c.model} ${c.year}`
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

// takrorlanadigan "tasodifiy" son — har safar bir xil natija
const pseudo = (i, min, max) => min + ((i * 7919 + 104729) % 997) % (max - min + 1);

// e'lon rasmlari: seed-<slug>.jpg (asosiy) + seed-<slug>-2..5.jpg (bor bo'lsa — galereya uchun)
const carImages = (c) =>
	[`seed-${slug(c)}.jpg`, ...[2, 3, 4, 5].map((n) => `seed-${slug(c)}-${n}.jpg`)]
		.filter((f, idx) => idx === 0 || fs.existsSync(path.join(__dirname, '..', 'uploads', 'car', f)))
		.map((f) => `uploads/car/${f}`);

// diler rasmi: uploads/member/seed-dealer-<key>.jpg (bor bo'lsa), aks holda null
const dealerImage = (d) =>
	fs.existsSync(path.join(__dirname, '..', 'uploads', 'member', `seed-dealer-${d.key}.jpg`)) ? `uploads/member/seed-dealer-${d.key}.jpg` : null;

const toDoc = (c, i, dealerId) => {
	return {
		carType: c.type,
		carStatus: i % 11 === 5 ? 'RESERVED' : 'ACTIVE',
		carLocation: c.loc,
		carAddress: c.addr,
		carTitle: c.title,
		carPrice: c.price,
		carBrand: c.brand,
		carModel: c.model,
		carYear: c.year,
		carMileage: c.km,
		carFuelType: c.fuel,
		carTransmission: 'AUTOMATIC',
		carCondition: 'USED',
		...(c.cc ? { carEngineSize: c.cc } : {}),
		carSeats: c.seats,
		carColor: c.color,
		carVin: `${VIN_PREFIX}${String(i + 1).padStart(7, '0')}`,
		carViews: pseudo(i, 40, 980),
		carLikes: pseudo(i + 3, 2, 140),
		carRank: pseudo(i + 7, 0, 60),
		carImages: carImages(c),
		carDesc: `${c.year} ${c.title}, ${c.km.toLocaleString('en-US')} km, ${c.color}. One owner, full service history, no accidents. Viewing in ${c.addr}.`,
		carBarter: !!c.barter,
		carCredit: !!c.credit,
		memberId: dealerId,
	};
};

async function main() {
	if (!MONGO_URL) throw new Error('.env faylida MONGO_DEV / MONGO_PROD topilmadi');
	await mongoose.connect(MONGO_URL);
	const db = mongoose.connection.db;
	const members = db.collection('members');
	const cars = db.collection('cars');
	console.log(`MongoDB: ${db.databaseName}`);

	if (RESET) {
		const res = await cars.deleteMany({ carVin: { $regex: `^${VIN_PREFIX}` } });
		console.log(`O'chirildi: ${res.deletedCount} ta seed e'lon`);
	} else {
		// rasmlar joyida ekanini tekshiramiz
		const missing = data.cars.filter((c) => !fs.existsSync(path.join(__dirname, '..', 'uploads', 'car', `seed-${slug(c)}.jpg`)));
		if (missing.length) console.warn(`Diqqat: ${missing.length} ta rasm uploads/car ichida topilmadi`);

		// 1) dilerlar (bor bo'lsa — paroli o'zgartirilmaydi)
		const dealerIds = {};
		const hash = await bcrypt.hash(DEALER_PASSWORD, await bcrypt.genSalt());
		for (const d of data.dealers) {
			const now = new Date();
			const res = await members.findOneAndUpdate(
				{ memberNick: d.memberNick },
				{
					$set: {
						memberFullName: d.memberFullName,
						memberAddress: d.memberAddress,
						memberDesc: d.memberDesc,
						// diler rasmi (bor bo'lsa): uploads/member/seed-dealer-<key>.jpg
						...(dealerImage(d) ? { memberImage: dealerImage(d) } : {}),
					},
					$setOnInsert: {
						memberNick: d.memberNick,
						memberPhone: d.memberPhone,
						memberPassword: hash,
						memberType: 'DEALER',
						memberStatus: 'ACTIVE',
						memberAuthType: 'PHONE',
						...(dealerImage(d) ? {} : { memberImage: '' }), // GraphQL'da memberImage majburiy
						memberArticles: 0,
						memberFollowers: 0,
						memberFollowings: 0,
						memberPoints: 0,
						memberLikes: 0,
						memberViews: 0,
						memberComments: 0,
						memberRank: 0,
						memberWarnings: 0,
						memberBlocks: 0,
						createdAt: now,
					},
					$currentDate: { updatedAt: true },
				},
				{ upsert: true, returnDocument: 'after', includeResultMetadata: false },
			);
			const doc = res && res.value !== undefined ? res.value : res;
			dealerIds[d.key] = doc._id;
			console.log(`Diler: ${d.memberNick} (${d.memberFullName})`);
		}

		// 2) e'lonlar — carVin bo'yicha upsert (qayta ishga tushirsa yangilanadi)
		let i = 0;
		for (const c of data.cars) {
			const doc = toDoc(c, i, dealerIds[c.dealer]);
			const createdAt = new Date(Date.now() - (data.cars.length - i) * 6 * 60 * 60 * 1000); // har biri 6 soat oralig'ida
			await cars.updateOne(
				{ carVin: doc.carVin },
				{ $set: { ...doc, updatedAt: new Date() }, $setOnInsert: { carComments: 0, createdAt } },
				{ upsert: true },
			);
			i++;
		}
		console.log(`E'lonlar: ${data.cars.length} ta koreys mashinasi qo'shildi / yangilandi`);
	}

	// 3) dilerlarning memberCars hisobini haqiqiy e'lonlar soniga tenglaymiz
	for (const d of data.dealers) {
		const m = await members.findOne({ memberNick: d.memberNick });
		if (!m) continue;
		const count = await cars.countDocuments({ memberId: m._id, carStatus: { $ne: 'DELETE' } });
		await members.updateOne({ _id: m._id }, { $set: { memberCars: count } });
	}

	await mongoose.disconnect();
	console.log(RESET ? 'Tayyor.' : `Tayyor. Diler paroli: ${DEALER_PASSWORD}`);
}

main().catch(async (err) => {
	console.error('Seed xatosi:', err.message);
	await mongoose.disconnect().catch(() => {});
	process.exit(1);
});
