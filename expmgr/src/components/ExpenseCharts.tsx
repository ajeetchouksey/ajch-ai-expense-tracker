// ...existing code...
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { Transaction, Category, UserSettings } from '../lib/types';
import { getCategorySpending, getSpendingTrend } from '../lib/analytics';
import { formatCurrency } from '../lib/constants';

interface ExpenseChartsProps {
  transactions: Transaction[];
  categories: Category[];
  userSettings: UserSettings;
}

export function ExpenseCharts({ transactions, categories, userSettings }: ExpenseChartsProps) {
  const categorySpending = getCategorySpending(transactions, 'month');
  const spendingTrend = getSpendingTrend(transactions, 7);

  // Add sample data if no real data exists
  const samplePieData = [
    { name: 'Food & Dining', value: 185.50, color: 'hsl(142, 70%, 45%)' },
    { name: 'Transportation', value: 42.00, color: 'hsl(25, 95%, 53%)' },
    { name: 'Entertainment', value: 120.00, color: 'hsl(262, 80%, 50%)' },
    { name: 'Shopping', value: 65.25, color: 'hsl(43, 96%, 56%)' },
    { name: 'Utilities', value: 87.00, color: 'hsl(221, 83%, 53%)' }
  ];

  const sampleBarData = [
    { date: 'Mon', amount: 120 },
    { date: 'Tue', amount: 45 },
    { date: 'Wed', amount: 80 },
    { date: 'Thu', amount: 65 },
    { date: 'Fri', amount: 90 },
    { date: 'Sat', amount: 150 },
    { date: 'Sun', amount: 75 }
  ];

  const pieData = Object.entries(categorySpending).length > 0 
    ? Object.entries(categorySpending)
        .map(([categoryId, amount]) => {
          const category = categories.find(cat => cat.id === categoryId);
          return {
            name: category?.name || categoryId,
            value: amount,
            color: category?.color || 'hsl(262, 80%, 50%)',
          };
        })
        .sort((a, b) => (typeof b.value === 'number' && typeof a.value === 'number' ? b.value - a.value : 0))
        .slice(0, 8)
    : samplePieData;

  const barData = spendingTrend.length > 0 && spendingTrend.some(trend => trend && 'amount' in trend && (trend as any).amount > 0)
    ? spendingTrend.map(trend => ({
        date: trend && 'date' in trend ? new Date((trend as any).date).toLocaleDateString('en-US', { weekday: 'short' }) : '',
        amount: trend && 'amount' in trend ? (trend as any).amount : 0,
      }))
    : sampleBarData;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="card bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-card-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(payload[0].value, userSettings.currency)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="card">
        <CardHeader className="card-header">
          <CardTitle className="card-title">Spending by Category</CardTitle>
        </CardHeader>
        <CardContent className="card-content">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number, userSettings.currency)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="card">
        <CardHeader className="card-header">
          <CardTitle className="card-title">7-Day Spending Trend</CardTitle>
        </CardHeader>
        <CardContent className="card-content">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis 
                  tickFormatter={(value) => `${userSettings.currency}${value}`} 
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="amount" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
