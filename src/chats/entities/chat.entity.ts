import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  userMessage: string;

  @Column({ type: 'text' })
  aiResponse: string;

  @CreateDateColumn()
  createdAt: Date;
}
