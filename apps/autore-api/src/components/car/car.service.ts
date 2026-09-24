import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import moment from 'moment';
import { Cars, Car } from '../../libs/dto/car/car';
import {
  DealerCarsInquiry,
  AllCarsInquiry,
  OrdinaryInquiry,
  CarsInquiry,
  CarInput,
} from '../../libs/dto/car/car.input';
import { CarUpdate } from '../../libs/dto/car/car.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { CarStatus } from '../../libs/enums/car.enum';

// saytda ko'rinadigan statuslar (bron qilingan mashina ham ko'rinib turadi)
const VISIBLE_CAR_STATUSES = { $in: [CarStatus.ACTIVE, CarStatus.RESERVED] };
import { ViewGroup } from '../../libs/enums/view.enum';
import { StatisticModifier, T } from '../../libs/types/common';
import { lookupAuthMemberLiked, lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { MemberService } from '../member/member.service';
import { ViewService } from '../view/view.service';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';

@Injectable()
export class CarService {
  constructor(
    @InjectModel('Car') private readonly carModel: Model<Car>,
    private memberService: MemberService,
    private viewService: ViewService,
    private likeService: LikeService,
) {}

  public async createCar(input: CarInput): Promise<Car> {
    try {
      const result = await this.carModel.create(input);
      // increase memberCars +1
      await this.memberService.memberStatsEditor({
        _id: result.memberId,
        targetKey: 'memberCars',
        modifier: 1,
      });
      return result;
    } catch (err) {
      console.log('Error, Service.model:', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  public async getCar(memberId: ObjectId, carId: ObjectId): Promise<Car> {
    const search: T = {
      _id: carId,
      carStatus: VISIBLE_CAR_STATUSES,
    };
     //@ts-ignore
    const targetCar: Car = await this.carModel.findOne(search).lean().exec();
    if (!targetCar) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    if (memberId) {
      const viewInput = { memberId: memberId, viewRefId: carId, viewGroup: ViewGroup.CAR };
      const newView = await this.viewService.recordView(viewInput);
      if (newView) {
        await this.carStatsEditor({ _id: carId, targetKey: 'carViews', modifier: 1 });
        targetCar.carViews++;
      }

      // meLiked
      const likeInput = { memberId: memberId, likeRefId: carId, likeGroup: LikeGroup.CAR };//@ts-ignore
            targetCar.meLiked = await this.likeService.checkLikeExistence(likeInput);
    }
    //@ts-ignore
    targetCar.memberData = await this.memberService.getMember(null, targetCar.memberId);
    return targetCar;
  }

  public async carStatsEditor(input: StatisticModifier): Promise<Car> {
    const { _id, targetKey, modifier } = input; //@ts-ignore
    return await this.carModel
      .findByIdAndUpdate(
        _id,
        { $inc: { [targetKey]: modifier } },
        {
          new: true,
        },
      )
      .exec();
  }

  public async updateCar(memberId: ObjectId, input: CarUpdate): Promise<Car> {
    let { carStatus, soldAt, deletedAt } = input;
    const search: T = {
      _id: input._id,
      memberId: memberId,
      carStatus: VISIBLE_CAR_STATUSES,
    };

    if (carStatus === CarStatus.SOLD) soldAt = input.soldAt = moment().toDate();
    else if (carStatus === CarStatus.DELETE) deletedAt = input.deletedAt = moment().toDate();

    const result = await this.carModel
      .findOneAndUpdate(search, input, {
        new: true,
      })
      .exec();
    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

    if (soldAt || deletedAt) {
      await this.memberService.memberStatsEditor({
        _id: memberId,
        targetKey: 'memberCars',
        modifier: -1,
      });
    }

    return result;
  }

  public async getCars(memberId: ObjectId, input: CarsInquiry): Promise<Cars> {
    const match: T = { carStatus: VISIBLE_CAR_STATUSES };
    const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

    this.shapeMatchQuery(match, input);
    console.log('match:', match);

    const result = await this.carModel
      .aggregate([
        { $match: match },
        { $sort: sort },
        {
          $facet: {
            list: [
              { $skip: (input.page - 1) * input.limit },
              { $limit: input.limit },
              // meLiked qaysi biriga like bosilgan va bosilmagan, database da exacutioon bolayabdi
              lookupAuthMemberLiked(memberId),
              lookupMember,
              { $unwind: '$memberData' },
            ],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ])
      .exec();
    if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return result[0];
  }

  private shapeMatchQuery(match: T, input: CarsInquiry): void {
    const {
      memberId,
      locationList,
      typeList,
      brandList,
      fuelTypeList,
      transmissionList,
      conditionList,
      periodsRange,
      pricesRange,
      yearsRange,
      mileageRange,
      options,
      text,
    } = input.search;
    if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);
    if (locationList && locationList.length) match.carLocation = { $in: locationList };
    //tanlangan bir nechta qiymatlardan kamida biriga mos keluvchi ma'lumotlarni qidirish uchun $in ishlatiladi
    if (typeList && typeList.length) match.carType = { $in: typeList };
    if (brandList && brandList.length) match.carBrand = { $in: brandList };
    if (fuelTypeList && fuelTypeList.length) match.carFuelType = { $in: fuelTypeList };
    if (transmissionList && transmissionList.length) match.carTransmission = { $in: transmissionList };
    if (conditionList && conditionList.length) match.carCondition = { $in: conditionList };

    //narx, yil, probeg yoki sananing boshlang'ich ($gte — katta yoki teng)
    // va oxirgi ($lte — kichik yoki teng) oraliq chegaralarini belgilaydi.
    if (pricesRange) match.carPrice = { $gte: pricesRange.start, $lte: pricesRange.end };
    if (yearsRange) match.carYear = { $gte: yearsRange.start, $lte: yearsRange.end };
    if (mileageRange) match.carMileage = { $gte: mileageRange.start, $lte: mileageRange.end };
    if (periodsRange) match.createdAt = { $gte: periodsRange.start, $lte: periodsRange.end };

    if (text) match.carTitle = { $regex: new RegExp(text, 'i') };
    //'i' kaliti katta-kichik harflarni farqlamay qidirishni ta'minlaydi.
    if (options && options.length) {
      match['$or'] = options.map((ele) => {
        return { [ele]: true };
        //tanlangan qo'shimcha imkoniyatlarni (masalan: carBarter: true, carCredit: true)
        // $or mantiqiy operatori orqali kamida bittasi true bo'lishi kerak degan shart bilan qo'shadi.
      });
    }
  }
 // biz tomonimizdan yoqtirilgan car
  public async getFavorites(memberId: ObjectId, input: OrdinaryInquiry): Promise<Cars> {
    return await this.likeService.getFavoriteCars(memberId, input);
  }

  public async getVisited(memberId: ObjectId, input: OrdinaryInquiry): Promise<Cars> {
    return await this.viewService.getVisitedCars(memberId, input);
  }



  public async getDealerCars(memberId: ObjectId, input: DealerCarsInquiry): Promise<Cars> {
    const { carStatus } = input.search;
    if (carStatus === CarStatus.DELETE) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

    const match: T = {
      memberId: memberId,
      carStatus: carStatus ?? { $ne: CarStatus.DELETE },
    };
    const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

    const result = await this.carModel
      .aggregate([
        { $match: match },
        { $sort: sort },
        {
          $facet: {
            list: [
              { $skip: (input.page - 1) * input.limit },
              { $limit: input.limit },
              lookupMember,
              { $unwind: '$memberData' },
            ],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ])
      .exec();
    if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return result[0];
  }


  public async likeTargetCar(memberId: ObjectId, likeRefId: ObjectId): Promise<Car> {//@ts-ignore
    const target: Car = await this.carModel
      .findOne({ _id: likeRefId, carStatus: VISIBLE_CAR_STATUSES })
      .exec();
    if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    const input: LikeInput = {
      memberId: memberId,// kim bosyabdi
      likeRefId: likeRefId, // nimaga bosyabdi
      likeGroup: LikeGroup.CAR,
    };

    const modifier: number = await this.likeService.toggleLike(input);
    const result = await this.carStatsEditor({ _id: likeRefId, targetKey: 'carLikes', modifier: modifier });

    if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
    return result;
  }



  public async getAllCarsByAdmin(input: AllCarsInquiry): Promise<Cars> {
    const { carStatus, carLocationList } = input.search;
    const match: T = {};
    const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

    if (carStatus) match.carStatus = carStatus;
    if (carLocationList) match.carLocation = { $in: carLocationList };

    const result = await this.carModel
      .aggregate([
        { $match: match },
        { $sort: sort },
        {
          $facet: {
            list: [
              { $skip: (input.page - 1) * input.limit },
              { $limit: input.limit },
              lookupMember,
              { $unwind: '$memberData' },
            ],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ])
      .exec();
    if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    return result[0];
  }

  public async updateCarByAdmin(input: CarUpdate): Promise<Car> {
    let { carStatus, soldAt, deletedAt } = input;
    const search: T = {
      _id: input._id,
      carStatus: VISIBLE_CAR_STATUSES,
    };

    if (carStatus === CarStatus.SOLD) soldAt = input.soldAt = moment().toDate();
    else if (carStatus === CarStatus.DELETE) deletedAt = input.deletedAt = moment().toDate();

    const result = await this.carModel
      .findOneAndUpdate(search, input, {
        new: true,
      })
      .exec();
    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

    if (soldAt || deletedAt) {
      await this.memberService.memberStatsEditor({
        _id: result.memberId,
        targetKey: 'memberCars',
        modifier: -1,
      });
    }

    return result;
  }

  public async removeCarByAdmin(carId: ObjectId): Promise<Car> {
    const search: T = { _id: carId, carStatus: CarStatus.DELETE };
    const result = await this.carModel.findOneAndDelete(search).exec();
    if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

    return result;
  }
}
