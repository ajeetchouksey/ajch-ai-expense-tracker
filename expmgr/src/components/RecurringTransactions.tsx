import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { Transaction, Category, UserSettings } from '../lib/types';

interface RecurringTransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  userSettings: UserSettings;
}

export function RecurringTransactions({ transactions, categories, userSettings }: RecurringTransactionsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recurring Transactions</h2>
          <p className="text-muted-foreground">Manage your recurring income and expenses</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Recurring transactions management will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
