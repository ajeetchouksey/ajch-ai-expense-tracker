import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { Transaction, Category, SavingGoal, Budget, UserSettings } from '../lib/types';

interface AIRecommendationsProps {
  transactions: Transaction[];
  categories: Category[];
  savingGoals: SavingGoal[];
  budgets: Budget[];
  userSettings: UserSettings;
}

export function AIRecommendations(_props: AIRecommendationsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Recommendations</h2>
          <p className="text-muted-foreground">Personalized financial insights</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            AI-powered recommendations will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
