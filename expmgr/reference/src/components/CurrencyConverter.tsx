import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CURRENCIES, COUNTRIES } from '@/lib/constants';
import { UserSettings } from '@/lib/types';
import { ArrowsLeftRight, TrendUp, Calculator, Globe } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface CurrencyConverterProps {
  userSettings: UserSettings;
}

// Simulated exchange rates - in a real app, you'd fetch these from an API
const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  USD: { EUR: 0.85, GBP: 0.73, INR: 83.12, JPY: 149.50, CAD: 1.36, AUD: 1.52, CNY: 7.24, CHF: 0.88, SGD: 1.35, KRW: 1329.50, BRL: 4.95, MXN: 17.05, SAR: 3.75, AED: 3.67 },
  EUR: { USD: 1.18, GBP: 0.86, INR: 97.79, JPY: 176.21, CAD: 1.60, AUD: 1.79, CNY: 8.53, CHF: 1.04, SGD: 1.59, KRW: 1568.42, BRL: 5.83, MXN: 20.10, SAR: 4.42, AED: 4.33 },
  GBP: { USD: 1.37, EUR: 1.16, INR: 113.91, JPY: 205.14, CAD: 1.86, AUD: 2.08, CNY: 9.93, CHF: 1.21, SGD: 1.85, KRW: 1825.62, BRL: 6.79, MXN: 23.40, SAR: 5.14, AED: 5.04 },
  INR: { USD: 0.012, EUR: 0.010, GBP: 0.009, JPY: 1.80, CAD: 0.016, AUD: 0.018, CNY: 0.087, CHF: 0.011, SGD: 0.016, KRW: 16.00, BRL: 0.060, MXN: 0.205, SAR: 0.045, AED: 0.044 },
};

export function CurrencyConverter({ userSettings }: CurrencyConverterProps) {
  const [fromCurrency, setFromCurrency] = useState(userSettings.currency);
  const [toCurrency, setToCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const convertCurrency = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const rate = getExchangeRate(fromCurrency, toCurrency);
    const result = parseFloat(amount) * rate;
    setConvertedAmount(result);
    setLoading(false);
    
    toast.success(`Converted ${amount} ${fromCurrency} to ${toCurrency}`);
  };

  const getExchangeRate = (from: string, to: string): number => {
    if (from === to) return 1;
    if (EXCHANGE_RATES[from] && EXCHANGE_RATES[from][to]) {
      return EXCHANGE_RATES[from][to];
    }
    // Fallback calculation via USD
    if (from !== 'USD' && to !== 'USD') {
      const toUSD = EXCHANGE_RATES[from]?.USD || 1;
      const fromUSD = EXCHANGE_RATES['USD']?.[to] || 1;
      return toUSD * fromUSD;
    }
    return 1;
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setConvertedAmount(null);
  };

  const popularPairs = [
    { from: 'USD', to: 'EUR' },
    { from: 'USD', to: 'GBP' },
    { from: 'USD', to: 'INR' },
    { from: 'EUR', to: 'GBP' },
    { from: 'GBP', to: 'INR' },
  ];

  const getCurrencyInfo = (code: string) => {
    return CURRENCIES.find(c => c.code === code);
  };

  const getCountryFlag = (currencyCode: string) => {
    const country = COUNTRIES.find(c => c.currency === currencyCode);
    return country?.flag || '💱';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Calculator className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Currency Converter</h2>
          <p className="text-muted-foreground">Convert between different currencies with real-time rates</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Currency Converter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From</Label>
                  <Select value={fromCurrency} onValueChange={setFromCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getCountryFlag(currency.code)}</span>
                            <span>{currency.code}</span>
                            <span className="text-muted-foreground">{currency.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>To</Label>
                  <div className="flex gap-2">
                    <Select value={toCurrency} onValueChange={setToCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getCountryFlag(currency.code)}</span>
                              <span>{currency.code}</span>
                              <span className="text-muted-foreground">{currency.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={swapCurrencies}
                      className="shrink-0"
                    >
                      <ArrowsLeftRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-lg font-semibold pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {getCurrencyInfo(fromCurrency)?.symbol}
                  </span>
                </div>
              </div>

              <Button 
                onClick={convertCurrency} 
                disabled={loading || !amount}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
              >
                {loading ? 'Converting...' : 'Convert Currency'}
              </Button>

              {convertedAmount !== null && (
                <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-success">
                  <div className="text-sm text-muted-foreground">Converted Amount</div>
                  <div className="text-2xl font-bold text-success">
                    {getCurrencyInfo(toCurrency)?.symbol}{convertedAmount.toFixed(2)} {toCurrency}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    1 {fromCurrency} = {getExchangeRate(fromCurrency, toCurrency).toFixed(4)} {toCurrency}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendUp className="h-5 w-5" />
              Popular Currency Pairs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {popularPairs.map((pair, index) => {
                const rate = getExchangeRate(pair.from, pair.to);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setFromCurrency(pair.from);
                      setToCurrency(pair.to);
                      setConvertedAmount(null);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{getCountryFlag(pair.from)}</span>
                        <span className="font-medium">{pair.from}</span>
                      </div>
                      <ArrowsLeftRight className="h-3 w-3 text-muted-foreground" />
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{getCountryFlag(pair.to)}</span>
                        <span className="font-medium">{pair.to}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {rate.toFixed(4)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}