// ...existing code...
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { formatCurrency } from '../lib/constants';
import type { DashboardStats, UserSettings } from '../lib/types';
import { TrendUp, TrendDown, Wallet, Target, PiggyBank, CreditCard } from '@phosphor-icons/react';

interface StatsOverviewProps {
  stats: DashboardStats;
  userSettings: UserSettings;
}

export function StatsOverview({ stats, userSettings }: StatsOverviewProps) {
  const isPositive = stats.netIncome >= 0;
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      <Card className="income-card">
        <CardHeader className="card-header flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="card-title text-sm font-medium">Total Income</CardTitle>
          <TrendUp className="h-4 w-4 category-income" />
        </CardHeader>
        <CardContent className="card-content">
          <div className="stats-value category-income">
            {String(formatCurrency(stats.totalIncome, userSettings.currency))}
          </div>
          <p className="stats-label">This month</p>
        </CardContent>
      </Card>
      
      <Card className="expense-card">
        <CardHeader className="card-header flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="card-title text-sm font-medium">Total Expenses</CardTitle>
          <TrendDown className="h-4 w-4 category-expense" />
        </CardHeader>
        <CardContent className="card-content">
          <div className="stats-value category-expense">
            {String(formatCurrency(stats.totalExpenses, userSettings.currency))}
          </div>
          <p className="stats-label">This month</p>
        </CardContent>
      </Card>
      
      <Card className="savings-card">
        <CardHeader className="card-header flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="card-title text-sm font-medium">Net Income</CardTitle>
          <Wallet className={`h-4 w-4 ${isPositive ? 'category-income' : 'category-expense'}`} />
        </CardHeader>
        <CardContent className="card-content">
          <div className={`stats-value ${isPositive ? 'category-income' : 'category-expense'}`}>
            {String(formatCurrency(stats.netIncome, userSettings.currency))}
          </div>
          <p className="stats-label">Available</p>
        </CardContent>
      </Card>

      <Card className="stats-card">
        <CardHeader className="card-header flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="card-title text-sm font-medium">Savings Rate</CardTitle>
          <PiggyBank className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent className="card-content">
          <div className="stats-value text-accent">
            {stats.savingsRate.toFixed(1)}%
          </div>
          <Progress value={Math.min(100, Math.max(0, stats.savingsRate))} className="progress h-2 mt-2" />
          <p className="stats-label mt-1">Of income saved</p>
        </CardContent>
      </Card>

      <Card className="stats-card">
        <CardHeader className="card-header flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="card-title text-sm font-medium">Total Savings</CardTitle>
          <Target className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent className="card-content">
          <div className="stats-value text-primary">
            {String(formatCurrency(stats.totalSavings, userSettings.currency))}
          </div>
          <p className="stats-label">Goal progress</p>
        </CardContent>
      </Card>
      
      <Card className="stats-card">
        <CardHeader className="card-header flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="card-title text-sm font-medium">Monthly EMI</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="card-content">
          <div className="stats-value">
            {String(formatCurrency(stats.monthlyEMI, userSettings.currency))}
          </div>
          <p className="stats-label">Fixed obligations</p>
        </CardContent>
      </Card>
    </div>
  );
}
