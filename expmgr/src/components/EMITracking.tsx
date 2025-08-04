import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { Transaction, UserSettings } from '../lib/types';

interface EMITrackingProps {
  transactions: Transaction[];
  userSettings: UserSettings;
}

export function EMITracking(_props: EMITrackingProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">EMI Tracking</h2>
          <p className="text-muted-foreground">Track your EMI payments and loans</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            EMI tracking interface will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
