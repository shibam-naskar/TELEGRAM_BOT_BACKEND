import mongoose, { Document, Schema } from 'mongoose';
import 'dotenv/config';

var MONGO_URL = process.env.MONGO_URL


interface IApiKey extends Document {
    keyName: string;
    apiKey: string;
}

const apiKeySchema: Schema<IApiKey> = new mongoose.Schema({
    keyName: {
        type: String,
        required: true,
        unique: true,
    },
    apiKey: {
        type: String,
        required: true,
    },
});

interface IChatId extends Document {
    chatId: number;
    lat: string;
    lng: string;
    blocked: boolean;
    name:string;
}

const chatIdSchema: Schema<IChatId> = new mongoose.Schema({
    chatId: {
        type: Number,
        required: true,
    },
    lat: {
        type: String,
        required: true,
    },
    lng: {
        type: String,
        required: true,
    },
    blocked: {
        type: Boolean,
        default: false,
    },
    name: {
        type: String,
        required:true
    }
});

const ChatId = mongoose.model<IChatId>('ChatId', chatIdSchema);
const ApiKey = mongoose.model<IApiKey>('ApiKey', apiKeySchema);

async function storeApiKey(keyName: string, apiKey: string): Promise<void> {
    const existingApiKey = await ApiKey.findOne({ keyName });

    console.log(keyName)

    if (existingApiKey) {
        await ApiKey.findOneAndUpdate({ keyName }, { apiKey });
        console.log(`API Key for ${keyName} updated successfully.`);
    } else {
        await ApiKey.create({ keyName, apiKey });
        console.log(`API Key for ${keyName} stored successfully.`);
    }
}


async function getApiKey(keyName: string): Promise<string | null> {
    const apiKeyEntry = await ApiKey.findOne({ keyName });
    console.log("enqueryfor api keys")
    console.log(apiKeyEntry)
    return apiKeyEntry ? apiKeyEntry.apiKey : null;
}

async function connectToMongoDB() {
    try {
        await mongoose.connect(MONGO_URL, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}



async function storeChatId(chatId: number,lat:string,lng:string,name:string) {
    const existingChatId = await ChatId.findOne({ chatId });
    if (!existingChatId) {
        await ChatId.create({ chatId,lat,lng,name });
        console.log(`Chat ID ${chatId} stored successfully.`);
    } else {
        console.log(`Chat ID ${chatId} already exists.`);
    }
}

async function blockUser(chatId: number): Promise<void> {
    try {
        const existingChatId = await ChatId.findOne({ chatId });

        if (existingChatId) {
            await ChatId.findOneAndUpdate({ chatId }, { blocked: true });
            console.log(`User with Chat ID ${chatId} blocked successfully.`);
        } else {
            console.log(`User with Chat ID ${chatId} not found.`);
        }
    } catch (error) {
        console.error(`Error blocking user with Chat ID ${chatId}:`, error);
    }
}

async function unblockUser(chatId: number): Promise<void> {
    try {
        const existingChatId = await ChatId.findOne({ chatId });

        if (existingChatId) {
            await ChatId.findOneAndUpdate({ chatId }, { blocked: false });
            console.log(`User with Chat ID ${chatId} unblocked successfully.`);
        } else {
            console.log(`User with Chat ID ${chatId} not found.`);
        }
    } catch (error) {
        console.error(`Error unblocking user with Chat ID ${chatId}:`, error);
    }
}



async function getChatIds() {
    const result = await ChatId.find();
    return result.map((entry) => ({ chatId: entry.chatId,lst:entry.lat,lng:entry.lng, blocked: entry.blocked,name:entry.name }));
}

export { connectToMongoDB, storeChatId, getChatIds, storeApiKey, getApiKey,blockUser,unblockUser  };
