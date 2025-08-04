

import { useState } from 'react';
import { StatsOverview } from './components/StatsOverview';
import { AddTransaction } from './components/AddTransaction';
import { TransactionList } from './components/TransactionList';
import { ExpenseCharts } from './components/ExpenseCharts';
import { AdvancedGoalPlanning } from './components/AdvancedGoalPlanning';
import { RecurringTransactions } from './components/RecurringTransactions';
import { BudgetManagement } from './components/BudgetManagement';
import { EMITracking } from './components/EMITracking';
import { ExpensePredictions } from './components/ExpensePredictions';
import { FinancialHealth } from './components/FinancialHealth';
import { AutomatedCategorization } from './components/AutomatedCategorization';
import { AdvancedReporting } from './components/AdvancedReporting';
import { ExpenseComparison } from './components/ExpenseComparison';
import { AIRecommendations } from './components/AIRecommendations';
import { AryaChatBot } from './components/AryaChatBot';
import { SettingsComponent } from './components/SettingsComponent';

import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, DEFAULT_SETTINGS, COUNTRIES } from './lib/constants';
import { calculateDashboardStats } from './lib/analytics';
import type { Transaction, Category, SavingGoal, Budget, UserSettings } from './lib/types';
// UI and icon imports (replace with your actual paths)
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Toaster } from './components/ui/toaster';
import { Wallet, Shield, Brain, Target, Repeat, Receipt, CreditCard, TrendUp, Heart, Tag, ChartPie, Gear } from '@phosphor-icons/react';




function App() {
  // Test data for UI visualization
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      date: '2025-08-04',
      amount: 1500,
      category: 'Salary',
      description: 'Monthly Salary',
      type: 'income',
      createdAt: '2025-08-04',
      tags: ['salary', 'monthly'],
      currency: 'USD'
    },
    {
      id: '2',
      date: '2025-08-04',
      amount: 500,
      category: 'Rent',
      description: 'Monthly Rent',
      type: 'expense',
      createdAt: '2025-08-04',
      tags: ['housing', 'monthly'],
      currency: 'USD'
    },
    {
      id: '3',
      date: '2025-08-04',
      amount: 100,
      category: 'Groceries',
      description: 'Weekly Groceries',
      type: 'expense',
      createdAt: '2025-08-04',
      tags: ['food', 'weekly'],
      currency: 'USD'
    }
  ]);

  const [categories] = useState<Category[]>([...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES]);
  
  const [savingGoals] = useState<SavingGoal[]>([
    {
      id: '1',
      name: 'Emergency Fund',
      targetAmount: 10000,
      currentAmount: 5000,
      targetDate: '2025-12-31',
      deadline: '2025-12-31',
      category: 'Savings',
      priority: 'high',
      isCompleted: false,
      createdAt: '2025-01-01',
      tags: ['emergency', 'savings'],
      currency: 'USD',
      country: 'US'
    },
    {
      id: '2',
      name: 'New Laptop',
      targetAmount: 2000,
      currentAmount: 500,
      targetDate: '2025-10-31',
      deadline: '2025-10-31',
      category: 'Electronics',
      priority: 'medium',
      isCompleted: false,
      createdAt: '2025-06-01',
      tags: ['electronics', 'gadget'],
      currency: 'USD',
      country: 'US'
    }
  ]);

  const [budgets] = useState<Budget[]>([
    {
      id: '1',
      categoryId: 'groceries',
      amount: 500,
      period: 'monthly',
      spent: 300,
      alertThreshold: 80,
      isActive: true
    },
    {
      id: '2',
      categoryId: 'entertainment',
      amount: 200,
      period: 'monthly',
      spent: 150,
      alertThreshold: 90,
      isActive: true
    }
  ]);

  const [userSettings] = useState<UserSettings>({
    ...DEFAULT_SETTINGS,
    currency: 'USD',
    country: 'US',
    language: 'en',
    locale: 'en-US',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    theme: 'professional',
    defaultTags: ['monthly', 'essential', 'leisure'],
    notifications: {
      budgetAlerts: true,
      goalReminders: true,
      emiDue: true,
      weeklyReports: true
    }
  });

  const stats = calculateDashboardStats(transactions, savingGoals, budgets);
  // const insights = generateInsights(transactions);

  const handleAddTransaction = (transaction: Transaction) => {
    setTransactions((prev) => [...prev, transaction]);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 fade-in">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="app-icon">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight gradient-text">
                      Aarya SmartMoney
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Track your finances privately with AI-powered insights
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="status-badge">
                <Shield className="h-4 w-4 text-success" />
                <span>Data stored locally</span>
              </div>
              <div className="status-badge">
                <span className="text-lg">{COUNTRIES.find(c => c.code === userSettings.country)?.flag}</span>
                <span>{userSettings.currency}</span>
                <span>•</span>
                <span>{COUNTRIES.find(c => c.code === userSettings.country)?.name}</span>
              </div>
              <AddTransaction categories={categories} onAddTransaction={handleAddTransaction} userSettings={userSettings} />
            </div>
          </div>
        </div>

        <div className="mb-8 slide-up">
          <StatsOverview stats={stats} userSettings={userSettings} />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:w-fit gap-1">
            <TabsTrigger value="overview" className="gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Goals</span>
            </TabsTrigger>
            <TabsTrigger value="recurring" className="gap-2">
              <Repeat className="h-4 w-4" />
              <span className="hidden sm:inline">Recurring</span>
            </TabsTrigger>
            <TabsTrigger value="budgets" className="gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Budgets</span>
            </TabsTrigger>
            <TabsTrigger value="emi" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">EMI</span>
            </TabsTrigger>
            <TabsTrigger value="predictions" className="gap-2">
              <TrendUp className="h-4 w-4" />
              <span className="hidden sm:inline">Predictions</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Health</span>
            </TabsTrigger>
            <TabsTrigger value="categorization" className="gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Auto-Cat</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <ChartPie className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Insights</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Gear className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <TransactionList 
                transactions={transactions} 
                categories={categories} 
                userSettings={userSettings}
                limit={5} 
              />
              <div className="space-y-6">
                <ExpenseCharts transactions={transactions} categories={categories} userSettings={userSettings} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <AdvancedGoalPlanning 
              transactions={transactions}
              savingGoals={savingGoals}
              userSettings={userSettings}
            />
          </TabsContent>

          <TabsContent value="recurring" className="space-y-6">
            <RecurringTransactions
              transactions={transactions}
              categories={categories}
              userSettings={userSettings}
            />
          </TabsContent>

          <TabsContent value="budgets" className="space-y-6">
            <BudgetManagement
              transactions={transactions}
              categories={categories}
              budgets={budgets}
              userSettings={userSettings}
            />
          </TabsContent>

          <TabsContent value="emi" className="space-y-6">
            <EMITracking
              transactions={transactions}
              userSettings={userSettings}
            />
          </TabsContent>

          <TabsContent value="predictions" className="space-y-6">
            <ExpensePredictions
              transactions={transactions}
              categories={categories}
              userSettings={userSettings}
            />
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <FinancialHealth
              transactions={transactions}
              savingGoals={savingGoals}
              budgets={budgets}
              userSettings={userSettings}
            />
          </TabsContent>

          <TabsContent value="categorization" className="space-y-6">
            <AutomatedCategorization
              transactions={transactions}
              categories={categories}
              userSettings={userSettings}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <AdvancedReporting
                transactions={transactions}
                categories={categories}
                userSettings={userSettings}
              />
              <ExpenseComparison
                transactions={transactions}
                categories={categories}
                userSettings={userSettings}
              />
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <AIRecommendations
                transactions={transactions}
                categories={categories}
                savingGoals={savingGoals}
                budgets={budgets}
                userSettings={userSettings}
              />
              <AryaChatBot
                transactions={transactions}
                categories={categories}
                userSettings={userSettings}
              />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SettingsComponent
              userSettings={userSettings}
              categories={categories}
            />
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  );
}

export default App
