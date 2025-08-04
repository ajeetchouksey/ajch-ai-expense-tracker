import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { Transaction, Category, Budget, UserSettings } from '../lib/types';

interface BudgetManagementProps {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  userSettings: UserSettings;
}

export function BudgetManagement({ transactions, categories, budgets, userSettings }: BudgetManagementProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Budget Management</h2>
          <p className="text-muted-foreground">Track and manage your budgets</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Budget management interface will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
