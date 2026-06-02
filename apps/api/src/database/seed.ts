import '../config/load-env';
import { DataSource, Repository } from 'typeorm';
import { AppDataSource } from './data-source';
import {
  Currency,
  Expense,
  ExpensePayer,
  ExpenseSplit,
  Group,
  GroupMember,
  SplitType,
  User,
} from './entities';
import { hashPassword } from '../auth/auth-password';

const baseAdmin = {
  email: 'admin@example.com',
  nickname: 'مدیر سیستم',
  password: 'Password123!',
};

async function seed() {
  const seedDataSource = new DataSource({
    ...AppDataSource.options,
    synchronize: false,
  });
  await seedDataSource.initialize();

  const userRepository = seedDataSource.getRepository(User);
  const groupRepository = seedDataSource.getRepository(Group);
  const groupMemberRepository = seedDataSource.getRepository(GroupMember);
  const expenseRepository = seedDataSource.getRepository(Expense);
  const expensePayerRepository = seedDataSource.getRepository(ExpensePayer);
  const expenseSplitRepository = seedDataSource.getRepository(ExpenseSplit);

  const existing = await userRepository.count();
  await ensureBaseAdmin(userRepository);

  if (existing > 0) {
    console.log('Seed skipped: users already exist');
    await seedDataSource.destroy();
    return;
  }

  const ali = await userRepository.save(
    userRepository.create({
      phone: '09120000001',
      nickname: 'علی',
      passwordHash: hashPassword('Password123!'),
    }),
  );

  const sara = await userRepository.save(
    userRepository.create({
      email: 'sara@example.com',
      nickname: 'سارا',
      passwordHash: hashPassword('Password123!'),
    }),
  );

  const group = await groupRepository.save(
    groupRepository.create({
      name: 'گروه تست',
      currency: Currency.TOMAN,
      description: 'Seed data for local development',
    }),
  );

  const [aliMember, saraMember] = await groupMemberRepository.save([
    groupMemberRepository.create({
      userId: ali.id,
      groupId: group.id,
      isAdmin: true,
    }),
    groupMemberRepository.create({
      userId: sara.id,
      groupId: group.id,
      isAdmin: false,
    }),
  ]);

  const expense = await expenseRepository.save(
    expenseRepository.create({
      groupId: group.id,
      description: 'شام',
      amount: '500000',
      currency: Currency.TOMAN,
      splitType: SplitType.EQUAL,
      date: new Date(),
    }),
  );

  await expensePayerRepository.save(
    expensePayerRepository.create({
      expenseId: expense.id,
      userId: ali.id,
      groupMemberId: aliMember.id,
      amount: '500000',
    }),
  );

  await expenseSplitRepository.save([
    expenseSplitRepository.create({
      expenseId: expense.id,
      userId: ali.id,
      groupMemberId: aliMember.id,
      value: '250000',
    }),
    expenseSplitRepository.create({
      expenseId: expense.id,
      userId: sara.id,
      groupMemberId: saraMember.id,
      value: '250000',
    }),
  ]);

  console.log('Seed completed');
  await seedDataSource.destroy();
}

async function ensureBaseAdmin(userRepository: Repository<User>) {
  const existingAdmin = await userRepository.findOne({
    where: { email: baseAdmin.email },
  });

  if (existingAdmin) {
    existingAdmin.isAdmin = true;
    existingAdmin.isBanned = false;
    existingAdmin.nickname = existingAdmin.nickname || baseAdmin.nickname;
    await userRepository.save(existingAdmin);
    console.log(`Base admin ensured: ${baseAdmin.email}`);
    return existingAdmin;
  }

  const admin = await userRepository.save(
    userRepository.create({
      email: baseAdmin.email,
      nickname: baseAdmin.nickname,
      isEmailVerified: true,
      isAdmin: true,
      isBanned: false,
      passwordHash: hashPassword(baseAdmin.password),
    }),
  );

  console.log(`Base admin created: ${baseAdmin.email} / ${baseAdmin.password}`);
  return admin;
}

seed().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
