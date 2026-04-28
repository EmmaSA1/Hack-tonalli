import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { Quiz } from '../lessons/entities/quiz.entity';
import { Progress } from '../progress/entities/progress.entity';
import { NFTCertificate } from '../progress/entities/nft-certificate.entity';
import { Streak } from '../users/entities/streak.entity';
import { Chapter } from '../chapters/entities/chapter.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'tonalli',
  entities: [User, Lesson, Quiz, Progress, NFTCertificate, Streak, Chapter],
  synchronize: true,
  logging: false,
});

async function resetPasswords() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);

  const accounts = [
    { email: 'admin@tonalli.mx', password: 'Admin2024!', role: 'admin' as const, username: 'TonalliAdmin' },
    { email: 'demo@tonalli.mx',  password: 'Demo2024!',  role: 'user'  as const, username: 'CryptoAzteca' },
  ];

  for (const acc of accounts) {
    const hashed = await bcrypt.hash(acc.password, 10);
    let user = await userRepo.findOne({ where: { email: acc.email } });

    if (user) {
      user.password = hashed;
      user.role = acc.role;
      await userRepo.save(user);
      console.log(`✅ Password updated: ${acc.email} → ${acc.password}  (role: ${acc.role})`);
    } else {
      user = userRepo.create({
        email: acc.email,
        username: acc.username,
        displayName: acc.role === 'admin' ? 'Administrador' : 'Demo User',
        password: hashed,
        city: 'Ciudad de México',
        role: acc.role,
        xp: 0, totalXp: 0, currentStreak: 0,
        stellarPublicKey: `G${acc.role.toUpperCase()}_DEMO`,
        stellarSecretKey: `S${acc.role.toUpperCase()}_DEMO`,
      });
      await userRepo.save(user);
      console.log(`✅ User created: ${acc.email} → ${acc.password}  (role: ${acc.role})`);
    }
  }

  console.log('\n📋 Credenciales listas:');
  console.log('   Admin  → admin@tonalli.mx  /  Admin2024!');
  console.log('   Usuario → demo@tonalli.mx   /  Demo2024!');

  await AppDataSource.destroy();
}

resetPasswords().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
