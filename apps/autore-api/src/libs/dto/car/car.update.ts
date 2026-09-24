import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
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

@InputType()
export class CarUpdate {
	@IsNotEmpty()
	@Field(() => String) // @ts-ignore
	_id: ObjectId;

	@IsOptional()
	@Field(() => CarType, { nullable: true })
	carType?: CarType;

	@IsOptional()
	@Field(() => CarStatus, { nullable: true })
	carStatus?: CarStatus;

	@IsOptional()
	@Field(() => CarLocation, { nullable: true })
	carLocation?: CarLocation;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	carAddress?: string;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	carTitle?: string;

	@IsOptional()
	@Min(0)
	@Field(() => Number, { nullable: true })
	carPrice?: number;

	@IsOptional()
	@Field(() => CarBrand, { nullable: true })
	carBrand?: CarBrand;

	@IsOptional()
	@Length(1, 50)
	@Field(() => String, { nullable: true })
	carModel?: string;

	@IsOptional()
	@IsInt()
	@Min(1950)
	@Max(2100)
	@Field(() => Int, { nullable: true })
	carYear?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	carMileage?: number;

	@IsOptional()
	@Field(() => CarFuelType, { nullable: true })
	carFuelType?: CarFuelType;

	@IsOptional()
	@Field(() => CarTransmission, { nullable: true })
	carTransmission?: CarTransmission;

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
	@Length(17, 17)
	@Field(() => String, { nullable: true })
	carVin?: string;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	carImages?: string[];

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

	soldAt?: Date;

	deletedAt?: Date;
}
