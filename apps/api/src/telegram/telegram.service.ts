import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import SocksAgent from 'axios-socks5-agent';
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly client: AxiosInstance;
  private readonly chatId: string;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const proxyUrl =
      process.env.TELEGRAM_PROXY_URL || 'socks5://127.0.0.1:1080';

    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    }

    if (!chatId) {
      throw new Error('TELEGRAM_CHAT_ID is not configured');
    }

    this.chatId = chatId;

    const { httpAgent, httpsAgent } = SocksAgent({
        host: '127.0.0.1',
        port: 1080,
        agentOptions: {},
      });

    this.client = axios.create({
      baseURL: `https://api.telegram.org/bot${token}`,
       httpAgent,
  httpsAgent,
      proxy: false,
      timeout: 15_000,
    });
  }

  async sendMessage(text: string) {
    try {
      const response = await this.client.post('/sendMessage', {
        chat_id: this.chatId,
        text,
      });

      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to send Telegram message',
        error instanceof Error ? error.stack : String(error),
      );

      throw error;
    }
  }
}