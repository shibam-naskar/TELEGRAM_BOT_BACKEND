import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegramModule } from './telegram/telegram.module';
import { TelegramService } from './telegram/telegram.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { ConfigController } from './controller/config.controller';
import { CustomConfigService } from './controller/config.service';


@Module({
  imports: [TelegramModule,ScheduleModule.forRoot(),ConfigModule.forRoot({
    isGlobal:true
  })],
  controllers: [AppController,ConfigController],
  providers: [AppService,CustomConfigService],
})
export class AppModule {}
