import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TokenizeCardDto } from '../../def/types/cards/createCard.type';
import { InjectRepository } from '@nestjs/typeorm';
import { Card } from '../../entity/card.entity';
import { Repository } from 'typeorm';
import { User } from '../../entity/user.entity';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PokApiService } from '../external/pok-api.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CardsService {
  private baseUrl: string | null = null;
  constructor(
    @InjectRepository(Card)
    private cardsRepository: Repository<Card>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private httpService: HttpService,
    private readonly configService: ConfigService,

    @Inject()
    private readonly pokApiService: PokApiService,
    private readonly redisService: RedisService,
  ) {
    this.baseUrl = this.configService.get<string>('POK_STAGE_BASE_URL') ?? '';
  }

  async tokenizeGuestCard(userId: string, dto: TokenizeCardDto) {
    const tokenizedGuestCard = await this.pokApiService.tokenizeGuestCard(dto);
    console.log('Card coming from POK Service: ', tokenizedGuestCard);

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    console.log('User coming from DB: ', user);
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);

    const myDbSavedCard = await this.cardsRepository.save({
      pokCardId: tokenizedGuestCard.id,
      hiddenNumber: tokenizedGuestCard.hiddenNumber,
      isDefault: false, // set to false at first (with radiobutton in front user can set default on his own)
      user,
    });
    console.log('My DB Saved Card: ', myDbSavedCard);
  }

  async setupTokenized3DS(
    mySavedCardId: string,
    sdkOrderId: string,
    userId: string,
  ) {
    // fetch the card from my db to get the creditDebitCardId / pokCardId
    const card = await this.cardsRepository.findOne({
      where: { id: mySavedCardId, user: { id: userId } },
    });
    if (!card)
      throw new NotFoundException(`Card with id ${mySavedCardId} not found!`);
    const creditDebitCardId = card.pokCardId;
    console.log('Entering setUpTokenized with redis Service...');
    console.log('My saved cardID: ', mySavedCardId);
    return this.redisService.withResourceLock(mySavedCardId, async () => {
      const data = await this.pokApiService.setupTokenized3DS(
        creditDebitCardId,
        sdkOrderId,
      );
      console.log('Setup Tokenized 3DS Response: ', data);
      return data;
    });
  }
  // async checkCardExistence(
  //   cardNumber: string,
  //   clientId: string,
  // ): Promise<boolean> {
  //   const card = await this.cardsRepository.findOne({
  //     where: { cardNumber, user: { id: clientId } },
  //   });
  //   if (!card) {
  //     throw new NotFoundException(`You do not own any card with this number!`);
  //   }
  //   return true;
  // }

  async useDefaultCard(userId: string) {
    return this.cardsRepository.findOne({
      where: { user: { id: userId }, isDefault: true },
    });
  }

  async setDefaultCard(cardId: string, userId: string) {
    const card = await this.cardsRepository.findOne({
      where: { id: cardId, user: { id: userId } },
    });
    if (!card) throw new NotFoundException(`Card with id ${cardId} not found!`);
    await this.cardsRepository.update(
      { user: { id: userId }, isDefault: true },
      { isDefault: false },
    );
    card.isDefault = true;
    return this.cardsRepository.save(card);
  }

  // {{baseUrl}}/credit-debit-cards/{{creditDebitCardId}}/check-3ds-enrollment
  async check3dsEnrollment(
    userId: string,
    payload: {
      creditDebitCardId: string;
      sdkOrderId: string;
      payerAuthSetupReferenceId: string;
      amount: number;
      currency: string;
    },
  ) {
    const card = await this.cardsRepository.findOne({
      where: { pokCardId: payload.creditDebitCardId, user: { id: userId } }, // id or pokCardId check ?
    });
    if (!card)
      throw new NotFoundException(
        `Card with id ${payload.creditDebitCardId} not found!`,
      );
    const response = await this.pokApiService.check3dsEnrollment(
      payload.creditDebitCardId,
      {
        csAuthentication: {
          amount: payload.amount,
          currency: payload.currency,
        },
        sdkOrderId: payload.sdkOrderId,
        payerAuthSetupReferenceId: payload.payerAuthSetupReferenceId,
      },
    );
    return response; // means return payerAuthenticationEnrollment
  }

  async confirmPayment(
    userId: string,
    payload: {
      sdkOrderId: string;
      creditCardId: string;
      consumerAuthenticationInformation: any;
    },
  ) {
    const card = await this.cardsRepository.findOne({
      where: { pokCardId: payload.creditCardId, user: { id: userId } }, // pokCardId or id check ?
    });
    if (!card)
      throw new NotFoundException(
        `Card with id ${payload.creditCardId} not found!`,
      );
    const confirmedOrder = await this.pokApiService.guestConfirm(
      payload.sdkOrderId,
      payload.creditCardId,
      payload.consumerAuthenticationInformation,
    );
    return confirmedOrder; // means return sdkOrder
  }

  async listUserCards(userId: string) {
    return this.cardsRepository.find({
      where: { user: { id: userId } },
      order: { isDefault: 'DESC' },
    });
  }
}
