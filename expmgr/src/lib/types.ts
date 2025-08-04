
export interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  type: 'expense' | 'income';
  createdAt: string;
  recurringId?: string;
  isEMI?: boolean;
  tags: string[];
  location?: string;
  paymentMethod?: string;
  currency: string;
  goalId?: string;
  emiDetails?: {
    totalInstallments: number;
    currentInstallment: number;
    principal: number;
    interest: number;
  };
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget?: number;
  type: 'expense' | 'income';
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  spent: number;
  alertThreshold: number; // Percentage (0-100)
  isActive: boolean;
}

export interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  deadline: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  isCompleted: boolean;
  createdAt: string;
  tags: string[];
  currency: string;
  country: string;
}

export interface RecurringTransaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  type: 'expense' | 'income';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  nextDue: string;
  isActive: boolean;
  lastProcessed?: string;
  isEMI?: boolean;
  emiDetails?: {
    totalInstallments: number;
    currentInstallment: number;
    principal: number;
    interest: number;
    loanAmount: number;
  };
}

export interface UserSettings {
  currency: string;
  country: string;
  language: string;
  timezone: string;
  dateFormat: string;
  locale: string;
  aiRecommendations: boolean;
  theme: 'default' | 'professional' | 'colorful' | 'minimal';
  defaultTags: string[];
  notifications: {
    budgetAlerts: boolean;
    goalReminders: boolean;
    emiDue: boolean;
    weeklyReports: boolean;
  };
}

export interface AIRecommendation {
  id: string;
  type: 'savings' | 'budget' | 'goal' | 'spending';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  amount?: number;
  confidence: number;
  createdAt: string;
  isRead: boolean;
  actionItems?: string[];
}

export interface EMISummary {
  totalEMIs: number;
  totalMonthlyPayment: number;
  totalOutstanding: number;
  upcomingPayments: {
    description: string;
    amount: number;
    dueDate: string;
    category: string;
  }[];
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  description?: string;
}

export interface Prediction {
  category: string;
  predictedAmount: number;
  confidence: number;
  period: string;
}

export interface SpendingInsight {
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  category?: string;
  amount?: number;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  topSpendingCategory: string;
  budgetUsage: number;
  savingsRate: number;
  totalSavings: number;
  monthlyEMI: number;
}

export interface ExpensePrediction {
  category: string;
  predictedAmount: number;
  actualAmount?: number;
  accuracy: number;
  confidence: 'low' | 'medium' | 'high';
  period: 'next_week' | 'next_month' | 'next_quarter';
  trend: 'increasing' | 'decreasing' | 'stable';
  factors: string[];
}

export interface FinancialHealthScore {
  overall: number; // 0-100
  breakdown: {
    savings: number;
    spending: number;
    budgeting: number;
    debt: number;
    goals: number;
  };
  insights: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  lastCalculated: string;
}

export interface CategorySuggestion {
  confidence: number;
  suggestedCategory: string;
  reason: string;
  alternatives: string[];
}

export interface MCPProvider {
  // ...existing code...
}

export interface FinancialAdvice {
  // ...existing code...
}
