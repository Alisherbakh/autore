import { Module } from '@nestjs/common';
import { AiResolver } from './ai.resolver';
import { AiService } from './ai.service';
import { AuthModule } from '../auth/auth.module';
import { CarModule } from '../car/car.module';

@Module({
	imports: [AuthModule, CarModule], // CarModule — CarService (qidiruv), AuthModule — WithoutGuard
	providers: [AiResolver, AiService],
})
export class AiModule {}
