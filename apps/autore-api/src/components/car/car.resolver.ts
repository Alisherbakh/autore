import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { ObjectId } from 'mongoose';
import { CarService } from './car.service';
import { Cars, Car } from '../../libs/dto/car/car';
import {
  CarInput,
  CarsInquiry,
  DealerCarsInquiry,
  AllCarsInquiry,
  OrdinaryInquiry,
} from '../../libs/dto/car/car.input';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { CarUpdate } from '../../libs/dto/car/car.update';

@Resolver()
export class CarResolver {
  constructor(private readonly carService: CarService) {}

  @Roles(MemberType.DEALER)
  @UseGuards(RolesGuard)
  @Mutation(() => Car)
  public async createCar(
    @Args('input') input: CarInput,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Car> {
    console.log('Mutation: createCar');
    input.memberId = memberId;
    return await this.carService.createCar(input);
  }

  @UseGuards(WithoutGuard)
  @Query((returns) => Car)
  public async getCar(
    @Args('carId') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Car> {
    console.log('Query: getCar');
    const carId = shapeIntoMongoObjectId(input);
    return await this.carService.getCar(memberId, carId);
  }

  @Roles(MemberType.DEALER)
  @UseGuards(RolesGuard)
  @Mutation((returns) => Car)
  public async updateCar(
    @Args('input') input: CarUpdate,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Car> {
    console.log('Mutation: updateCar');
    input._id = shapeIntoMongoObjectId(input._id);
    return await this.carService.updateCar(memberId, input);
  }

  @UseGuards(WithoutGuard)
  @Query((returns) => Cars)
  public async getCars(
    @Args('input') input: CarsInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Cars> {
    console.log('Query: getCars');
    return await this.carService.getCars(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Query((returns) => Cars)
  public async getFavorites( //biz tomonimizdan yoqtirilgan car 
    @Args('input') input: OrdinaryInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Cars> {
    console.log('Query: getFavorites');
    return await this.carService.getFavorites(memberId, input);
  }

 @UseGuards(AuthGuard)
  @Query((returns) => Cars)
  public async getVisited(
    @Args('input') input: OrdinaryInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Cars> {
    console.log('Query: getVisited');
    return await this.carService.getVisited(memberId, input);
  }



  @Roles(MemberType.DEALER)
  @UseGuards(RolesGuard)
  @Query((returns) => Cars)
  public async getDealerCars(
    @Args('input') input: DealerCarsInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Cars> {
    console.log('Query: getDealerCars');
    return await this.carService.getDealerCars(memberId, input);
  }

  @UseGuards(AuthGuard)
  @Mutation(() => Car)
  public async likeTargetCar(
    @Args('carId') input: string,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Car> {
    console.log('Mutation: likeTargetCar');
    const likeRefId = shapeIntoMongoObjectId(input);
    return await this.carService.likeTargetCar(memberId, likeRefId);
  }

  /** ADMIN **/

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Query((returns) => Cars)
  public async getAllCarsByAdmin(
    @Args('input') input: AllCarsInquiry,
    @AuthMember('_id') memberId: ObjectId,
  ): Promise<Cars> {
    console.log('Query: getAllCarsByAdmin');
    return await this.carService.getAllCarsByAdmin(input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation((returns) => Car)
  public async updateCarByAdmin(@Args('input') input: CarUpdate): Promise<Car> {
    console.log('Mutation: updateCarByAdmin');
    input._id = shapeIntoMongoObjectId(input._id);
    return await this.carService.updateCarByAdmin(input);
  }

  @Roles(MemberType.ADMIN)
  @UseGuards(RolesGuard)
  @Mutation((returns) => Car)
  public async removeCarByAdmin(@Args('carId') input: string): Promise<Car> {
    console.log('Mutation: removeCarByAdmin');
    const carId = shapeIntoMongoObjectId(input);
    return await this.carService.removeCarByAdmin(carId);
  }





  
}
