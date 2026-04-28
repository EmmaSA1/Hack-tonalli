import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { EncryptionService } from '../common/encryption.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const encryptionService = app.get(EncryptionService);
  const userRepository = dataSource.getRepository(User);

  console.log('Starting re-encryption process...');

  const users = await userRepository.find({
    where: {
      stellarSecretKey: require('typeorm').Not(require('typeorm').IsNull()),
    },
  });

  console.log(`Found ${users.length} users with stellarSecretKey.`);

  let updatedCount = 0;
  for (const user of users) {
    // Only encrypt if it's not already encrypted (doesn't contain ':')
    if (user.stellarSecretKey && !user.stellarSecretKey.includes(':')) {
      user.stellarSecretKey = encryptionService.encrypt(user.stellarSecretKey);
      await userRepository.save(user);
      updatedCount++;
    }
  }

  console.log(`Re-encryption complete. Updated ${updatedCount} users.`);
  await app.close();
}

bootstrap().catch((err) => {
  console.error('Re-encryption failed:', err);
  process.exit(1);
});
