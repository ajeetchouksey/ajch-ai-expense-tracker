import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { StatsOverview } from '@/components/StatsOverview';
import { AddTransaction } from '@/components/AddTransaction';
import { TransactionList } from '@/components/TransactionList';
import { ExpenseCharts } from '@/components/ExpenseCharts';
import { Insights } from '@/components/Insights';
import { SavingGoals } from '@/components/SavingGoals';
import { RecurringTransactions } from '@/components/RecurringTransactions';
import { BudgetManagement } from '@/components/BudgetManagement';
import { EMITracking } from '@/components/EMITracking';
import { AIRecommendations } from '@/components/AIRecommendations';
import { SettingsComponent } from '@/components/SettingsComponent';
import { ExpensePredictions } from '@/components/ExpensePredictions';
import { FinancialHealth } from '@/components/FinancialHealth';
import { AutomatedCategorization } from '@/components/AutomatedCategorization';
import { CurrencyConverter } from '@/components/CurrencyConverter';
import { SmartNotifications } from '@/components/SmartNotifications';
import { ExpenseComparison } from '@/components/ExpenseComparison';
import { AdvancedReporting } from '@/components/AdvancedReporting';
import { FinancialGamification } from '@/components/FinancialGamification';
import { BillReminders } from '@/components/BillReminders';
import { InvestmentTracker } from '@/components/InvestmentTracker';
import { DebtManagement } from '@/components/DebtManagement';
import { TaxPlanning } from '@/components/TaxPlanning';
import { AdvancedGoalPlanning } from '@/components/AdvancedGoalPlanning';
import { MCPFinancialProviders } from '@/components/MCPFinancialProviders';

import { FloatingChatButton } from '@/components/AryaChatBot';
import { Transaction, Category, SavingGoal, Budget, UserSettings } from '@/lib/types';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, DEFAULT_SETTINGS, COUNTRIES } from '@/lib/constants';
import { calculateDashboardStats, generateInsights } from '@/lib/analytics';
import { 
  ChartPie, 
  Wallet, 
  Lightbulb, 
  Shield, 
  Target, 
  Repeat, 
  Receipt, 
  CreditCard, 
  Brain, 
  Settings,
  TrendUp,
  Heart,
  Tag,
  Calculator,
  Bell,
  ArrowsLeftRight,
  FileText,
  Trophy,
  Receipt as ReceiptIcon,
  TrendUp as TrendUpIcon,
  CreditCard as CreditCardIcon,
  Globe
} from '@phosphor-icons/react';

function App() {
  const [transactions, setTransactions] = useKV('transactions', [] as Transaction[]);
  const [categories] = useKV('categories', [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES] as Category[]);
  const [savingGoals] = useKV('savingGoals', [] as SavingGoal[]);
  const [budgets] = useKV('budgets', [] as Budget[]);
  const [userSettings, setUserSettings] = useKV('userSettings', DEFAULT_SETTINGS as UserSettings);
  
  const stats = calculateDashboardStats(transactions, savingGoals, budgets);
  const insights = generateInsights(transactions);

  const handleAddTransaction = (transaction: Transaction) => {
    setTransactions((prev) => [...prev, transaction]);
  };

  const handleUpdateTransaction = (id: string, category: string) => {
    setTransactions((prev) => 
      prev.map(t => t.id === id ? { ...t, category } : t)
    );
  };

  const handleSettingsChange = (newSettings: UserSettings) => {
    setUserSettings(newSettings);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Personal Expense Manager
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Track your finances privately with AI-powered insights • Powered by Aarya
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                <Shield className="h-4 w-4 text-success" />
                <span>Data stored locally</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                <span className="text-lg">{COUNTRIES.find(c => c.code === userSettings.country)?.flag}</span>
                <span>{userSettings.currency}</span>
                <span>•</span>
                <span>{COUNTRIES.find(c => c.code === userSettings.country)?.name}</span>
              </div>
              <AddTransaction categories={categories} onAddTransaction={handleAddTransaction} userSettings={userSettings} />
            </div>
          </div>
        </div>

        <div className="mb-8">
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
            <TabsTrigger value="converter" className="gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Converter</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="comparison" className="gap-2">
              <ArrowsLeftRight className="h-4 w-4" />
              <span className="hidden sm:inline">Compare</span>
            </TabsTrigger>
            <TabsTrigger value="reporting" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="gamification" className="gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Rewards</span>
            </TabsTrigger>
            <TabsTrigger value="bills" className="gap-2">
              <ReceiptIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Bills</span>
            </TabsTrigger>
            <TabsTrigger value="investments" className="gap-2">
              <TrendUpIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Investments</span>
            </TabsTrigger>
            <TabsTrigger value="debts" className="gap-2">
              <CreditCardIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Debts</span>
            </TabsTrigger>
            <TabsTrigger value="tax" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Tax</span>
            </TabsTrigger>
            <TabsTrigger value="advanced-goals" className="gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Advanced Goals</span>
            </TabsTrigger>
            <TabsTrigger value="mcp-providers" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">MCP Providers</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">All Data</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
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
            <SavingGoals userSettings={userSettings} />
          </TabsContent>

          <TabsContent value="recurring" className="space-y-6">
            <RecurringTransactions 
              categories={categories} 
              userSettings={userSettings}
              onAddTransaction={handleAddTransaction}
            />
          </TabsContent>

          <TabsContent value="budgets" className="space-y-6">
            <BudgetManagement 
              categories={categories}
              transactions={transactions}
              userSettings={userSettings}
            />
          </TabsContent>

          <TabsContent value="emi" className="space-y-6">
            <EMITracking userSettings={userSettings} />
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
              onUpdateTransaction={handleUpdateTransaction}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <ExpenseCharts transactions={transactions} categories={categories} userSettings={userSettings} />
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <AIRecommendations 
              transactions={transactions}
              savingGoals={savingGoals}
              budgets={budgets}
              userSettings={userSettings}
            />
          </TabsContent>

          <TabsContent value="converter" className="space-y-6">
            <CurrencyConverter userSettings={userSettings} />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <SmartNotifications 
              transactions={transactions}
              budgets={budgets}
              savingGoals={savingGoals}
              userSettings={userSettings}
            />
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <ExpenseComparison 
              transactions={transactions}
              categories={categories}
              userSettings={userSettings}
            />
          </TabsContent>

          <TabsContent value="reporting" className="space-y-6">
            <AdvancedReporting 
              transactions={transactions}
              userSettings={userSettings}
            />
          </TabsContent>

          <TabsContent value="gamification" className="space-y-6">
            <FinancialGamification 
              userSettings={userSettings}
              transactions={transactions}
              savingGoals={savingGoals}
              budgets={budgets}
            />
          </TabsContent>

          <TabsContent value="bills" className="space-y-6">
            <BillReminders 
              userSettings={userSettings}
              categories={categories}
              onAddTransaction={handleAddTransaction}
            />
          </TabsContent>

          <TabsContent value="investments" className="space-y-6">
            <InvestmentTracker 
              userSettings={userSettings}
            />
          </TabsContent>

          <TabsContent value="debts" className="space-y-6">
            <DebtManagement 
              userSettings={userSettings}
            />
          </TabsContent>

          <TabsContent value="tax" className="space-y-6">
            <TaxPlanning 
              userSettings={userSettings}
              transactions={transactions}
            />
          </TabsContent>

          <TabsContent value="advanced-goals" className="space-y-6">
            <AdvancedGoalPlanning 
              userSettings={userSettings}
              transactions={transactions}
              savingGoals={savingGoals}
            />
          </TabsContent>

          <TabsContent value="mcp-providers" className="space-y-6">
            <MCPFinancialProviders 
              userSettings={userSettings}
              transactions={transactions}
              savingGoals={savingGoals}
              budgets={budgets}
            />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <Insights insights={insights} />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <TransactionList transactions={transactions} categories={categories} userSettings={userSettings} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SettingsComponent onSettingsChange={handleSettingsChange} />
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
      <FloatingChatButton />
    </div>
  );
}

export default App;