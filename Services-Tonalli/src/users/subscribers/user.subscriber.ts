import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  LoadEvent,
  DataSource,
} from 'typeorm';
import { User } from '../entities/user.entity';
import { EncryptionService } from '../../common/encryption.service';
import { Injectable } from '@nestjs/common';

@Injectable()
@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly encryptionService: EncryptionService,
  ) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  beforeInsert(event: InsertEvent<User>) {
    this.encryptSecretKey(event.entity);
  }

  beforeUpdate(event: UpdateEvent<User>) {
    this.encryptSecretKey(event.entity);
  }

  afterLoad(entity: User) {
    this.decryptSecretKey(entity);
  }

  private encryptSecretKey(user: User) {
    if (user && user.stellarSecretKey && !user.stellarSecretKey.includes(':')) {
      user.stellarSecretKey = this.encryptionService.encrypt(user.stellarSecretKey);
    }
  }

  private decryptSecretKey(user: User) {
    if (user && user.stellarSecretKey && user.stellarSecretKey.includes(':')) {
      user.stellarSecretKey = this.encryptionService.decrypt(user.stellarSecretKey);
    }
  }
}
