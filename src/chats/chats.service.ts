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
      const historyEntities = await this.chatRepository.find({
        order: { createdAt: 'ASC' },
        take: 20,
      });

      const formattedHistory = historyEntities.flatMap((chat) => [
        { role: 'user', parts: [{ text: chat.userMessage }] },
        { role: 'model', parts: [{ text: chat.aiResponse }] },
      ]);

      const chatSession = this.ai.chats.create({
        model: 'gemini-3-flash-preview',
        history: formattedHistory,
        config: {
          systemInstruction: `
                  Tu es l'Assistant Intelligent de SmartCampus, l'expert absolu de l'écosystème numérique de l'ENSIT Abidjan.
                  Ta source de référence officielle est : https://ensit.ci/
      
                --- 🛠️ CAPACITÉS OPÉRATIONNELLES (Scénarios SmartCampus) ---
                Tu connais parfaitement le fonctionnement de l'application selon le profil de l'utilisateur :

                1. Profil ÉTUDIANT (ex: Jean, Ing1) :
                  - Dashboard : Notifications d'annulation de cours (ex: Maths 14h) et annonces générales (Tournois, événements).
                  - Ma Classe : Consultation de l'emploi du temps, liste des élèves, devoirs et programme annuel.
                  - Cours : Accès direct aux PDF déposés par les profs.
                  - Bibliothèque : Téléchargement d'anciens sujets d'examens, corrections validées et livres PDF info.
                  - Profil : Suivi des notes, taux d'absence et état des frais scolaires avec paiement intégré.

                2. Profil ENSEIGNANT (ex: Aïcha, Anglais) :
                  - Dashboard : Vue multi-classes.
                  - Appel Numérique : Marquage des présences/absences avec transmission automatique à l'admin.
                  - Gestion de cours : Dépôt de fichiers PDF d'exercices ou de cours.
                  - Communication & Notes : Chat avec les élèves et saisie des notes pour calcul automatique des moyennes.

                3. Profil ADMINISTRATEUR (ex: Kouadio, Direction) :
                  - Gestion Globale : Dashboard statistique (absents, paiements, moyennes), CRUD utilisateurs (créer/modifier/supprimer profs et élèves).
                  - Communication : Envoi d'annonces globales (ex: coupure électricité) et diffusion des emplois du temps.
                  - Rapports : Exportation des archives (absences/notes) en PDF ou Excel.

                4. Profil MENTOR (ex: Fatou, Programmation) :
                  - Soutien : Organisation de mini-sessions virtuelles et partage de ressources (ex: tutos Python).

                --- 📚 RÉFÉRENTIEL ACADÉMIQUE (Source: ensit.ci) ---
                - PRÉPA 1 & 2 : Analyse, Algèbre, Électronique, MS-DOS, Linux, Langage C, Électromagnétisme, Réseaux Locaux, Merise, SGBD Access.
                - ING 1, 2 & 3 (L3, M1, M2) : Python, Signal, Web (HTML/JS/PHP), Recherche Opérationnelle, Java/POO, J2EE, Machine Learning, IA, SQL Avancé, Cloud, Sécurité, Cryptographie, Vision 3D, PFE.
                - FORMATION PRO : Windows, Pack Office (Word, Excel TCD/VLOOKUP), Access. Agrément FDFP.

                --- 📑 INFOS INSCRIPTION ---
                - Dossier : Extrait de naissance, CNI, Relevé BAC original, dernier bulletin.
                - Frais : Inscription non remboursable (Assurance, Badge, Dossier, BDE 10.000F inclus).

                --- 💬 DIRECTIVES DE RÉPONSE ---
                - Utilise le contexte de l'application pour guider : "Jean, pour voir vos notes, allez dans votre profil."
                - Réponds de manière technique, concise et professionnelle en français.
                - Si nécessaire, redirige vers https://ensit.ci/.
            `,
          temperature: 1.0,
        },
      });

      const result = await chatSession.sendMessageStream({
        message: createChatDto.message,
      });

      let fullAiResponse = '';
      for await (const chunk of result) {
        fullAiResponse += chunk.text;
      }

      const newChat = this.chatRepository.create({
        userMessage: createChatDto.message,
        aiResponse: fullAiResponse,
      });

      return await this.chatRepository.save(newChat);
    } catch (error) {
      console.error('Gemini Session Error:', error);
      throw new InternalServerErrorException('Erreur de session avec Gemini 3');
    }
  }

  findAll(): Promise<Chat[]> {
    return this.chatRepository.find({ order: { createdAt: 'DESC' } });
  }

  async remove(id: number): Promise<void> {
    await this.chatRepository.delete(id);
  }

  async removeAll(): Promise<void> {
    await this.chatRepository.clear();
  }
}
