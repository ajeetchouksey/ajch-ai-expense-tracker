import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { UserSettings } from '@/lib/types';
import { DEFAULT_SETTINGS, CURRENCIES, COUNTRIES } from '@/lib/constants';
import { Settings, Globe, DollarSign, Brain, Save } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface SettingsComponentProps {
  onSettingsChange: (settings: UserSettings) => void;
}

export function SettingsComponent({ onSettingsChange }: SettingsComponentProps) {
  const [settings, setSettings] = useKV<UserSettings>('userSettings', DEFAULT_SETTINGS);
  const [tempSettings, setTempSettings] = useState<UserSettings>(settings);

  const handleSave = () => {
    setSettings(tempSettings);
    onSettingsChange(tempSettings);
    toast.success('Settings saved successfully!');
  };

  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    const newSettings = {
      ...tempSettings,
      country: countryCode,
      currency: country?.currency || tempSettings.currency,
    };
    setTempSettings(newSettings);
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(tempSettings);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Customize your experience and preferences</p>
      </div>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Regional Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="country">Country</Label>
            <Select value={tempSettings.country} onValueChange={handleCountryChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(country => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              Used for country-specific savings recommendations and advice
            </p>
          </div>

          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select 
              value={tempSettings.currency} 
              onValueChange={(value) => setTempSettings(prev => ({ ...prev, currency: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(currency => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name} ({currency.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              All amounts will be displayed in this currency
            </p>
          </div>

          <div>
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select 
              value={tempSettings.dateFormat} 
              onValueChange={(value) => setTempSettings(prev => ({ ...prev, dateFormat: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (International)</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="language">Language</Label>
            <Select 
              value={tempSettings.language} 
              onValueChange={(value) => setTempSettings(prev => ({ ...prev, language: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="hi">हिन्दी</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              Language preference (currently display only)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="aiRecommendations">AI Recommendations</Label>
              <p className="text-sm text-muted-foreground">
                Get personalized financial insights and recommendations
              </p>
            </div>
            <Switch
              id="aiRecommendations"
              checked={tempSettings.aiRecommendations}
              onCheckedChange={(checked) => 
                setTempSettings(prev => ({ ...prev, aiRecommendations: checked }))
              }
            />
          </div>
          
          {tempSettings.aiRecommendations && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Country-specific features for {COUNTRIES.find(c => c.code === tempSettings.country)?.name}:</strong>
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Localized savings advice and investment recommendations</li>
                <li>• Tax-advantaged account suggestions</li>
                <li>• Regional financial product recommendations</li>
                <li>• Cultural spending pattern insights</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy & Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Privacy & Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">🔒 Your Data is Private</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• All financial data is stored locally on your device</li>
              <li>• No data is sent to external servers for storage</li>
              <li>• AI features process data temporarily and securely</li>
              <li>• You have complete control over your financial information</li>
            </ul>
          </div>

          <div>
            <Label>Data Location</Label>
            <p className="text-sm text-muted-foreground">
              Your financial data is stored locally in your browser's secure storage. 
              This ensures your privacy while allowing the app to function properly.
            </p>
          </div>

          <div>
            <Label>AI Processing</Label>
            <p className="text-sm text-muted-foreground">
              When AI features are enabled, your data is processed securely to generate 
              insights. No personal financial data is permanently stored by AI services.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Currency Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Currency Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">How amounts will be displayed:</p>
            <div className="space-y-1">
              <p>Small amount: {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: tempSettings.currency,
              }).format(25.50)}</p>
              <p>Medium amount: {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: tempSettings.currency,
              }).format(1234.56)}</p>
              <p>Large amount: {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: tempSettings.currency,
              }).format(98765.43)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={handleSave} className="gap-2 shadow-lg">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}