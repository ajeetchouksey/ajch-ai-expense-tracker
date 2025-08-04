import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { Transaction, Category, UserSettings } from '../lib/types';

interface ExpensePredictionsProps {
  transactions: Transaction[];
  categories: Category[];
  userSettings: UserSettings;
}

export function ExpensePredictions(_props: ExpensePredictionsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Expense Predictions</h2>
          <p className="text-muted-foreground">AI-powered expense forecasting</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            AI expense predictions will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
