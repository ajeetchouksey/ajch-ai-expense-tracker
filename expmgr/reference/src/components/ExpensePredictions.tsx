import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendUp, TrendDown, Minus, Brain, AlertTriangle, CheckCircle } from '@phosphor-icons/react';
import { Transaction, ExpensePrediction, UserSettings, Category } from '@/lib/types';
import { generateExpensePredictions } from '@/lib/ai';
import { format, addDays, addMonths } from 'date-fns';

interface ExpensePredictionsProps {
  transactions: Transaction[];
  categories: Category[];
  userSettings: UserSettings;
}

export function ExpensePredictions({ transactions, categories, userSettings }: ExpensePredictionsProps) {
  const [predictions] = useKV('expensePredictions', [] as ExpensePrediction[]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'next_week' | 'next_month' | 'next_quarter'>('next_month');
  const [lastGenerated, setLastGenerated] = useKV('predictionsLastGenerated', '');

  const handleGeneratePredictions = async () => {
    if (!userSettings.aiRecommendations) return;
    
    setIsGenerating(true);
    try {
      const newPredictions = await generateExpensePredictions(transactions, categories, selectedPeriod);
      setLastGenerated(new Date().toISOString());
    } catch (error) {
      console.error('Failed to generate predictions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendUp className="h-4 w-4 text-red-500" />;
      case 'decreasing':
        return <TrendDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: userSettings.currency,
    }).format(amount);
  };

  const filteredPredictions = predictions.filter(p => p.period === selectedPeriod);
  const totalPredicted = filteredPredictions.reduce((sum, p) => sum + p.predictedAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Smart Expense Predictions</h2>
          <p className="text-muted-foreground">
            AI-powered forecasts based on your spending patterns
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="next_week">Next Week</SelectItem>
              <SelectItem value="next_month">Next Month</SelectItem>
              <SelectItem value="next_quarter">Next Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleGeneratePredictions} 
            disabled={isGenerating || !userSettings.aiRecommendations}
            className="gap-2"
          >
            <Brain className="h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Generate Predictions'}
          </Button>
        </div>
      </div>

      {!userSettings.aiRecommendations && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Enable AI recommendations in settings to use expense predictions.
            </p>
          </CardContent>
        </Card>
      )}

      {lastGenerated && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800">
              Last updated: {format(new Date(lastGenerated), 'MMM dd, yyyy HH:mm')}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Predicted Total</CardTitle>
            <CardDescription>
              Expected spending for {selectedPeriod.replace('_', ' ')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalPredicted)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prediction Accuracy</CardTitle>
            <CardDescription>
              Based on historical data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {['high', 'medium', 'low'].map((confidence) => {
                const count = filteredPredictions.filter(p => p.confidence === confidence).length;
                const percentage = filteredPredictions.length > 0 ? (count / filteredPredictions.length) * 100 : 0;
                return (
                  <div key={confidence} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{confidence} confidence</span>
                    <span>{count} ({Math.round(percentage)}%)</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trending Categories</CardTitle>
            <CardDescription>
              Categories with notable changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredPredictions
                .filter(p => p.trend !== 'stable')
                .slice(0, 3)
                .map((prediction) => (
                  <div key={prediction.category} className="flex items-center justify-between">
                    <span className="text-sm">{prediction.category}</span>
                    {getTrendIcon(prediction.trend)}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Predictions</CardTitle>
          <CardDescription>
            Detailed forecasts by spending category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPredictions.map((prediction) => (
              <div key={prediction.category} className="space-y-3 border-b pb-4 last:border-b-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{prediction.category}</span>
                    {getTrendIcon(prediction.trend)}
                    <Badge className={getConfidenceColor(prediction.confidence)}>
                      {prediction.confidence}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(prediction.predictedAmount)}</div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round(prediction.accuracy)}% accuracy
                    </div>
                  </div>
                </div>
                
                <Progress value={prediction.accuracy} className="h-2" />
                
                {prediction.factors.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Key factors:</span> {prediction.factors.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {filteredPredictions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Generate predictions to see AI-powered expense forecasts</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}