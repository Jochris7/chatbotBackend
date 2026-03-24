import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateChatDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Le message doit contenir au moins 3 caractères.' })
  message: string;
}
