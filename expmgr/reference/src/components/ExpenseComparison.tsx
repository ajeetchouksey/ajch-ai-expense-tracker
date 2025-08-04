import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Transaction, Category, UserSettings } from '@/lib/types';
import { formatCurrency, COUNTRY_SAVINGS_ADVICE } from '@/lib/constants';
import { 
  TrendUp, 
  TrendDown, 
  ArrowUp, 
  ArrowDown, 
  Calendar, 
  BarChart3,
  PieChart,
  Users,
  Globe,
  Target,
  Minus
} from '@phosphor-icons/react';

interface ExpenseComparisonProps {
  transactions: Transaction[];
  categories: Category[];
  userSettings: UserSettings;
}

interface ComparisonPeriod {
  name: string;
  startDate: Date;
  endDate: Date;
}

// Simulated country average data
const COUNTRY_AVERAGES: Record<string, Record<string, number>> = {
  US: {
    food: 800,
    transport: 600,
    shopping: 400,
    entertainment: 300,
    bills: 1200,
    healthcare: 500,
    education: 200,
    housing: 2000,
  },
  IN: {
    food: 200,
    transport: 150,
    shopping: 100,
    entertainment: 80,
    bills: 300,
    healthcare: 120,
    education: 100,
    housing: 500,
  },
  GB: {
    food: 600,
    transport: 400,
    shopping: 350,
    entertainment: 250,
    bills: 900,
    healthcare: 200,
    education: 150,
    housing: 1500,
  },
  // Add more countries as needed
};

export function ExpenseComparison({ transactions, categories, userSettings }: ExpenseComparisonProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [comparisonType, setComparisonType] = useState<'periods' | 'countries' | 'categories'>('periods');

  const getPeriodData = (periodKey: string): ComparisonPeriod => {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfThisYear = new Date(now.getFullYear(), 0, 1);
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);

    switch (periodKey) {
      case 'thisMonth':
        return { name: 'This Month', startDate: startOfThisMonth, endDate: now };
      case 'lastMonth':
        return { name: 'Last Month', startDate: startOfLastMonth, endDate: endOfLastMonth };
      case 'thisYear':
        return { name: 'This Year', startDate: startOfThisYear, endDate: now };
      case 'lastYear':
        return { name: 'Last Year', startDate: startOfLastYear, endDate: endOfLastYear };
      default:
        return { name: 'This Month', startDate: startOfThisMonth, endDate: now };
    }
  };

  const getTransactionsInPeriod = (period: ComparisonPeriod) => {
    return transactions.filter(t => {
      const date = new Date(t.date);
      return date >= period.startDate && date <= period.endDate && t.type === 'expense';
    });
  };

  const getCategoryExpenses = (periodTransactions: Transaction[]) => {
    const categoryTotals: Record<string, number> = {};
    periodTransactions.forEach(transaction => {
      const categoryName = categories.find(c => c.id === transaction.category)?.name || 'Other';
      categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + transaction.amount;
    });
    return categoryTotals;
  };

  const currentPeriod = getPeriodData(selectedPeriod);
  const currentTransactions = getTransactionsInPeriod(currentPeriod);
  const currentCategoryExpenses = getCategoryExpenses(currentTransactions);
  const currentTotal = currentTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Previous period comparison
  const getPreviousPeriod = (periodKey: string): ComparisonPeriod => {
    const now = new Date();
    switch (periodKey) {
      case 'thisMonth':
        return {
          name: 'Last Month',
          startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          endDate: new Date(now.getFullYear(), now.getMonth(), 0)
        };
      case 'lastMonth':
        return {
          name: 'Month Before',
          startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
          endDate: new Date(now.getFullYear(), now.getMonth() - 1, 0)
        };
      case 'thisYear':
        return {
          name: 'Last Year',
          startDate: new Date(now.getFullYear() - 1, 0, 1),
          endDate: new Date(now.getFullYear() - 1, 11, 31)
        };
      default:
        return {
          name: 'Previous Period',
          startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          endDate: new Date(now.getFullYear(), now.getMonth(), 0)
        };
    }
  };

  const previousPeriod = getPreviousPeriod(selectedPeriod);
  const previousTransactions = getTransactionsInPeriod(previousPeriod);
  const previousCategoryExpenses = getCategoryExpenses(previousTransactions);
  const previousTotal = previousTransactions.reduce((sum, t) => sum + t.amount, 0);

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const totalChange = calculateChange(currentTotal, previousTotal);

  // Country comparison data
  const countryAverages = COUNTRY_AVERAGES[userSettings.country] || COUNTRY_AVERAGES['US'];
  
  const getComparisonWithCountry = () => {
    return Object.entries(currentCategoryExpenses).map(([category, amount]) => {
      const categoryKey = categories.find(c => c.name === category)?.id || 'other';
      const countryAverage = countryAverages[categoryKey] || 0;
      const difference = amount - countryAverage;
      const percentageDiff = countryAverage > 0 ? (difference / countryAverage) * 100 : 0;
      
      return {
        category,
        userAmount: amount,
        countryAverage,
        difference,
        percentageDiff,
        status: Math.abs(percentageDiff) < 10 ? 'similar' : percentageDiff > 0 ? 'above' : 'below'
      };
    });
  };

  const countryComparison = getComparisonWithCountry();

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    return category?.color || '#8B5CF6';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Expense Comparison</h2>
            <p className="text-muted-foreground">Compare your spending across periods and benchmarks</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
              <SelectItem value="lastYear">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={comparisonType} onValueChange={(value) => setComparisonType(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="periods" className="gap-2">
            <Calendar className="h-4 w-4" />
            Period Comparison
          </TabsTrigger>
          <TabsTrigger value="countries" className="gap-2">
            <Globe className="h-4 w-4" />
            Country Average
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <PieChart className="h-4 w-4" />
            Category Breakdown
          </TabsTrigger>
        </TabsList>

        <TabsContent value="periods" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{currentPeriod.name}</span>
                  <Badge variant="outline">{formatCurrency(currentTotal, userSettings.currency)}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(currentCategoryExpenses)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 6)
                    .map(([category, amount]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: getCategoryColor(category) }}
                          />
                          <span className="text-sm">{category}</span>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(amount, userSettings.currency)}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{previousPeriod.name}</span>
                  <Badge variant="outline">{formatCurrency(previousTotal, userSettings.currency)}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(previousCategoryExpenses)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 6)
                    .map(([category, amount]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: getCategoryColor(category) }}
                          />
                          <span className="text-sm">{category}</span>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(amount, userSettings.currency)}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Period Comparison Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  {totalChange >= 0 ? (
                    <TrendUp className="h-5 w-5 text-destructive" />
                  ) : (
                    <TrendDown className="h-5 w-5 text-success" />
                  )}
                  <span className={`text-lg font-semibold ${totalChange >= 0 ? 'text-destructive' : 'text-success'}`}>
                    {Math.abs(totalChange).toFixed(1)}% {totalChange >= 0 ? 'increase' : 'decrease'}
                  </span>
                </div>
                <Badge variant={totalChange >= 0 ? 'destructive' : 'secondary'}>
                  {formatCurrency(Math.abs(currentTotal - previousTotal), userSettings.currency)} difference
                </Badge>
              </div>

              <div className="space-y-4">
                {Object.entries(currentCategoryExpenses).map(([category, currentAmount]) => {
                  const previousAmount = previousCategoryExpenses[category] || 0;
                  const change = calculateChange(currentAmount, previousAmount);
                  
                  return (
                    <div key={category} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: getCategoryColor(category) }}
                        />
                        <span className="font-medium">{category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(currentAmount, userSettings.currency)}
                        </span>
                        <div className="flex items-center gap-1">
                          {change >= 0 ? (
                            <ArrowUp className="h-3 w-3 text-destructive" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-success" />
                          )}
                          <span className={`text-xs font-medium ${change >= 0 ? 'text-destructive' : 'text-success'}`}>
                            {Math.abs(change).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="countries" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Comparison with {userSettings.country} Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {countryComparison
                  .sort((a, b) => Math.abs(b.percentageDiff) - Math.abs(a.percentageDiff))
                  .map((item) => (
                    <div key={item.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: getCategoryColor(item.category) }}
                          />
                          <span className="font-medium">{item.category}</span>
                          <Badge 
                            variant={item.status === 'above' ? 'destructive' : item.status === 'below' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {item.status === 'above' ? 'Above Average' : item.status === 'below' ? 'Below Average' : 'Similar'}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatCurrency(item.userAmount, userSettings.currency)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            avg: {formatCurrency(item.countryAverage, userSettings.currency)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={Math.min((item.userAmount / item.countryAverage) * 100, 200)} 
                          className="flex-1 h-2"
                        />
                        <span className={`text-xs font-medium ${item.percentageDiff >= 0 ? 'text-destructive' : 'text-success'}`}>
                          {item.percentageDiff >= 0 ? '+' : ''}{item.percentageDiff.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Country-Specific Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {COUNTRY_SAVINGS_ADVICE[userSettings.country]?.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
                    <Target className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span className="text-sm">{tip}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(currentCategoryExpenses)
              .sort(([,a], [,b]) => b - a)
              .map(([category, amount]) => {
                const percentage = (amount / currentTotal) * 100;
                const previousAmount = previousCategoryExpenses[category] || 0;
                const change = calculateChange(amount, previousAmount);
                
                return (
                  <Card key={category} className="border-l-4" style={{ borderLeftColor: getCategoryColor(category) }}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-lg">
                        <span>{category}</span>
                        <Badge variant="outline">{percentage.toFixed(1)}%</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-end">
                          <span className="text-2xl font-bold">{formatCurrency(amount, userSettings.currency)}</span>
                          <div className="flex items-center gap-1">
                            {change >= 0 ? (
                              <ArrowUp className="h-4 w-4 text-destructive" />
                            ) : change < 0 ? (
                              <ArrowDown className="h-4 w-4 text-success" />
                            ) : (
                              <Minus className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className={`text-sm font-medium ${change >= 0 ? 'text-destructive' : change < 0 ? 'text-success' : 'text-muted-foreground'}`}>
                              {change === 0 ? 'No change' : `${Math.abs(change).toFixed(0)}%`}
                            </span>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          Previous: {formatCurrency(previousAmount, userSettings.currency)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}