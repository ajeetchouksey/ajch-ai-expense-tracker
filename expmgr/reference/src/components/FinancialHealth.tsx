import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart, 
  TrendUp, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  PiggyBank,
  Wallet,
  CreditCard,
  Brain
} from '@phosphor-icons/react';
import { Transaction, SavingGoal, Budget, UserSettings, FinancialHealthScore } from '@/lib/types';
import { calculateFinancialHealthScore } from '@/lib/ai';
import { format } from 'date-fns';

interface FinancialHealthProps {
  transactions: Transaction[];
  savingGoals: SavingGoal[];
  budgets: Budget[];
  userSettings: UserSettings;
}

export function FinancialHealth({ transactions, savingGoals, budgets, userSettings }: FinancialHealthProps) {
  const [healthScore, setHealthScore] = useKV('financialHealthScore', null as FinancialHealthScore | null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculateHealth = async () => {
    if (!userSettings.aiRecommendations) return;
    
    setIsCalculating(true);
    try {
      const score = await calculateFinancialHealthScore(transactions, savingGoals, budgets, userSettings);
      setHealthScore(score);
    } catch (error) {
      console.error('Failed to calculate health score:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    // Auto-calculate if data is available and AI is enabled
    if (transactions.length > 0 && userSettings.aiRecommendations && !healthScore) {
      handleCalculateHealth();
    }
  }, [transactions.length, userSettings.aiRecommendations]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Shield className="h-5 w-5 text-green-600" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'savings':
        return <PiggyBank className="h-5 w-5" />;
      case 'spending':
        return <Wallet className="h-5 w-5" />;
      case 'budgeting':
        return <Target className="h-5 w-5" />;
      case 'debt':
        return <CreditCard className="h-5 w-5" />;
      case 'goals':
        return <Target className="h-5 w-5" />;
      default:
        return <Heart className="h-5 w-5" />;
    }
  };

  if (!userSettings.aiRecommendations) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="flex items-center gap-3 p-6">
          <AlertTriangle className="h-6 w-6 text-yellow-600" />
          <div>
            <h3 className="font-semibold text-yellow-800">AI Features Disabled</h3>
            <p className="text-sm text-yellow-700">
              Enable AI recommendations in settings to access your Financial Health Score.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Financial Health Score</h2>
          <p className="text-muted-foreground">
            AI-powered assessment of your financial wellness
          </p>
        </div>
        <Button 
          onClick={handleCalculateHealth} 
          disabled={isCalculating}
          className="gap-2"
        >
          <Brain className="h-4 w-4" />
          {isCalculating ? 'Calculating...' : 'Refresh Score'}
        </Button>
      </div>

      {healthScore ? (
        <>
          {/* Overall Score Card */}
          <Card className={`border-2 ${getScoreBgColor(healthScore.overall)}`}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <div className={`relative w-32 h-32 rounded-full border-8 border-current ${getScoreColor(healthScore.overall)} flex items-center justify-center`}>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{healthScore.overall}</div>
                    <div className="text-sm">/ 100</div>
                  </div>
                </div>
              </div>
              <CardTitle className="text-2xl">
                {healthScore.overall >= 80 ? 'Excellent' : 
                 healthScore.overall >= 60 ? 'Good' : 'Needs Improvement'}
              </CardTitle>
              <CardDescription className="flex items-center justify-center gap-2">
                {getRiskIcon(healthScore.riskLevel)}
                <span className="capitalize">{healthScore.riskLevel} Risk Level</span>
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Breakdown Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(healthScore.breakdown).map(([category, score]) => (
              <Card key={category}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium capitalize flex items-center gap-2">
                    {getCategoryIcon(category)}
                    {category}
                  </CardTitle>
                  <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                    {score}
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={score} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="insights" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="insights">Key Insights</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendUp className="h-5 w-5" />
                    Financial Insights
                  </CardTitle>
                  <CardDescription>
                    AI-generated analysis of your financial patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {healthScore.insights.map((insight, index) => (
                    <Alert key={index}>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>{insight}</AlertDescription>
                    </Alert>
                  ))}
                  {healthScore.insights.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No specific insights available yet. Add more transactions to get detailed analysis.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Action Recommendations
                  </CardTitle>
                  <CardDescription>
                    Personalized suggestions to improve your financial health
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {healthScore.recommendations.map((recommendation, index) => (
                    <Alert key={index} className="border-blue-200 bg-blue-50">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        {recommendation}
                      </AlertDescription>
                    </Alert>
                  ))}
                  {healthScore.recommendations.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      Great job! No immediate recommendations at this time.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {healthScore.lastCalculated && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="flex items-center gap-3 p-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-sm text-green-800">
                  Last calculated: {format(new Date(healthScore.lastCalculated), 'MMM dd, yyyy HH:mm')}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Calculate Your Financial Health</h3>
            <p className="text-muted-foreground mb-6">
              Get an AI-powered assessment of your financial wellness based on your spending patterns, savings, and goals.
            </p>
            <Button onClick={handleCalculateHealth} disabled={isCalculating} className="gap-2">
              <Brain className="h-4 w-4" />
              {isCalculating ? 'Calculating...' : 'Calculate Health Score'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}