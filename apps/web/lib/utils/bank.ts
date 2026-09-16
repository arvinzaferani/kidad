export interface BankInfo {
  bankName: string;
  cardNames: string[];
}

export const BANKS: BankInfo[] = [
  { bankName: 'ملی ایران', cardNames: ['603799'] },
  { bankName: 'صادرات ایران', cardNames: ['603769'] },
  { bankName: 'تجارت', cardNames: ['585983', '627353'] },
  { bankName: 'ملت', cardNames: ['610433'] },
  { bankName: 'سپه', cardNames: ['589210'] },
  { bankName: 'کشاورزی', cardNames: ['603770'] },
  { bankName: 'رفاه کارگران', cardNames: ['589463'] },
  { bankName: 'مسکن', cardNames: ['628023'] },
  { bankName: 'پست بانک ایران', cardNames: ['627760'] },
  { bankName: 'توسعه صادرات ایران', cardNames: ['627648'] },
  { bankName: 'اقتصاد نوین', cardNames: ['627412'] },
  { bankName: 'پارسیان', cardNames: ['622106'] },
  { bankName: 'پاسارگاد', cardNames: ['502229'] },
  { bankName: 'کارآفرین', cardNames: ['627488'] },
  { bankName: 'سامان', cardNames: ['621986'] },
  { bankName: 'سینا', cardNames: ['639346'] },
  { bankName: 'شهر', cardNames: ['502806'] },
  { bankName: 'دی', cardNames: ['502938'] },
  { bankName: 'انصار', cardNames: ['639199'] },
  { bankName: 'گردشگری', cardNames: ['505416'] },
  { bankName: 'ایران‌زمین', cardNames: ['505785'] },
  { bankName: 'خاورمیانه', cardNames: ['585949'] },
  { bankName: 'سپه-قرض‌الحسنه', cardNames: ['639607'] },
  { bankName: 'قرض‌الحسنه رسالت', cardNames: ['504172'] },
  { bankName: 'توسعه تعاون', cardNames: ['502908'] },
  { bankName: 'آینده', cardNames: ['636214'] },
];

export function detectBank(cardNumber: string): string | null {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 6) return null;
  const prefix = digits.slice(0, 6);
  const bank = BANKS.find((b) => b.cardNames.some((name) => name === prefix));
  return bank ? bank.bankName : 'نامشخص';
}
