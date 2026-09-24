import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsInt, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import {
	CarBrand,
	CarCondition,
	CarFuelType,
	CarLocation,
	CarStatus,
	CarTransmission,
	CarType,
} from '../../enums/car.enum';
import { ObjectId } from 'mongoose';
import { Direction } from '../../enums/common.enum';
import { availableOptions, availableCarSorts } from '../../config';

// Kirib kelyotgan malumotlar uchun
@InputType()
export class CarInput {
	@IsNotEmpty()
	@Field(() => CarType)
	carType: CarType;

	@IsNotEmpty()
	@Field(() => CarLocation)
	carLocation: CarLocation;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	carAddress: string;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	carTitle: string;

	@IsNotEmpty()
	@Min(0)
	@Field(() => Number)
	carPrice: number;

	@IsNotEmpty()
	@Field(() => CarBrand)
	carBrand: CarBrand;

	@IsNotEmpty()
	@Length(1, 50)
	@Field(() => String)
	carModel: string;

	@IsNotEmpty()
	@IsInt()
	@Min(1950)
	@Max(2100)
	@Field(() => Int)
	carYear: number;

	@IsNotEmpty()
	@IsInt()
	@Min(0)
	@Field(() => Int)
	carMileage: number;

	@IsNotEmpty()
	@Field(() => CarFuelType)
	carFuelType: CarFuelType;

	@IsNotEmpty()
	@Field(() => CarTransmission)
	carTransmission: CarTransmission;

	@IsOptional()
	@Field(() => CarCondition, { nullable: true })
	carCondition?: CarCondition;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	carEngineSize?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	carSeats?: number;

	@IsOptional()
	@Length(2, 30)
	@Field(() => String, { nullable: true })
	carColor?: string;

	@IsOptional()
	@Length(17, 17) // VIN har doim 17 belgidan iborat
	@Field(() => String, { nullable: true })
	carVin?: string;

	@IsNotEmpty()
	@Field(() => [String])
	carImages: string[];

	@IsOptional()
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	carDesc?: string;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	carBarter?: boolean;

	@IsOptional()
	@Field(() => Boolean, { nullable: true })
	carCredit?: boolean;

	memberId?: ObjectId;
}

@InputType()
export class PricesRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
export class YearsRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
export class MileageRange {
	@Field(() => Int)
	start: number;

	@Field(() => Int)
	end: number;
}

@InputType()
export class PeriodsRange {
	@Field(() => Date)
	start: Date;

	@Field(() => Date)
	end: Date;
}

@InputType()
class CarISearch {
	@IsOptional()
	@Field(() => String, { nullable: true }) // @ts-ignore
	memberId?: ObjectId;

	@IsOptional()
	@Field(() => [CarLocation], { nullable: true })
	locationList?: CarLocation[];

	@IsOptional()
	@Field(() => [CarType], { nullable: true })
	typeList?: CarType[];

	@IsOptional()
	@Field(() => [CarBrand], { nullable: true })
	brandList?: CarBrand[];

	@IsOptional()
	@Field(() => [CarFuelType], { nullable: true })
	fuelTypeList?: CarFuelType[];

	@IsOptional()
	@Field(() => [CarTransmission], { nullable: true })
	transmissionList?: CarTransmission[];

	@IsOptional()
	@Field(() => [CarCondition], { nullable: true })
	conditionList?: CarCondition[];

	@IsOptional()
	@IsIn(availableOptions, { each: true })
	@Field(() => [String], { nullable: true })
	options?: string[];

	@IsOptional()
	@Field(() => PricesRange, { nullable: true })
	pricesRange?: PricesRange;

	@IsOptional()
	@Field(() => YearsRange, { nullable: true })
	yearsRange?: YearsRange;

	@IsOptional()
	@Field(() => MileageRange, { nullable: true })
	mileageRange?: MileageRange;

	@IsOptional()
	@Field(() => PeriodsRange, { nullable: true })
	periodsRange?: PeriodsRange;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class CarsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableCarSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => CarISearch)
	search: CarISearch;
}

@InputType()
class DCISearch {
	@IsOptional()
	@Field(() => CarStatus, { nullable: true })
	carStatus?: CarStatus;
}

@InputType()
export class DealerCarsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableCarSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => DCISearch)
	search: DCISearch;
}

@InputType()
class ALCISearch {
	@IsOptional()
	@Field(() => CarStatus, { nullable: true })
	carStatus?: CarStatus;

	@IsOptional()
	@Field(() => [CarLocation], { nullable: true })
	carLocationList?: CarLocation[];
}

@InputType()
export class AllCarsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableCarSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ALCISearch)
	search: ALCISearch;
}

@InputType()
export class OrdinaryInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;
}
