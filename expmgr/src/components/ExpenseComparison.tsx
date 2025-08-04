import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { Transaction, Category, UserSettings } from '../lib/types';

interface ExpenseComparisonProps {
  transactions: Transaction[];
  categories: Category[];
  userSettings: UserSettings;
}

export function ExpenseComparison(_props: ExpenseComparisonProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Expense Comparison</h2>
          <p className="text-muted-foreground">Compare spending across periods</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Expense comparison charts will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
