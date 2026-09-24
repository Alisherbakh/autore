import { registerEnumType } from '@nestjs/graphql';

// mashina kuzov turi
export enum CarType {
	SEDAN = 'SEDAN',
	SUV = 'SUV',
	HATCHBACK = 'HATCHBACK',
	COUPE = 'COUPE',
	CONVERTIBLE = 'CONVERTIBLE',
	WAGON = 'WAGON',
	VAN = 'VAN',
	PICKUP = 'PICKUP',
}
registerEnumType(CarType, {
	name: 'CarType',
});

export enum CarStatus {
	ACTIVE = 'ACTIVE',
	RESERVED = 'RESERVED', // xaridor bilan kelishilgan, hali sotilmagan
	SOLD = 'SOLD',
	DELETE = 'DELETE',
}
registerEnumType(CarStatus, {
	name: 'CarStatus',
});

export enum CarLocation {
	SEOUL = 'SEOUL',
	BUSAN = 'BUSAN',
	INCHEON = 'INCHEON',
	DAEGU = 'DAEGU',
	GYEONGJU = 'GYEONGJU',
	GWANGJU = 'GWANGJU',
	CHONJU = 'CHONJU',
	DAEJON = 'DAEJON',
	JEJU = 'JEJU',
}
registerEnumType(CarLocation, {
	name: 'CarLocation',
});

// mashina brendi
export enum CarBrand {
	HYUNDAI = 'HYUNDAI',
	KIA = 'KIA',
	GENESIS = 'GENESIS',
	KGM = 'KGM', // KG Mobility (oldingi SsangYong)
	CHEVROLET = 'CHEVROLET',
	RENAULT = 'RENAULT',
	TOYOTA = 'TOYOTA',
	BMW = 'BMW',
	MERCEDES = 'MERCEDES',
	AUDI = 'AUDI',
	VOLKSWAGEN = 'VOLKSWAGEN',
	TESLA = 'TESLA',
	OTHER = 'OTHER',
}
registerEnumType(CarBrand, {
	name: 'CarBrand',
});

// yoqilg'i turi
export enum CarFuelType {
	GASOLINE = 'GASOLINE',
	DIESEL = 'DIESEL',
	HYBRID = 'HYBRID',
	ELECTRIC = 'ELECTRIC',
	LPG = 'LPG',
	HYDROGEN = 'HYDROGEN',
}
registerEnumType(CarFuelType, {
	name: 'CarFuelType',
});

// uzatmalar qutisi
export enum CarTransmission {
	AUTOMATIC = 'AUTOMATIC',
	MANUAL = 'MANUAL',
}
registerEnumType(CarTransmission, {
	name: 'CarTransmission',
});

// yangi yoki ishlatilgan
export enum CarCondition {
	NEW = 'NEW',
	USED = 'USED',
}
registerEnumType(CarCondition, {
	name: 'CarCondition',
});
