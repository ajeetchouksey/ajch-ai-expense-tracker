import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { Transaction, SavingGoal, Budget, UserSettings } from '../lib/types';

interface FinancialHealthProps {
  transactions: Transaction[];
  savingGoals: SavingGoal[];
  budgets: Budget[];
  userSettings: UserSettings;
}

export function FinancialHealth(_props: FinancialHealthProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Financial Health</h2>
          <p className="text-muted-foreground">Monitor your overall financial wellness</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Financial health dashboard will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
