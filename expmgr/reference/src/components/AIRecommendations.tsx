import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AIRecommendation, Transaction, SavingGoal, Budget, UserSettings } from '@/lib/types';
import { generateAIRecommendations, generateSavingsAdvice, analyzeSpendingPatterns, generateBudgetInsights } from '@/lib/ai';
import { calculateDashboardStats } from '@/lib/analytics';
import { Lightbulb, Brain, TrendingUp, CheckCircle, X, RefreshCw } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface AIRecommendationsProps {
  transactions: Transaction[];
  savingGoals: SavingGoal[];
  budgets: Budget[];
  userSettings: UserSettings;
}

export function AIRecommendations({ transactions, savingGoals, budgets, userSettings }: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useKV<AIRecommendation[]>('aiRecommendations', []);
  const [isLoading, setIsLoading] = useState(false);
  const [savingsAdvice, setSavingsAdvice] = useState<string>('');
  const [spendingInsights, setSpendingInsights] = useState<string>('');
  const [budgetInsights, setBudgetInsights] = useState<string>('');

  const unreadRecommendations = recommendations.filter(r => !r.isRead);
  const stats = calculateDashboardStats(transactions, savingGoals, budgets);

  useEffect(() => {
    if (userSettings.aiRecommendations && transactions.length > 0) {
      generateRecommendations();
    }
  }, [transactions.length, savingGoals.length, budgets.length, userSettings.aiRecommendations]);

  const generateRecommendations = async () => {
    if (!userSettings.aiRecommendations) {
      toast.error('AI recommendations are disabled in settings');
      return;
    }

    setIsLoading(true);
    try {
      // Generate AI recommendations
      const newRecommendations = await generateAIRecommendations(
        transactions,
        savingGoals,
        budgets,
        userSettings
      );

      // Generate savings advice
      const advice = await generateSavingsAdvice(
        stats.totalIncome,
        stats.totalExpenses,
        userSettings.country
      );

      // Generate spending insights
      const insights = await analyzeSpendingPatterns(transactions);

      // Generate budget insights
      const budgetAdvice = await generateBudgetInsights(budgets, transactions);

      setRecommendations(prev => {
        // Remove old recommendations and add new ones
        const filtered = prev.filter(r => r.isRead);
        return [...filtered, ...newRecommendations];
      });

      setSavingsAdvice(advice);
      setSpendingInsights(insights);
      setBudgetInsights(budgetAdvice);

      toast.success('AI insights generated successfully!');
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      toast.error('Failed to generate AI insights. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = (id: string) => {
    setRecommendations(prev => prev.map(rec => 
      rec.id === id ? { ...rec, isRead: true } : rec
    ));
  };

  const dismissRecommendation = (id: string) => {
    setRecommendations(prev => prev.filter(rec => rec.id !== id));
    toast.success('Recommendation dismissed');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'savings': return TrendingUp;
      case 'budget': return Lightbulb;
      case 'goal': return CheckCircle;
      case 'spending': return Brain;
      default: return Lightbulb;
    }
  };

  if (!userSettings.aiRecommendations) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">AI Recommendations</h2>
          <p className="text-muted-foreground">Get personalized financial insights and advice</p>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">AI Recommendations Disabled</h3>
            <p className="text-muted-foreground text-center">
              Enable AI recommendations in settings to get personalized financial insights
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Recommendations</h2>
          <p className="text-muted-foreground">Get personalized financial insights and advice</p>
        </div>
        <Button 
          onClick={generateRecommendations} 
          disabled={isLoading || transactions.length === 0}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Generating...' : 'Refresh Insights'}
        </Button>
      </div>

      {/* Unread Recommendations Alert */}
      {unreadRecommendations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Lightbulb className="h-5 w-5" />
              {unreadRecommendations.length} New Recommendation{unreadRecommendations.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* AI Insights Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Savings Advice */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Savings Advice for {userSettings.country}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : savingsAdvice ? (
              <p className="text-sm">{savingsAdvice}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click "Refresh Insights" to get personalized savings advice
              </p>
            )}
          </CardContent>
        </Card>

        {/* Spending Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Spending Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : spendingInsights ? (
              <p className="text-sm">{spendingInsights}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Analyze your spending patterns with AI insights
              </p>
            )}
          </CardContent>
        </Card>

        {/* Budget Insights */}
        {budgets.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Budget Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : budgetInsights ? (
                <p className="text-sm">{budgetInsights}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Get insights on your budget performance
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Recommendations */}
      {recommendations.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Detailed Recommendations</h3>
          {recommendations
            .sort((a, b) => {
              // Sort by read status first, then by priority, then by date
              if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
              const priorityOrder = { high: 0, medium: 1, low: 2 };
              const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 1;
              const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 1;
              if (aPriority !== bPriority) return aPriority - bPriority;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            })
            .map(recommendation => {
              const IconComponent = getTypeIcon(recommendation.type);
              
              return (
                <Card 
                  key={recommendation.id} 
                  className={`${recommendation.isRead ? 'opacity-60' : ''} ${
                    recommendation.priority === 'high' ? 'border-red-200' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <IconComponent className="h-5 w-5 mt-0.5" />
                        <div>
                          <CardTitle className="text-base">{recommendation.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getPriorityColor(recommendation.priority)}>
                              {recommendation.priority}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {recommendation.type}
                            </Badge>
                            {recommendation.confidence && (
                              <span className="text-xs text-muted-foreground">
                                {Math.round(recommendation.confidence * 100)}% confidence
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!recommendation.isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead(recommendation.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dismissRecommendation(recommendation.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">{recommendation.description}</p>
                    
                    {recommendation.actionItems && recommendation.actionItems.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Action Items:</p>
                        <ul className="text-sm space-y-1">
                          {recommendation.actionItems.map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-muted-foreground">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add some transactions and click "Refresh Insights" to get AI-powered recommendations
            </p>
            {transactions.length > 0 && (
              <Button onClick={generateRecommendations} disabled={isLoading} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Generate Recommendations
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}