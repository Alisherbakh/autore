import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { View } from '../../libs/dto/view/view';
import { ViewInput } from '../../libs/dto/view/view.input';
import { T } from '../../libs/types/common';
import { OrdinaryInquiry } from '../../libs/dto/car/car.input';
import { Cars } from '../../libs/dto/car/car';
import { ViewGroup } from '../../libs/enums/view.enum';
import { lookupVisit } from '../../libs/config';

@Injectable()
export class ViewService { // view schema model inject qilinyabdi
    constructor(@InjectModel('View') private readonly viewModel: Model<View> ) {}

public async recordView(input: ViewInput): Promise<View | null>{
    const viewExist = await this.checkViewExistence(input);
    if (!viewExist){
        console.log('- New View Insert -');
        return await this.viewModel.create(input);
    }else  return null;
   
}

// view bolsa view di qaytaradi, bolmasa falsy qaytaradi
// qiymat bolmasa view +1 , bolsa qoymaymiz
private async checkViewExistence(input: ViewInput): Promise<View>{
    const { memberId, viewRefId} = input;
    const search: T = { memberId: memberId, viewRefId: viewRefId}; //@ts-ignore
    return await this.viewModel.findOne(search).exec();

}

public async getVisitedCars(memberId: ObjectId, input: OrdinaryInquiry): Promise<Cars> {
    const { page, limit } = input;
    const match: T = { viewGroup: ViewGroup.CAR, memberId: memberId };

    const data: T = await this.viewModel
      .aggregate([
        { $match: match },
        { $sort: { updatedAt: -1 } },
        {
          $lookup: {
            from: 'cars', // collectiondan
            localField: 'viewRefId', // refID ni
            foreignField: '_id', // shu id ga teng holatini izlaydi
            as: 'visitedCar', // shu nom bilan saqlaydi
          },
        },
        { $unwind: '$visitedCar' },
        {
          $facet: {
            list: [
              { $skip: (page - 1) * limit },
              { $limit: limit },
              lookupVisit,
              { $unwind: '$visitedCar.memberData' },
    //visitedCar ni ichidagi, aytan shu carni hosil qilgan dealerni malumotlarini olish
            ],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ])
      .exec();

    const result: Cars = { list: [], metaCounter: data[0].metaCounter };// metacounter hosil qilinyabdi
    result.list = data[0].list.map((ele) => ele.visitedCar);
    // listni ichidagi, har bir malumotni olib iteration qilinyabdi, va bizga aynan favoriteCar ni olib berayabdi

    return result;
}

}
