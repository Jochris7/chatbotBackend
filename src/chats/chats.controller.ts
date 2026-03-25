import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createChatDto: CreateChatDto) {
    return this.chatsService.create(createChatDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.chatsService.findAll();
  }

  @Delete('all')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAll() {
    return this.chatsService.removeAll();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.chatsService.remove(+id);
  }
}
