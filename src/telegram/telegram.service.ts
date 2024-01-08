import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
const TelegramBot = require('node-telegram-bot-api');
import { connectToMongoDB, storeChatId, getChatIds, getApiKey } from '../services/mongoService';
import { Cron } from '@nestjs/schedule';
import 'dotenv/config';

@Injectable()
export class TelegramService {
    private logger = new Logger(TelegramService.name);
    private bot: any;
    private chatidsloc: number[] = [];
    MAPS_API_KEY: string;

    constructor() {
        this.init();
    }

    async init() {
        await connectToMongoDB();

        const TELEGRAM_BOT_KEY = await getApiKey('TELEGRAM_BOT_KEY');
        this.MAPS_API_KEY = await getApiKey('MAPS_API_KEY');

        this.bot = new TelegramBot(TELEGRAM_BOT_KEY, { polling: true });

        this.setupListeners();
    }

    private setupListeners() {
        this.bot.onText(/\/echo (.+)/, (msg, match) => {
            const chatId = msg.chat.id;
            const resp = match[1];
            this.bot.sendMessage(chatId, resp);
        });

        this.bot.on('message', async (msg) => {
            try {
                const chatId = msg.chat.id;
                const msgtext = msg.text;

                if (msgtext === '/subscribe') {
                    await this.requestLocation(chatId);
                } else if (msgtext === '/help') {
                    this.bot.sendMessage(chatId, 'WEATHER BOT COMMANDS\n\n\nuse /subscribe to subscribe for weather update every 1 hour\n\nYou can manually check weather any time just by sending your current location (not live location)\n\nuse /help to see bot commands');
                } else if (msgtext == '/start') {
                    this.bot.sendMessage(chatId, 'WEATHER BOT\n\n\nuse /subscribe to subscribe for weather update every 1 hour\n\nYou can manually check weather any time just by sending your current location (not live location)\n\nuse /help to see bot commands');
                } else {
                    console.log(msg);
                }
            } catch (error) {
                console.log(error);
            }
        });

        this.bot.on('location', (msg) => {
            const chatId = msg.chat.id;
            const location = msg.location;
            const name = msg.chat.first_name+msg.chat.last_name

            this.processLocation(chatId, location,name);
        });
    }

    @Cron('0 * * * *')
    handleCron() {
        this.logger.debug('Executing cron job...');

        getChatIds().then((chatIds) => {
            chatIds.forEach((chatId) => {
                if(!chatId.blocked){
                    this.processLocation(chatId.chatId, { latitude: chatId.lst, longitude: chatId.lng },chatId.name);
                }
            });
        });
    }

    private async requestLocation(chatId: number) {
        this.chatidsloc.push(chatId);
        try {
            await this.bot.sendMessage(
                chatId,
                'Please share your location:',
                {
                    reply_markup: {
                        keyboard: [
                            [
                                {
                                    text: 'Share Location',
                                    request_location: true,
                                },
                            ],
                        ],
                        resize_keyboard: true,
                    },
                },
            );
        } catch (error) {
            console.log(error);
        }
    }

    private async processLocation(chatId: number, location: any,name:string) {
        this.logger.log(`Received location from user ${chatId}: ${location.latitude}, ${location.longitude}`);

        if(this.chatidsloc.includes(chatId)){
            await storeChatId(chatId, location.latitude, location.longitude,name)
        }
        axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${location.latitude}&lon=${location.longitude}&units=metric&appid=${this.MAPS_API_KEY}`)
            .then(async response => {
                const weatherData = {
                    temperature: `${response.data.main.temp}°C`,
                    feelsLike: `${response.data.main.feels_like}°C`,
                    tempMin: `${response.data.main.temp_min}°C`,
                    tempMax: `${response.data.main.temp_max}°C`,
                    pressure: `${response.data.main.pressure} hPa`,
                    humidity: `${response.data.main.humidity}%`,
                    windSpeed: `${response.data.wind.speed} m/s`,
                    condition: response.data.weather[0].description,
                    location: response.data.name,
                    iconCode: response.data.weather[0].icon,
                };

                const iconUrl = `https://openweathermap.org/img/wn/${weatherData.iconCode}@4x.png`;

                const iconResponse = await axios.get(iconUrl, { responseType: 'arraybuffer' });

                this.bot.sendPhoto(chatId, Buffer.from(iconResponse.data), {
                    caption: `${weatherData.location}\n
                        Temperature: ${weatherData.temperature}\n
                        Feels Like: ${weatherData.feelsLike}\n
                        Temperature Min: ${weatherData.tempMin}\n
                        Temperature Max: ${weatherData.tempMax}\n
                        Pressure: ${weatherData.pressure}\n
                        Humidity: ${weatherData.humidity}\n
                        Wind Speed: ${weatherData.windSpeed}\n
                        Condition: ${weatherData.condition}`,
                });
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }
}
