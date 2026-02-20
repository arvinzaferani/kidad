import '../config/load-env';
import { DataSource } from 'typeorm';
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

  await groupMemberRepository.save([
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
      amount: '500000',
    }),
  );

  await expenseSplitRepository.save([
    expenseSplitRepository.create({
      expenseId: expense.id,
      userId: ali.id,
      value: '250000',
    }),
    expenseSplitRepository.create({
      expenseId: expense.id,
      userId: sara.id,
      value: '250000',
    }),
  ]);

  console.log('Seed completed');
  await seedDataSource.destroy();
}

seed().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
