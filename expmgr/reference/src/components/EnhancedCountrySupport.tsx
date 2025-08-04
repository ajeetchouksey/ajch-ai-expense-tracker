import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, TrendUp, Lightbulb, Calculator, MapPin } from '@phosphor-icons/react';
import { UserSettings } from '@/lib/types';
import { COUNTRIES } from '@/lib/constants';

interface CountryData {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  savingsRate: number;
  avgMonthlyExpense: number;
  emergencyFundMonths: number;
  popularCategories: string[];
  culturalTips: string[];
  investmentOptions: string[];
  taxInfo: {
    incomeTaxRate: string;
    vatRate: string;
    deductibleExpenses: string[];
  };
}

const ENHANCED_COUNTRY_DATA: CountryData[] = [
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    currencySymbol: '$',
    savingsRate: 13.1,
    avgMonthlyExpense: 5102,
    emergencyFundMonths: 6,
    popularCategories: ['Housing', 'Transportation', 'Food', 'Healthcare', 'Entertainment'],
    culturalTips: [
      'Build credit history early with responsible credit card use',
      'Take advantage of employer 401(k) matching',
      'Consider tax-advantaged accounts like IRA and HSA'
    ],
    investmentOptions: ['401(k)', 'IRA', 'Roth IRA', 'Index Funds', 'ETFs'],
    taxInfo: {
      incomeTaxRate: '10-37%',
      vatRate: 'Varies by state',
      deductibleExpenses: ['Home office', 'Medical expenses', 'Charitable donations']
    }
  },
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    currencySymbol: '₹',
    savingsRate: 30.1,
    avgMonthlyExpense: 25000,
    emergencyFundMonths: 12,
    popularCategories: ['Food', 'Transportation', 'Housing', 'Healthcare', 'Education'],
    culturalTips: [
      'Invest in gold for cultural and financial security',
      'Consider family insurance plans for better coverage',
      'Use UPI and digital payments for better expense tracking'
    ],
    investmentOptions: ['PPF', 'ELSS', 'Fixed Deposits', 'Mutual Funds', 'NSC'],
    taxInfo: {
      incomeTaxRate: '5-30%',
      vatRate: '18% GST',
      deductibleExpenses: ['Life insurance premiums', 'Home loan interest', 'Medical insurance']
    }
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    currencySymbol: '£',
    savingsRate: 8.9,
    avgMonthlyExpense: 2500,
    emergencyFundMonths: 6,
    popularCategories: ['Housing', 'Transport', 'Food', 'Utilities', 'Recreation'],
    culturalTips: [
      'Maximize ISA allowances for tax-free savings',
      'Consider Help to Buy schemes for first home',
      'Use contactless payments and apps for expense tracking'
    ],
    investmentOptions: ['ISA', 'Pension schemes', 'Premium Bonds', 'Index funds', 'ETFs'],
    taxInfo: {
      incomeTaxRate: '20-45%',
      vatRate: '20%',
      deductibleExpenses: ['Pension contributions', 'Business expenses', 'Charitable donations']
    }
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    currencySymbol: 'C$',
    savingsRate: 5.7,
    avgMonthlyExpense: 4200,
    emergencyFundMonths: 6,
    popularCategories: ['Housing', 'Transportation', 'Food', 'Healthcare', 'Insurance'],
    culturalTips: [
      'Contribute to RRSP for tax benefits',
      'Use TFSA for tax-free growth',
      'Take advantage of government benefits like CCB'
    ],
    investmentOptions: ['RRSP', 'TFSA', 'GICs', 'Index funds', 'ETFs'],
    taxInfo: {
      incomeTaxRate: '15-33%',
      vatRate: '5-15% (GST/HST)',
      deductibleExpenses: ['RRSP contributions', 'Medical expenses', 'Childcare expenses']
    }
  }
];

interface EnhancedCountrySupportProps {
  userSettings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
}

export function EnhancedCountrySupport({ userSettings, onSettingsChange }: EnhancedCountrySupportProps) {
  const [selectedCountry, setSelectedCountry] = useState(userSettings.country);
  
  const currentCountryData = ENHANCED_COUNTRY_DATA.find(c => c.code === selectedCountry) || ENHANCED_COUNTRY_DATA[0];

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    const countryData = ENHANCED_COUNTRY_DATA.find(c => c.code === countryCode);
    if (countryData) {
      onSettingsChange({
        ...userSettings,
        country: countryCode,
        currency: countryData.currency
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle>Country & Region Settings</CardTitle>
          </div>
          <CardDescription>
            Get personalized financial advice and benchmarks for your location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Country</label>
              <Select value={selectedCountry} onValueChange={handleCountryChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENHANCED_COUNTRY_DATA.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <div className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span>{country.name}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {country.currency}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{currentCountryData.flag}</span>
                  <div>
                    <div className="font-medium">{currentCountryData.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {currentCountryData.currency} • {currentCountryData.currencySymbol}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="benchmarks" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="tips">Cultural Tips</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="tax">Tax Info</TabsTrigger>
        </TabsList>

        <TabsContent value="benchmarks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendUp className="h-5 w-5" />
                Financial Benchmarks for {currentCountryData.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {currentCountryData.savingsRate}%
                  </div>
                  <div className="text-sm text-muted-foreground">Average Savings Rate</div>
                </div>
                <div className="text-center p-4 bg-secondary/5 rounded-lg">
                  <div className="text-2xl font-bold text-secondary">
                    {currentCountryData.currencySymbol}{currentCountryData.avgMonthlyExpense.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Monthly Expenses</div>
                </div>
                <div className="text-center p-4 bg-accent/5 rounded-lg">
                  <div className="text-2xl font-bold text-accent">
                    {currentCountryData.emergencyFundMonths}
                  </div>
                  <div className="text-sm text-muted-foreground">Emergency Fund (Months)</div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-3">Popular Expense Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {currentCountryData.popularCategories.map((category) => (
                    <Badge key={category} variant="outline">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Financial Tips for {currentCountryData.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentCountryData.culturalTips.map((tip, index) => (
                  <div key={index} className="flex gap-3 p-4 bg-muted/30 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-primary">{index + 1}</span>
                    </div>
                    <p className="text-sm">{tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Investment Options in {currentCountryData.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {currentCountryData.investmentOptions.map((option, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{option}</span>
                    <Badge variant="secondary">Popular</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-info/5 border border-info/20 rounded-lg">
                <p className="text-sm text-info-foreground">
                  <strong>Note:</strong> These are common investment options in {currentCountryData.name}. 
                  Always consult with a qualified financial advisor before making investment decisions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Tax Information for {currentCountryData.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-medium mb-2">Income Tax Rate</h4>
                    <div className="text-lg font-bold text-primary">
                      {currentCountryData.taxInfo.incomeTaxRate}
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-medium mb-2">VAT/Sales Tax</h4>
                    <div className="text-lg font-bold text-secondary">
                      {currentCountryData.taxInfo.vatRate}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Common Tax Deductible Expenses</h4>
                  <div className="space-y-2">
                    {currentCountryData.taxInfo.deductibleExpenses.map((expense, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-success/5 rounded">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                        <span className="text-sm">{expense}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
                  <p className="text-sm text-warning-foreground">
                    <strong>Disclaimer:</strong> Tax information is general and may not reflect current rates. 
                    Consult with a tax professional for accurate, up-to-date advice.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}