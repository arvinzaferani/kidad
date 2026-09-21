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
      process.env.TELEGRAM_PROXY_URL ;

      if (!token || !chatId) {
        this.logger.warn(
          'Telegram notifications are disabled: missing configuration',
        );
      
        this.client = axios.create();
        this.chatId = '';
      
        return;
      }

    this.chatId = chatId;

    const { httpAgent, httpsAgent } = SocksAgent({
        host: '172.19.0.1',
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
    if (!this.chatId) {
        this.logger.warn('Telegram chat ID is missing');
        return;
      }
    
      try {
        this.logger.log('Sending Telegram message...');
    
        const response = await this.client.post('/sendMessage', {
          chat_id: this.chatId,
          text,
        });
    
        this.logger.log(
          `Telegram response: ${JSON.stringify(response.data)}`,
        );
    
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