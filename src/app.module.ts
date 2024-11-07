import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { Erc20Service } from './erc20.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available globally
    }),
    ScheduleModule.forRoot(),
  ],
  providers: [Erc20Service],
})
export class AppModule {}
