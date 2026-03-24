import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatsService {
  private ai: GoogleGenAI;

  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.ai = new GoogleGenAI({ apiKey });
  }

  async create(createChatDto: CreateChatDto): Promise<Chat> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            role: 'user',
            parts: [{ text: createChatDto.message }],
          },
        ],
      });

      // On récupère le texte de la réponse
      const aiResponse = response.text;

      // Sauvegarde TypeORM
      const newChat = this.chatRepository.create({
        userMessage: createChatDto.message,
        aiResponse: aiResponse,
      });

      return await this.chatRepository.save(newChat);
    } catch (error) {
      // Affiche l'erreur complète en console pour le debug
      console.error('Erreur Gemini détaillée:', JSON.stringify(error, null, 2));
      throw new InternalServerErrorException(
        "Erreur lors de l'appel à l'API Gemini.",
      );
    }
  }

  findAll(): Promise<Chat[]> {
    return this.chatRepository.find({ order: { createdAt: 'DESC' } });
  }

  /*findOne(id: number): Promise<Chat> {
    return this.chatRepository.findOneBy({ id });
  }*/

  async remove(id: number): Promise<void> {
    await this.chatRepository.delete(id);
  }
}
