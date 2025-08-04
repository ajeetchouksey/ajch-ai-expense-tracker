import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Transaction, Category, UserSettings } from '@/lib/types';
import { getCategorySpending, getSpendingTrend } from '@/lib/analytics';
import { formatCurrency } from '@/lib/constants';

interface ExpenseChartsProps {
  transactions: Transaction[];
  categories: Category[];
  userSettings: UserSettings;
}

export function ExpenseCharts({ transactions, categories, userSettings }: ExpenseChartsProps) {
  const categorySpending = getCategorySpending(transactions, 'month');
  const spendingTrend = getSpendingTrend(transactions, 7);

  const pieData = Object.entries(categorySpending)
    .map(([categoryId, amount]) => {
      const category = categories.find(cat => cat.id === categoryId);
      return {
        name: category?.name || categoryId,
        value: amount,
        color: category?.color || '#8884d8',
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const barData = spendingTrend.map(trend => ({
    date: new Date(trend.date).toLocaleDateString('en-US', { weekday: 'short' }),
    amount: trend.amount,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
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
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No expense data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7-Day Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {barData.some(d => d.amount > 0) ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" fill="oklch(0.45 0.15 250)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No spending data for the last 7 days
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}