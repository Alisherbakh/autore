/**
 * AUTORE — namunaviy a'zolar (5 ta USER + 5 ta DEALER) va har bir dilerga 5 tadan e'lon (har birida 5 ta rasm)
 *
 *   node scripts/seed-demo-members.js          → qo'shadi / yangilaydi (qayta ishga tushirsa ham dublikat bo'lmaydi)
 *   node scripts/seed-demo-members.js --reset  → faqat shu skript qo'shgan a'zolar va e'lonlarni o'chiradi
 *
 * Ma'lumotlar: scripts/data/demo-members.json
 * Rasmlar:     uploads/member/demo-member-*.jpg, uploads/car/demo-<model>-<1..5>.jpg
 * Parol:       hamma a'zolar uchun bir xil (DEMO_PASSWORD)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const data = require('./data/demo-members.json');

const RESET = process.argv.includes('--reset');
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || 'alisher2908'; // 5–12 belgi (MemberInput qoidasi)
const VIN_PREFIX = 'AUTOREDEMO'; // demo e'lonlarini tanib olish uchun (10 + 7 raqam = 17 belgi)
const MONGO_URL = process.env.NODE_ENV === 'production' ? process.env.MONGO_PROD : process.env.MONGO_DEV;
const UPLOADS = path.join(__dirname, '..', 'uploads');

const allMembers = [...data.users.map((m) => ({ ...m, type: 'USER' })), ...data.dealers.map((m) => ({ ...m, type: 'DEALER' }))];

// takrorlanadigan "tasodifiy" son — har safar bir xil natija
const pseudo = (i, min, max) => min + (((i * 7919 + 104729) % 997) % (max - min + 1));

async function main() {
	if (!MONGO_URL) throw new Error('.env faylida MONGO_DEV / MONGO_PROD topilmadi');
	await mongoose.connect(MONGO_URL);
	const db = mongoose.connection.db;
	const members = db.collection('members');
	const cars = db.collection('cars');
	console.log(`MongoDB: ${db.databaseName}`);

	if (RESET) {
		const c = await cars.deleteMany({ carVin: { $regex: `^${VIN_PREFIX}` } });
		const m = await members.deleteMany({ memberNick: { $in: allMembers.map((x) => x.memberNick) } });
		console.log(`O'chirildi: ${m.deletedCount} ta a'zo, ${c.deletedCount} ta e'lon`);
		await mongoose.disconnect();
		return;
	}

	// rasmlar joyida ekanini tekshiramiz
	const missing = [
		...allMembers.map((m) => path.join(UPLOADS, 'member', m.image)),
		...data.cars.flatMap((c) => [1, 2, 3, 4, 5].map((n) => path.join(UPLOADS, 'car', `demo-${c.photos}-${n}.jpg`))),
	].filter((f) => !fs.existsSync(f));
	if (missing.length) throw new Error(`${missing.length} ta rasm topilmadi, masalan: ${missing[0]}`);

	// 1) a'zolar — memberNick bo'yicha upsert; parol har safar DEMO_PASSWORD'ga tenglanadi
	const hash = await bcrypt.hash(DEMO_PASSWORD, await bcrypt.genSalt());
	const ids = {};
	for (const m of allMembers) {
		const now = new Date();
		const res = await members.findOneAndUpdate(
			{ memberNick: m.memberNick },
			{
				$set: {
					memberFullName: m.memberFullName,
					memberAddress: m.memberAddress,
					memberDesc: m.memberDesc,
					memberImage: `uploads/member/${m.image}`,
					memberPassword: hash,
					memberType: m.type,
				},
				$setOnInsert: {
					memberNick: m.memberNick,
					memberPhone: m.memberPhone,
					memberStatus: 'ACTIVE',
					memberAuthType: 'PHONE',
					memberCars: 0,
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
		if (m.key) ids[m.key] = doc._id;
		console.log(`${m.type.padEnd(6)} ${m.memberNick} (${m.memberFullName})`);
	}

	// 2) e'lonlar — carVin bo'yicha upsert
	let i = 0;
	for (const c of data.cars) {
		const carVin = `${VIN_PREFIX}${String(i + 1).padStart(7, '0')}`;
		const doc = {
			carType: c.type,
			carStatus: 'ACTIVE',
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
			carVin,
			carViews: pseudo(i, 30, 900),
			carLikes: pseudo(i + 3, 1, 120),
			carRank: pseudo(i + 7, 0, 60),
			carImages: [1, 2, 3, 4, 5].map((n) => `uploads/car/demo-${c.photos}-${n}.jpg`),
			carDesc: `${c.year} ${c.title}, ${c.km.toLocaleString('en-US')} km, ${c.color}. One owner, full service history, no accidents. Viewing in ${c.addr}.`,
			carBarter: !!c.barter,
			carCredit: !!c.credit,
			memberId: ids[c.dealer],
		};
		const createdAt = new Date(Date.now() - (data.cars.length - i) * 4 * 60 * 60 * 1000);
		await cars.updateOne({ carVin }, { $set: { ...doc, updatedAt: new Date() }, $setOnInsert: { carComments: 0, createdAt } }, { upsert: true });
		i++;
	}
	console.log(`E'lonlar: ${data.cars.length} ta (har birida 5 ta rasm)`);

	// 3) dilerlarning memberCars hisobini haqiqiy e'lonlar soniga tenglaymiz
	for (const d of data.dealers) {
		const count = await cars.countDocuments({ memberId: ids[d.key], carStatus: { $ne: 'DELETE' } });
		await members.updateOne({ _id: ids[d.key] }, { $set: { memberCars: count } });
	}

	await mongoose.disconnect();
	console.log(`Tayyor. Parol: ${DEMO_PASSWORD}`);
}

main().catch(async (err) => {
	console.error(err);
	await mongoose.disconnect();
	process.exit(1);
});
