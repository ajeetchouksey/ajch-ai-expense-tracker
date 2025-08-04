import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { UserSettings, Category } from '../lib/types';

interface SettingsComponentProps {
  userSettings: UserSettings;
  categories: Category[];
}

export function SettingsComponent(_props: SettingsComponentProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Configure your preferences</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Settings configuration will be implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
