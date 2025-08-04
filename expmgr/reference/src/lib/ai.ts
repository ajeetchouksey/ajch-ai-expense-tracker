import { Transaction, SavingGoal, Budget, AIRecommendation, UserSettings, RecurringTransaction, ExpensePrediction, FinancialHealthScore, CategorySuggestion, Category } from './types';
import { COUNTRY_SAVINGS_ADVICE } from './constants';

export const generateAIRecommendations = async (
  transactions: Transaction[],
  savingGoals: SavingGoal[],
  budgets: Budget[],
  settings: UserSettings
): Promise<AIRecommendation[]> => {
  try {
    const prompt = spark.llmPrompt`
      Analyze the following financial data and provide 3-5 personalized recommendations for improving financial health:

      Country: ${settings.country}
      Currency: ${settings.currency}
      
      Transactions (last 30 days): ${JSON.stringify(transactions.slice(-30))}
      Saving Goals: ${JSON.stringify(savingGoals)}
      Budgets: ${JSON.stringify(budgets)}
      
      Focus on:
      1. Budget optimization opportunities
      2. Savings strategies specific to ${settings.country}
      3. Spending pattern improvements
      4. Goal achievement strategies
      
      Return recommendations as JSON array with fields: type, title, description, priority, confidence, actionItems
    `;

    const response = await spark.llm(prompt, 'gpt-4o', true);
    const recommendations = JSON.parse(response);
    
    return recommendations.map((rec: any, index: number) => ({
      id: `ai-${Date.now()}-${index}`,
      type: rec.type || 'savings',
      title: rec.title,
      description: rec.description,
      priority: rec.priority || 'medium',
      confidence: rec.confidence || 0.8,
      createdAt: new Date().toISOString(),
      isRead: false,
      actionItems: rec.actionItems || []
    }));
  } catch (error) {
    console.error('AI recommendation generation failed:', error);
    return getCountryBasedRecommendations(settings.country);
  }
};

export const generateSavingsAdvice = async (
  monthlyIncome: number,
  monthlyExpenses: number,
  country: string
): Promise<string> => {
  try {
    const savingsRate = ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;
    const countryAdvice = COUNTRY_SAVINGS_ADVICE[country as keyof typeof COUNTRY_SAVINGS_ADVICE];
    
    const prompt = spark.llmPrompt`
      Provide personalized savings advice for someone in ${country} with:
      - Monthly income: ${monthlyIncome}
      - Monthly expenses: ${monthlyExpenses}
      - Current savings rate: ${savingsRate.toFixed(1)}%
      
      Country-specific context:
      - Recommended emergency fund: ${countryAdvice?.emergency || 6} months
      - Retirement savings rate: ${countryAdvice?.retirement || 15}%
      - Local tips: ${countryAdvice?.tips.join(', ')}
      
      Provide specific, actionable advice in 2-3 sentences.
    `;

    return await spark.llm(prompt);
  } catch (error) {
    console.error('Savings advice generation failed:', error);
    const advice = COUNTRY_SAVINGS_ADVICE[country as keyof typeof COUNTRY_SAVINGS_ADVICE];
    return `Based on ${country} standards, aim for ${advice?.emergency || 6} months emergency fund and ${advice?.retirement || 15}% retirement savings. ${advice?.tips[0] || 'Focus on building emergency savings first.'}`;
  }
};

export const analyzeSpendingPatterns = async (transactions: Transaction[]): Promise<string> => {
  try {
    const recentTransactions = transactions.slice(-50);
    
    const prompt = spark.llmPrompt`
      Analyze these spending patterns and identify 2-3 key insights:
      
      Transactions: ${JSON.stringify(recentTransactions)}
      
      Look for:
      - Unusual spending spikes
      - Opportunities for cost reduction
      - Positive spending trends
      
      Provide insights in 2-3 brief, actionable sentences.
    `;

    return await spark.llm(prompt);
  } catch (error) {
    console.error('Spending analysis failed:', error);
    return 'Track your spending patterns regularly to identify opportunities for savings and better budget allocation.';
  }
};

export const getCountryBasedRecommendations = (country: string): AIRecommendation[] => {
  const advice = COUNTRY_SAVINGS_ADVICE[country as keyof typeof COUNTRY_SAVINGS_ADVICE];
  
  return [
    {
      id: `country-${Date.now()}-1`,
      type: 'savings',
      title: 'Emergency Fund Goal',
      description: `Build an emergency fund covering ${advice?.emergency || 6} months of expenses, recommended for ${country}.`,
      priority: 'high',
      confidence: 0.9,
      createdAt: new Date().toISOString(),
      isRead: false,
      actionItems: ['Calculate monthly expenses', 'Set up automatic savings', 'Choose high-yield savings account']
    },
    {
      id: `country-${Date.now()}-2`,
      type: 'budget',
      title: 'Retirement Savings',
      description: `Aim to save ${advice?.retirement || 15}% of income for retirement, following ${country} best practices.`,
      priority: 'medium',
      confidence: 0.8,
      createdAt: new Date().toISOString(),
      isRead: false,
      actionItems: advice?.tips || ['Start retirement planning', 'Review investment options']
    }
  ];
};

export const generateBudgetInsights = async (budgets: Budget[], transactions: Transaction[]): Promise<string> => {
  try {
    const budgetAnalysis = budgets.map(budget => {
      const categoryTransactions = transactions.filter(t => t.category === budget.categoryId);
      const spent = categoryTransactions.reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : 0), 0);
      const usage = (spent / budget.amount) * 100;
      
      return {
        category: budget.categoryId,
        budgeted: budget.amount,
        spent,
        usage: usage.toFixed(1)
      };
    });

    const prompt = spark.llmPrompt`
      Analyze budget performance and provide insights:
      
      Budget Analysis: ${JSON.stringify(budgetAnalysis)}
      
      Identify:
      - Categories over budget
      - Categories with room for optimization
      - Overall budget health
      
      Provide 2-3 actionable insights.
    `;

    return await spark.llm(prompt);
  } catch (error) {
    console.error('Budget insights generation failed:', error);
    return 'Review your budget regularly and adjust categories based on actual spending patterns.';
  }
};

// New AI functions for the three additional features

export const generateExpensePredictions = async (
  transactions: Transaction[],
  categories: Category[],
  period: 'next_week' | 'next_month' | 'next_quarter'
): Promise<ExpensePrediction[]> => {
  try {
    const recentTransactions = transactions.slice(-100); // Last 100 transactions
    const categoryMap = categories.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.name }), {});
    
    const prompt = spark.llmPrompt`
      Analyze spending patterns and predict future expenses for ${period}:
      
      Recent transactions: ${JSON.stringify(recentTransactions)}
      Categories: ${JSON.stringify(categoryMap)}
      
      For each expense category, predict:
      1. Expected amount for ${period}
      2. Confidence level (high/medium/low)
      3. Trend (increasing/decreasing/stable)
      4. Key factors influencing the prediction
      
      Return as JSON array with fields: category, predictedAmount, confidence, trend, factors, accuracy
      Focus on categories with sufficient historical data.
    `;

    const response = await spark.llm(prompt, 'gpt-4o', true);
    const predictions = JSON.parse(response);
    
    return predictions.map((pred: any) => ({
      category: pred.category,
      predictedAmount: pred.predictedAmount || 0,
      accuracy: pred.accuracy || 75,
      confidence: pred.confidence || 'medium',
      period,
      trend: pred.trend || 'stable',
      factors: pred.factors || []
    }));
  } catch (error) {
    console.error('Expense prediction generation failed:', error);
    return [];
  }
};

export const calculateFinancialHealthScore = async (
  transactions: Transaction[],
  savingGoals: SavingGoal[],
  budgets: Budget[],
  userSettings: UserSettings
): Promise<FinancialHealthScore> => {
  try {
    // Calculate basic metrics
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    
    const prompt = spark.llmPrompt`
      Calculate a comprehensive financial health score (0-100) based on:
      
      Financial Data:
      - Total Income: ${totalIncome}
      - Total Expenses: ${totalExpenses}
      - Savings Rate: ${savingsRate.toFixed(1)}%
      - Active Goals: ${savingGoals.length}
      - Completed Goals: ${savingGoals.filter(g => g.isCompleted).length}
      - Budgets: ${budgets.length}
      - Country: ${userSettings.country}
      
      Recent Transactions: ${JSON.stringify(transactions.slice(-30))}
      
      Provide scores for:
      1. Overall score (0-100)
      2. Breakdown: savings, spending, budgeting, debt, goals (each 0-100)
      3. Risk level (low/medium/high)
      4. 3-5 key insights
      5. 3-5 actionable recommendations
      
      Return as JSON with fields: overall, breakdown, riskLevel, insights, recommendations
    `;

    const response = await spark.llm(prompt, 'gpt-4o', true);
    const scoreData = JSON.parse(response);
    
    return {
      overall: Math.min(100, Math.max(0, scoreData.overall || 50)),
      breakdown: {
        savings: Math.min(100, Math.max(0, scoreData.breakdown?.savings || 50)),
        spending: Math.min(100, Math.max(0, scoreData.breakdown?.spending || 50)),
        budgeting: Math.min(100, Math.max(0, scoreData.breakdown?.budgeting || 50)),
        debt: Math.min(100, Math.max(0, scoreData.breakdown?.debt || 50)),
        goals: Math.min(100, Math.max(0, scoreData.breakdown?.goals || 50))
      },
      insights: scoreData.insights || [],
      recommendations: scoreData.recommendations || [],
      riskLevel: scoreData.riskLevel || 'medium',
      lastCalculated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Financial health calculation failed:', error);
    
    // Fallback calculation based on simple metrics
    const savingsScore = Math.min(100, savingsRate * 5); // 20% savings = 100 points
    const budgetScore = budgets.length > 0 ? 80 : 20;
    const goalScore = savingGoals.length > 0 ? 70 : 30;
    const overall = Math.round((savingsScore + budgetScore + goalScore) / 3);
    
    return {
      overall,
      breakdown: {
        savings: Math.round(savingsScore),
        spending: 60,
        budgeting: budgetScore,
        debt: 70,
        goals: goalScore
      },
      insights: ['Add more transaction data for detailed analysis'],
      recommendations: ['Set up budgets for better financial tracking', 'Create savings goals'],
      riskLevel: overall < 50 ? 'high' : overall < 75 ? 'medium' : 'low',
      lastCalculated: new Date().toISOString()
    };
  }
};

export const suggestTransactionCategory = async (
  description: string,
  amount: number,
  type: 'income' | 'expense',
  categories: Category[],
  historicalTransactions: Transaction[]
): Promise<CategorySuggestion> => {
  try {
    const relevantCategories = categories.filter(c => c.type === type);
    const similarTransactions = historicalTransactions
      .filter(t => t.type === type && t.description.toLowerCase().includes(description.toLowerCase().split(' ')[0]))
      .slice(-10);
    
    const prompt = spark.llmPrompt`
      Suggest the best category for this transaction:
      
      Transaction: "${description}" (${type}, amount: ${amount})
      
      Available categories: ${JSON.stringify(relevantCategories.map(c => c.name))}
      
      Similar past transactions: ${JSON.stringify(similarTransactions.map(t => ({ description: t.description, category: t.category })))}
      
      Return JSON with:
      - suggestedCategory: best matching category name
      - confidence: 0-1 confidence score
      - reason: brief explanation
      - alternatives: array of 2 alternative categories
    `;

    const response = await spark.llm(prompt, 'gpt-4o', true);
    const suggestion = JSON.parse(response);
    
    return {
      confidence: suggestion.confidence || 0.5,
      suggestedCategory: suggestion.suggestedCategory || 'Other',
      reason: suggestion.reason || 'Based on transaction description',
      alternatives: suggestion.alternatives || []
    };
  } catch (error) {
    console.error('Category suggestion failed:', error);
    
    // Simple fallback logic
    const keywords = description.toLowerCase();
    const relevantCategories = categories.filter(c => c.type === type);
    
    if (keywords.includes('grocery') || keywords.includes('food')) {
      return { confidence: 0.7, suggestedCategory: 'Groceries', reason: 'Contains food-related keywords', alternatives: ['Dining Out'] };
    }
    if (keywords.includes('gas') || keywords.includes('fuel')) {
      return { confidence: 0.8, suggestedCategory: 'Transportation', reason: 'Contains transportation keywords', alternatives: ['Utilities'] };
    }
    
    return { 
      confidence: 0.3, 
      suggestedCategory: relevantCategories[0]?.name || 'Other', 
      reason: 'Default suggestion', 
      alternatives: relevantCategories.slice(1, 3).map(c => c.name) 
    };
  }
};

export const trainCategoryModel = async (
  transactions: Transaction[],
  categories: Category[]
): Promise<void> => {
  try {
    // This is a placeholder for model training
    // In a real implementation, this would update ML model weights
    
    const trainingData = transactions.map(t => ({
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: t.category
    }));
    
    const prompt = spark.llmPrompt`
      Analyze transaction patterns to improve categorization accuracy:
      
      Training data: ${JSON.stringify(trainingData.slice(-200))} // Last 200 transactions
      Categories: ${JSON.stringify(categories.map(c => ({ name: c.name, type: c.type })))}
      
      Identify:
      1. Common patterns for each category
      2. Keywords that strongly indicate specific categories
      3. Amount ranges typical for each category
      
      This analysis will improve future categorization suggestions.
      Return "Training completed" when done.
    `;

    await spark.llm(prompt);
    console.log('Category model training completed');
  } catch (error) {
    console.error('Category model training failed:', error);
    throw error;
  }
};