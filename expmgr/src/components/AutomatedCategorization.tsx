import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { Transaction, Category, UserSettings } from '../lib/types';

interface AutomatedCategorizationProps {
  transactions: Transaction[];
  categories: Category[];
  userSettings: UserSettings;
}

export function AutomatedCategorization(_props: AutomatedCategorizationProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Auto-Categorization</h2>
          <p className="text-muted-foreground">AI-powered transaction categorization</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Automated categorization settings will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
