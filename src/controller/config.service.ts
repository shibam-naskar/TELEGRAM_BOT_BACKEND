import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { storeApiKey, getApiKey, storeChatId, getChatIds } from '../services/mongoService';

@Injectable()
export class CustomConfigService {
  constructor(private readonly configService: ConfigService) {}

  async updateKeysInMongoDB(telegramBotKey?: string, mapsApiKey?: string): Promise<void> {
    if (telegramBotKey) {
      await storeApiKey('TELEGRAM_BOT_KEY', telegramBotKey);
    }

    if (mapsApiKey) {
      await storeApiKey('MAPS_API_KEY', mapsApiKey);
    }
  }

  async getKeysMongoDb(telegramBotKey?: string, mapsApiKey?: string): Promise<string>{
    if (telegramBotKey) {
      var tk = await getApiKey('TELEGRAM_BOT_KEY');
      return tk
    }

    if (mapsApiKey) {
      var mk = await getApiKey('MAPS_API_KEY');
      return mk
    }
  }
}
