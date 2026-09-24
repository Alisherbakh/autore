import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { ObjectId } from 'mongoose';
import {
	CarBrand,
	CarCondition,
	CarFuelType,
	CarLocation,
	CarStatus,
	CarTransmission,
	CarType,
} from '../../enums/car.enum';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';

@ObjectType() //@ts-ignore
export class Car {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => CarType)
	carType: CarType;

	@Field(() => CarStatus)
	carStatus: CarStatus;

	@Field(() => CarLocation)
	carLocation: CarLocation;

	@Field(() => String)
	carAddress: string;

	@Field(() => String)
	carTitle: string;

	@Field(() => Number)
	carPrice: number;

	@Field(() => CarBrand)
	carBrand: CarBrand;

	@Field(() => String)
	carModel: string;

	@Field(() => Int)
	carYear: number;

	@Field(() => Int)
	carMileage: number;

	@Field(() => CarFuelType)
	carFuelType: CarFuelType;

	@Field(() => CarTransmission)
	carTransmission: CarTransmission;

	@Field(() => CarCondition)
	carCondition: CarCondition;

	@Field(() => Int, { nullable: true })
	carEngineSize?: number;

	@Field(() => Int, { nullable: true })
	carSeats?: number;

	@Field(() => String, { nullable: true })
	carColor?: string;

	@Field(() => String, { nullable: true })
	carVin?: string;

	@Field(() => Int)
	carViews: number;

	@Field(() => Int)
	carLikes: number;

	@Field(() => Int)
	carComments: number;

	@Field(() => Int)
	carRank: number;

	@Field(() => [String])
	carImages: string[];

	@Field(() => String, { nullable: true })
	carDesc?: string;

	@Field(() => Boolean)
	carBarter: boolean;

	@Field(() => Boolean)
	carCredit: boolean;

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => Date, { nullable: true })
	soldAt?: Date;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from agregation **/

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];

	@Field(() => Member, { nullable: true })
	memberData?: Member;
}

@ObjectType()
export class Cars {
	@Field(() => [Car])
	list: Car[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
