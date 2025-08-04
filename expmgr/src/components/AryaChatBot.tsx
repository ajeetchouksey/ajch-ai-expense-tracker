import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { Transaction, Category, UserSettings } from '../lib/types';

interface AryaChatBotProps {
  transactions: Transaction[];
  categories: Category[];
  userSettings: UserSettings;
}

export function AryaChatBot(_props: AryaChatBotProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Aarya Chat Assistant</h2>
          <p className="text-muted-foreground">Your AI financial advisor</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aarya AI chat assistant will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
