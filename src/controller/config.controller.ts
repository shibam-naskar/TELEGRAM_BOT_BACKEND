import { Controller, Patch, Body } from '@nestjs/common';
import { CustomConfigService } from './config.service';
import { blockUser, getApiKey, getChatIds, unblockUser } from '../services/mongoService';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: CustomConfigService) { }

  @Patch('update-keys')
  async updateKeys(@Body() body: { telegramBotKey?: string; mapsApiKey?: string }) {
    await this.configService.updateKeysInMongoDB(body.telegramBotKey, body.mapsApiKey);
    return { message: 'Environment variables updated successfully' };
  }

  @Patch('get-keys')
  async getKeys(@Body() body: { keyname?:string }) {
    var ret = await getApiKey(body.keyname);
    return { key: ret };
  }

  @Patch('blockuser')
  async blockUser(@Body() body: { uid?: number }) {
    await blockUser(body.uid)
    return { messege: "User Blocked Successfully" };
  }

  @Patch('unblockuser')
  async unblockUser(@Body() body: { uid?: number }) {
    await unblockUser(body.uid);
    return { message: "User Unblocked Successfully" };
  }

  @Patch('getusers')
  async getUsers(@Body() body: { uid?: number }) {
    var users = await getChatIds();
    return { users };
  }

}
