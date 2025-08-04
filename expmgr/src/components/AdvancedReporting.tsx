import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { Transaction, Category, UserSettings } from '../lib/types';

interface AdvancedReportingProps {
  transactions: Transaction[];
  categories: Category[];
  userSettings: UserSettings;
}

export function AdvancedReporting(_props: AdvancedReportingProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Advanced Reporting</h2>
          <p className="text-muted-foreground">Detailed financial reports and analytics</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Advanced reporting features will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
