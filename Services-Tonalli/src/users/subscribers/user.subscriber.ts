import {
  EntitySubscriberInterface,
  EventSubscriber,
  LoadEvent,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { User } from '../entities/user.entity';
import { EncryptionService } from '../../common/encryption.service';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  constructor(
    private readonly encryptionService: EncryptionService,
  ) {}

  listenTo() {
    return User;
  }

  afterLoad(entity: User): void {
    if (entity.stellarSecretKey && this.encryptionService.isEncrypted(entity.stellarSecretKey)) {
      entity.stellarSecretKey = this.encryptionService.decrypt(entity.stellarSecretKey);
    }
  }

  beforeInsert(event: InsertEvent<User>): void {
    const entity = event.entity;
    if (entity.stellarSecretKey && !this.encryptionService.isEncrypted(entity.stellarSecretKey)) {
      entity.stellarSecretKey = this.encryptionService.encrypt(entity.stellarSecretKey);
    }
  }

  beforeUpdate(event: UpdateEvent<User>): void {
    const entity = event.entity;
    if (entity?.stellarSecretKey && !this.encryptionService.isEncrypted(entity.stellarSecretKey)) {
      entity.stellarSecretKey = this.encryptionService.encrypt(entity.stellarSecretKey);
    }
  }
}