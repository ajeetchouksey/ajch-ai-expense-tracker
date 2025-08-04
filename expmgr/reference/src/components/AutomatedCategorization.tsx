import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Tag, 
  CheckCircle, 
  X, 
  AlertTriangle,
  Lightbulb,
  Settings,
  TrendUp
} from '@phosphor-icons/react';
import { Transaction, Category, CategorySuggestion, UserSettings } from '@/lib/types';
import { suggestTransactionCategory, trainCategoryModel } from '@/lib/ai';
import { toast } from 'sonner';

interface AutoCategorization {
  transactionId: string;
  originalCategory: string;
  suggestedCategory: string;
  confidence: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface AutomatedCategorizationProps {
  transactions: Transaction[];
  categories: Category[];
  userSettings: UserSettings;
  onUpdateTransaction: (id: string, category: string) => void;
}

export function AutomatedCategorization({ 
  transactions, 
  categories, 
  userSettings, 
  onUpdateTransaction 
}: AutomatedCategorizationProps) {
  const [autoCategorizationEnabled, setAutoCategorizationEnabled] = useKV('autoCategorizationEnabled', false);
  const [pendingSuggestions, setPendingSuggestions] = useKV('pendingSuggestions', [] as AutoCategorization[]);
  const [isTraining, setIsTraining] = useState(false);
  const [accuracyStats, setAccuracyStats] = useKV('categorizationStats', {
    totalSuggestions: 0,
    acceptedSuggestions: 0,
    rejectedSuggestions: 0,
    averageConfidence: 0
  });

  const handleToggleAutoCategorization = async (enabled: boolean) => {
    if (enabled && !userSettings.aiRecommendations) {
      toast.error('Please enable AI recommendations in settings first');
      return;
    }
    
    setAutoCategorizationEnabled(enabled);
    if (enabled) {
      await processPendingTransactions();
    }
  };

  const processPendingTransactions = async () => {
    if (!userSettings.aiRecommendations) return;
    
    // Find uncategorized or poorly categorized transactions
    const uncategorizedTransactions = transactions.filter(t => 
      !t.category || t.category === 'Other' || t.category === 'Uncategorized'
    );

    const newSuggestions: AutoCategorization[] = [];
    
    for (const transaction of uncategorizedTransactions.slice(0, 10)) { // Limit to 10 at a time
      try {
        const suggestion = await suggestTransactionCategory(
          transaction.description, 
          transaction.amount, 
          transaction.type,
          categories,
          transactions
        );
        
        if (suggestion.confidence > 0.6) { // Only suggest if confidence is high enough
          newSuggestions.push({
            transactionId: transaction.id,
            originalCategory: transaction.category,
            suggestedCategory: suggestion.suggestedCategory,
            confidence: suggestion.confidence,
            status: 'pending',
            createdAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Failed to get category suggestion:', error);
      }
    }

    if (newSuggestions.length > 0) {
      setPendingSuggestions(prev => [...prev, ...newSuggestions]);
      toast.success(`Generated ${newSuggestions.length} category suggestions`);
    }
  };

  const handleAcceptSuggestion = (suggestionId: string) => {
    const suggestion = pendingSuggestions.find(s => s.transactionId === suggestionId);
    if (suggestion) {
      onUpdateTransaction(suggestion.transactionId, suggestion.suggestedCategory);
      setPendingSuggestions(prev => 
        prev.map(s => 
          s.transactionId === suggestionId 
            ? { ...s, status: 'accepted' as const }
            : s
        )
      );
      
      // Update accuracy stats
      setAccuracyStats(prev => ({
        ...prev,
        totalSuggestions: prev.totalSuggestions + 1,
        acceptedSuggestions: prev.acceptedSuggestions + 1,
        averageConfidence: ((prev.averageConfidence * prev.totalSuggestions) + suggestion.confidence) / (prev.totalSuggestions + 1)
      }));
      
      toast.success('Category suggestion accepted');
    }
  };

  const handleRejectSuggestion = (suggestionId: string) => {
    const suggestion = pendingSuggestions.find(s => s.transactionId === suggestionId);
    if (suggestion) {
      setPendingSuggestions(prev => 
        prev.map(s => 
          s.transactionId === suggestionId 
            ? { ...s, status: 'rejected' as const }
            : s
        )
      );
      
      // Update accuracy stats
      setAccuracyStats(prev => ({
        ...prev,
        totalSuggestions: prev.totalSuggestions + 1,
        rejectedSuggestions: prev.rejectedSuggestions + 1,
        averageConfidence: ((prev.averageConfidence * prev.totalSuggestions) + suggestion.confidence) / (prev.totalSuggestions + 1)
      }));
      
      toast.success('Category suggestion rejected');
    }
  };

  const handleTrainModel = async () => {
    if (!userSettings.aiRecommendations) return;
    
    setIsTraining(true);
    try {
      await trainCategoryModel(transactions, categories);
      toast.success('Category model retrained successfully');
    } catch (error) {
      console.error('Failed to train model:', error);
      toast.error('Failed to retrain category model');
    } finally {
      setIsTraining(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const pendingCount = pendingSuggestions.filter(s => s.status === 'pending').length;
  const accuracy = accuracyStats.totalSuggestions > 0 
    ? (accuracyStats.acceptedSuggestions / accuracyStats.totalSuggestions) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Automated Categorization</h2>
          <p className="text-muted-foreground">
            AI-powered transaction categorization and suggestions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoCategorizationEnabled}
              onCheckedChange={handleToggleAutoCategorization}
              disabled={!userSettings.aiRecommendations}
            />
            <label className="text-sm font-medium">Auto-categorize</label>
          </div>
          <Button 
            onClick={handleTrainModel} 
            disabled={isTraining || !userSettings.aiRecommendations}
            variant="outline"
            className="gap-2"
          >
            <Brain className="h-4 w-4" />
            {isTraining ? 'Training...' : 'Retrain Model'}
          </Button>
        </div>
      </div>

      {!userSettings.aiRecommendations && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Enable AI recommendations in settings to use automated categorization.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Suggestions</CardTitle>
            <Tag className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
            <TrendUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(accuracy)}%</div>
            <Progress value={accuracy} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suggestions</CardTitle>
            <Brain className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accuracyStats.totalSuggestions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Confidence</CardTitle>
            <CheckCircle className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(accuracyStats.averageConfidence * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="history">Suggestion History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Category Suggestions</CardTitle>
              <CardDescription>
                Review and approve AI-generated category suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingSuggestions.filter(s => s.status === 'pending').length > 0 ? (
                <div className="space-y-4">
                  {pendingSuggestions
                    .filter(s => s.status === 'pending')
                    .map((suggestion) => {
                      const transaction = transactions.find(t => t.id === suggestion.transactionId);
                      if (!transaction) return null;

                      return (
                        <div key={suggestion.transactionId} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="font-medium">{transaction.description}</div>
                              <div className="text-sm text-muted-foreground">
                                Amount: {new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: userSettings.currency,
                                }).format(transaction.amount)}
                              </div>
                            </div>
                            <Badge className={getConfidenceColor(suggestion.confidence)}>
                              {getConfidenceLabel(suggestion.confidence)} ({Math.round(suggestion.confidence * 100)}%)
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Suggested category: </span>
                              <span className="font-medium">{suggestion.suggestedCategory}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAcceptSuggestion(suggestion.transactionId)}
                                className="gap-1"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectSuggestion(suggestion.transactionId)}
                                className="gap-1"
                              >
                                <X className="h-3 w-3" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending category suggestions</p>
                  {autoCategorizationEnabled && (
                    <Button 
                      onClick={processPendingTransactions} 
                      className="mt-4 gap-2"
                      variant="outline"
                    >
                      <Brain className="h-4 w-4" />
                      Generate Suggestions
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suggestion History</CardTitle>
              <CardDescription>
                Track of all category suggestions and their outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingSuggestions
                  .filter(s => s.status !== 'pending')
                  .slice(0, 20) // Show last 20
                  .map((suggestion) => {
                    const transaction = transactions.find(t => t.id === suggestion.transactionId);
                    if (!transaction) return null;

                    return (
                      <div key={suggestion.transactionId} className="flex items-center justify-between py-2 border-b">
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{transaction.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {suggestion.suggestedCategory}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={suggestion.status === 'accepted' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {suggestion.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(suggestion.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Categorization Settings
              </CardTitle>
              <CardDescription>
                Configure how automated categorization works
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Auto-categorization</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically suggest categories for new transactions
                  </p>
                </div>
                <Switch
                  checked={autoCategorizationEnabled}
                  onCheckedChange={handleToggleAutoCategorization}
                  disabled={!userSettings.aiRecommendations}
                />
              </div>
              
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  The AI learns from your transaction history and manual categorizations to improve accuracy over time.
                  The more data you provide, the better the suggestions become.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}