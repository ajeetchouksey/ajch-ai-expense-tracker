import { Transaction, DashboardStats, Prediction, SpendingInsight, SavingGoal, Budget, RecurringTransaction, EMISummary } from './types';
import { getDateRange } from './constants';

export const calculateDashboardStats = (
  transactions: Transaction[], 
  savingGoals: SavingGoal[] = [], 
  budgets: Budget[] = []
): DashboardStats => {
  const currentMonth = getDateRange('month');
  const monthlyTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= currentMonth.start && transactionDate <= currentMonth.end;
  });

  const totalIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const expensesByCategory = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const topSpendingCategory = Object.entries(expensesByCategory)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

  // Calculate savings rate
  const savingsAmount = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (savingsAmount / totalIncome) * 100 : 0;

  // Calculate total savings from goals
  const totalSavings = savingGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);

  // Calculate monthly EMI
  const monthlyEMI = monthlyTransactions
    .filter(t => t.type === 'expense' && t.isEMI)
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate budget usage
  let budgetUsage = 0;
  if (budgets.length > 0) {
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => {
      const categorySpent = expensesByCategory[b.categoryId] || 0;
      return sum + categorySpent;
    }, 0);
    budgetUsage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  }

  return {
    totalIncome,
    totalExpenses,
    netIncome: totalIncome - totalExpenses,
    topSpendingCategory,
    budgetUsage,
    savingsRate,
    totalSavings,
    monthlyEMI,
  };
};

export const getCategorySpending = (transactions: Transaction[], period: 'week' | 'month' | 'year' = 'month') => {
  const dateRange = getDateRange(period);
  const periodTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
  });

  return periodTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
};

export const getSpendingTrend = (transactions: Transaction[], days: number = 30) => {
  const trends: { date: string; amount: number }[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayExpenses = transactions
      .filter(t => t.type === 'expense' && t.date === dateStr)
      .reduce((sum, t) => sum + t.amount, 0);
    
    trends.push({
      date: dateStr,
      amount: dayExpenses,
    });
  }
  
  return trends;
};

export const calculateEMISummary = (recurringTransactions: RecurringTransaction[]): EMISummary => {
  const emiTransactions = recurringTransactions.filter(t => t.isEMI && t.isActive);
  
  const totalMonthlyPayment = emiTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  const totalOutstanding = emiTransactions.reduce((sum, t) => {
    if (t.emiDetails) {
      const remaining = t.emiDetails.totalInstallments - t.emiDetails.currentInstallment;
      return sum + (remaining * t.amount);
    }
    return sum;
  }, 0);

  const upcomingPayments = emiTransactions
    .map(t => ({
      description: t.description,
      amount: t.amount,
      dueDate: t.nextDue,
      category: t.category,
    }))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return {
    totalEMIs: emiTransactions.length,
    totalMonthlyPayment,
    totalOutstanding,
    upcomingPayments,
  };
};

export const calculateGoalProgress = (goals: SavingGoal[]) => {
  return goals.map(goal => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const daysLeft = Math.ceil(
      (new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    const monthlyRequired = daysLeft > 0 
      ? Math.max(0, (goal.targetAmount - goal.currentAmount) / (daysLeft / 30))
      : 0;

    return {
      ...goal,
      progress: Math.min(100, progress),
      daysLeft: Math.max(0, daysLeft),
      monthlyRequired,
      isOnTrack: progress >= (1 - daysLeft / (new Date(goal.targetDate).getTime() - new Date(goal.createdAt).getTime()) * (1000 * 60 * 60 * 24)) * 100,
    };
  });
};

export const calculateBudgetStatus = (budgets: Budget[], transactions: Transaction[]) => {
  const currentMonth = getDateRange('month');
  const monthlyTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= currentMonth.start && transactionDate <= currentMonth.end;
  });

  return budgets.map(budget => {
    const categoryTransactions = monthlyTransactions.filter(t => t.category === budget.categoryId && t.type === 'expense');
    const spent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
    const percentage = (spent / budget.amount) * 100;
    const remaining = Math.max(0, budget.amount - spent);

    return {
      ...budget,
      spent,
      percentage: Math.min(100, percentage),
      remaining,
      isOverBudget: spent > budget.amount,
      isNearLimit: percentage >= budget.alertThreshold,
    };
  });
};

export const predictNextMonthSpending = (transactions: Transaction[]): Prediction[] => {
  const last3Months = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return transactionDate >= threeMonthsAgo && t.type === 'expense';
  });

  const categoryAverages = last3Months.reduce((acc, t) => {
    if (!acc[t.category]) {
      acc[t.category] = [];
    }
    acc[t.category].push(t.amount);
    return acc;
  }, {} as Record<string, number[]>);

  return Object.entries(categoryAverages).map(([category, amounts]) => {
    const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - average, 2), 0) / amounts.length;
    const confidence = Math.max(0.1, Math.min(0.9, 1 - (variance / (average * average)) / 10));

    return {
      category,
      predictedAmount: average,
      confidence,
      period: 'next month',
    };
  });
};

export const generateInsights = (transactions: Transaction[]): SpendingInsight[] => {
  const insights: SpendingInsight[] = [];
  const currentMonth = getDateRange('month');
  const lastMonth = getDateRange('month');
  lastMonth.start.setMonth(lastMonth.start.getMonth() - 1);
  lastMonth.end.setMonth(lastMonth.end.getMonth() - 1);

  const currentMonthExpenses = transactions
    .filter(t => {
      const date = new Date(t.date);
      return date >= currentMonth.start && date <= currentMonth.end && t.type === 'expense';
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const lastMonthExpenses = transactions
    .filter(t => {
      const date = new Date(t.date);
      return date >= lastMonth.start && date <= lastMonth.end && t.type === 'expense';
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const changePercent = lastMonthExpenses > 0 
    ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 
    : 0;

  if (changePercent > 20) {
    insights.push({
      type: 'warning',
      title: 'Spending increased significantly',
      description: `Your spending is up ${changePercent.toFixed(1)}% compared to last month`,
      amount: currentMonthExpenses,
    });
  } else if (changePercent < -10) {
    insights.push({
      type: 'success',
      title: 'Great job reducing spending!',
      description: `You've decreased spending by ${Math.abs(changePercent).toFixed(1)}% this month`,
      amount: currentMonthExpenses,
    });
  }

  const categorySpending = getCategorySpending(transactions, 'month');
  const highestCategory = Object.entries(categorySpending)
    .sort(([,a], [,b]) => b - a)[0];

  if (highestCategory) {
    insights.push({
      type: 'info',
      title: 'Top spending category',
      description: `You've spent the most on ${highestCategory[0]} this month`,
      category: highestCategory[0],
      amount: highestCategory[1],
    });
  }

  return insights;
};