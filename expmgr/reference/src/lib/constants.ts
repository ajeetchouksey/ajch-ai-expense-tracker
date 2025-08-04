import { Category, UserSettings } from './types';

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food & Dining', icon: 'Utensils', color: '#FF6B6B', type: 'expense' },
  { id: 'transport', name: 'Transportation', icon: 'Car', color: '#4ECDC4', type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#45B7D1', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', icon: 'GameController', color: '#96CEB4', type: 'expense' },
  { id: 'bills', name: 'Bills & Utilities', icon: 'Receipt', color: '#FFEAA7', type: 'expense' },
  { id: 'healthcare', name: 'Healthcare', icon: 'Heart', color: '#DDA0DD', type: 'expense' },
  { id: 'education', name: 'Education', icon: 'BookOpen', color: '#98D8C8', type: 'expense' },
  { id: 'emi', name: 'EMI & Loans', icon: 'CreditCard', color: '#FF8C42', type: 'expense' },
  { id: 'travel', name: 'Travel', icon: 'Airplane', color: '#74B9FF', type: 'expense' },
  { id: 'fitness', name: 'Fitness & Sports', icon: 'Heart', color: '#00B894', type: 'expense' },
  { id: 'subscriptions', name: 'Subscriptions', icon: 'CreditCard', color: '#A29BFE', type: 'expense' },
  { id: 'gifts', name: 'Gifts & Donations', icon: 'Gift', color: '#FD79A8', type: 'expense' },
  { id: 'pet', name: 'Pet Care', icon: 'Heart', color: '#FDCB6E', type: 'expense' },
  { id: 'home', name: 'Home & Garden', icon: 'House', color: '#6C5CE7', type: 'expense' },
  { id: 'other', name: 'Other', icon: 'Package', color: '#A0A0A0', type: 'expense' },
];

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Salary', icon: 'Briefcase', color: '#2ECC71', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: 'Monitor', color: '#3498DB', type: 'income' },
  { id: 'investment', name: 'Investment', icon: 'TrendingUp', color: '#9B59B6', type: 'income' },
  { id: 'gift', name: 'Gift', icon: 'Gift', color: '#E74C3C', type: 'income' },
  { id: 'other-income', name: 'Other', icon: 'PlusCircle', color: '#34495E', type: 'income' },
];

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

export const COUNTRIES = [
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
  { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', currency: 'EUR', flag: '🇩🇪' },
  { code: 'FR', name: 'France', currency: 'EUR', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', currency: 'JPY', flag: '🇯🇵' },
  { code: 'CN', name: 'China', currency: 'CNY', flag: '🇨🇳' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF', flag: '🇨🇭' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', flag: '🇸🇬' },
  { code: 'KR', name: 'South Korea', currency: 'KRW', flag: '🇰🇷' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', flag: '🇲🇽' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', flag: '🇸🇦' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', flag: '🇦🇪' },
];

export const DEFAULT_SETTINGS: UserSettings = {
  currency: 'USD',
  country: 'US',
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  aiRecommendations: true,
  theme: 'professional',
  defaultTags: ['personal', 'business', 'recurring', 'emergency'],
  notifications: {
    budgetAlerts: true,
    goalReminders: true,
    emiDue: true,
    weeklyReports: false,
  },
};

export const COUNTRY_SAVINGS_ADVICE = {
  US: {
    emergency: 6,
    retirement: 15,
    tips: ['Maximize 401(k) matching', 'Consider Roth IRA', 'Build emergency fund first'],
    savingsRate: 20,
    investmentTips: ['S&P 500 index funds', 'Dollar-cost averaging', 'Tax-advantaged accounts'],
  },
  IN: {
    emergency: 12,
    retirement: 20,
    tips: ['Use PPF for tax savings', 'Consider ELSS funds', 'Invest in SIP'],
    savingsRate: 30,
    investmentTips: ['Mutual fund SIPs', 'PPF and EPF', 'Real estate investment'],
  },
  GB: {
    emergency: 6,
    retirement: 12,
    tips: ['Use ISA allowance', 'Consider pension contributions', 'Emergency fund priority'],
    savingsRate: 15,
    investmentTips: ['Stocks & Shares ISA', 'Workplace pension', 'Premium Bonds'],
  },
  CA: {
    emergency: 6,
    retirement: 15,
    tips: ['Maximize RRSP', 'Use TFSA effectively', 'Emergency fund first'],
    savingsRate: 18,
    investmentTips: ['RRSP contributions', 'TFSA growth', 'Canadian index funds'],
  },
  AU: {
    emergency: 6,
    retirement: 12,
    tips: ['Maximize superannuation', 'Consider salary sacrifice', 'Build emergency fund'],
    savingsRate: 15,
    investmentTips: ['Superannuation growth', 'ETF investments', 'Property investment'],
  },
  DE: {
    emergency: 6,
    retirement: 15,
    tips: ['Use Riester pension', 'Consider ETF savings', 'Emergency fund priority'],
    savingsRate: 17,
    investmentTips: ['ETF savings plans', 'Riester pension', 'Real estate funds'],
  },
  FR: {
    emergency: 6,
    retirement: 15,
    tips: ['Use PEA account', 'Consider life insurance', 'Build emergency reserves'],
    savingsRate: 16,
    investmentTips: ['PEA investments', 'Assurance vie', 'SCPI real estate'],
  },
  JP: {
    emergency: 12,
    retirement: 20,
    tips: ['Use NISA account', 'Consider iDeCo', 'Build cash reserves'],
    savingsRate: 25,
    investmentTips: ['NISA investments', 'iDeCo pension', 'Japanese government bonds'],
  },
  CN: {
    emergency: 12,
    retirement: 25,
    tips: ['Diversify investments', 'Build cash reserves', 'Consider real estate'],
    savingsRate: 35,
    investmentTips: ['A-share stocks', 'Real estate', 'Government bonds'],
  },
  CH: {
    emergency: 8,
    retirement: 15,
    tips: ['Maximize pillar 3a', 'Consider global investments', 'High savings rate'],
    savingsRate: 20,
    investmentTips: ['Pillar 3a contributions', 'Global equity funds', 'Real estate'],
  },
  SG: {
    emergency: 8,
    retirement: 20,
    tips: ['Use CPF effectively', 'Invest in REITs', 'Build emergency fund'],
    savingsRate: 25,
    investmentTips: ['Singapore REITs', 'CPF investments', 'Blue-chip stocks'],
  },
  KR: {
    emergency: 10,
    retirement: 25,
    tips: ['Use pension savings', 'Invest regularly', 'Real estate consideration'],
    savingsRate: 30,
    investmentTips: ['Korean equity funds', 'Real estate funds', 'Pension savings'],
  },
  BR: {
    emergency: 8,
    retirement: 20,
    tips: ['Invest in fixed income', 'Consider Tesouro Direto', 'Build savings'],
    savingsRate: 15,
    investmentTips: ['Tesouro Direto', 'CDB investments', 'Real estate funds'],
  },
  MX: {
    emergency: 8,
    retirement: 20,
    tips: ['Use AFORE effectively', 'Invest in ETFs', 'Build emergency fund'],
    savingsRate: 18,
    investmentTips: ['Mexican ETFs', 'AFORE contributions', 'Real estate investment'],
  },
  SA: {
    emergency: 10,
    retirement: 25,
    tips: ['Diversify internationally', 'Islamic finance options', 'Real estate focus'],
    savingsRate: 25,
    investmentTips: ['Sharia-compliant funds', 'Real estate', 'International diversification'],
  },
  AE: {
    emergency: 8,
    retirement: 20,
    tips: ['International investments', 'Real estate focus', 'Tax advantages'],
    savingsRate: 22,
    investmentTips: ['International funds', 'UAE real estate', 'Gold investments'],
  },
};

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  const currencyInfo = CURRENCIES.find(c => c.code === currency);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (date: string, format = 'MM/DD/YYYY'): string => {
  const dateObj = new Date(date);
  switch (format) {
    case 'DD/MM/YYYY':
      return dateObj.toLocaleDateString('en-GB');
    case 'YYYY-MM-DD':
      return dateObj.toISOString().split('T')[0];
    default:
      return dateObj.toLocaleDateString('en-US');
  }
};

export const getDateRange = (period: 'week' | 'month' | 'year'): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date();
  
  switch (period) {
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
  }
  
  return { start, end: now };
};

export const DEFAULT_TAGS = [
  'personal', 'business', 'recurring', 'emergency', 'travel', 'gift', 
  'subscription', 'one-time', 'essential', 'luxury', 'investment', 'tax-deductible'
];

export const PAYMENT_METHODS = [
  'Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Digital Wallet', 
  'UPI', 'Check', 'PayPal', 'Apple Pay', 'Google Pay', 'Cryptocurrency'
];

export const DEFAULT_TRANSACTION_FIELDS = {
  tags: [],
  location: '',
  paymentMethod: '',
  currency: 'USD'
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const calculateNextDue = (startDate: string, frequency: string): string => {
  const start = new Date(startDate);
  const now = new Date();
  
  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    case 'monthly':
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth.toISOString().split('T')[0];
    case 'yearly':
      const nextYear = new Date(now);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      return nextYear.toISOString().split('T')[0];
    default:
      return new Date().toISOString().split('T')[0];
  }
};