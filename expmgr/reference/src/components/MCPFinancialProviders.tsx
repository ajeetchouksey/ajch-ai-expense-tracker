import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  Shield, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ExternalLink,
  Star,
  AlertTriangle,
  Brain,
  DollarSign,
  BarChart3,
  Target,
  TrendingUp
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Transaction, SavingGoal, Budget, UserSettings } from '@/lib/types';

// Mock MCP providers data
const MCPProviders = {
  'moneycontrol': {
    name: 'Money Control',
    description: 'Comprehensive financial news and market insights from India',
    region: 'India',
    isPremium: false,
    categories: ['investment', 'market', 'news'],
    endpoint: 'https://api.moneycontrol.com'
  },
  'investopedia': {
    name: 'Investopedia',
    description: 'Educational financial content and market analysis',
    region: 'Global',
    isPremium: false,
    categories: ['education', 'analysis', 'planning'],
    endpoint: 'https://api.investopedia.com'
  },
  'mintglobal': {
    name: 'Mint Global',
    description: 'Personal finance management and budgeting insights',
    region: 'Global',
    isPremium: true,
    categories: ['budgeting', 'planning', 'savings'],
    endpoint: 'https://api.mint.com'
  },
  'yahoofinance': {
    name: 'Yahoo Finance',
    description: 'Real-time market data and financial news',
    region: 'Global',
    isPremium: false,
    categories: ['market', 'news', 'analysis'],
    endpoint: 'https://api.finance.yahoo.com'
  }
};

interface FinancialAdvice {
  id: string;
  provider: string;
  title: string;
  content: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  createdAt: Date;
  source_url?: string;
}

interface MCPFinancialProvidersProps {
  userSettings: UserSettings;
  transactions: Transaction[];
  savingGoals: SavingGoal[];
  budgets: Budget[];
}

// Mock function to simulate MCP connection testing
const testMCPConnection = async (providerId: string): Promise<boolean> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  // Random success/failure for demo
  return Math.random() > 0.3;
};

// Mock function to get financial advice
const getMCPFinancialAdvice = async (
  providerId: string, 
  userContext: {
    transactions: Transaction[];
    savingGoals: SavingGoal[];
    budgets: Budget[];
    userSettings: UserSettings;
  }
): Promise<FinancialAdvice[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  const provider = MCPProviders[providerId as keyof typeof MCPProviders];
  if (!provider) return [];

  // Generate mock advice based on provider and user context
  const mockAdvice: FinancialAdvice[] = [
    {
      id: `${providerId}-1`,
      provider: provider.name,
      title: `Optimize your ${provider.categories[0]} strategy`,
      content: `Based on your recent spending patterns and financial goals, we recommend adjusting your ${provider.categories[0]} approach to maximize returns.`,
      category: provider.categories[0],
      priority: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
      confidence: 0.7 + Math.random() * 0.3,
      createdAt: new Date(),
      source_url: `${provider.endpoint}/advice/1`
    },
    {
      id: `${providerId}-2`,
      provider: provider.name,
      title: `${userSettings.country} specific financial insights`,
      content: `Tailored advice for ${userSettings.country} residents regarding tax optimization and local investment opportunities.`,
      category: 'planning',
      priority: 'medium',
      confidence: 0.8 + Math.random() * 0.2,
      createdAt: new Date(),
      source_url: `${provider.endpoint}/advice/2`
    }
  ];

  return mockAdvice;
};

export function MCPFinancialProviders({ 
  userSettings, 
  transactions, 
  savingGoals, 
  budgets 
}: MCPFinancialProvidersProps) {
  const [enabledProviders, setEnabledProviders] = useKV<string[]>('mcpEnabledProviders', []);
  const [providerStatus, setProviderStatus] = useKV<Record<string, 'connected' | 'error' | 'testing'>>('mcpProviderStatus', {});
  const [financialAdvice, setFinancialAdvice] = useKV<FinancialAdvice[]>('mcpFinancialAdvice', []);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    // Test connections for enabled providers on mount
    testConnections();
  }, [enabledProviders]);

  const testConnections = async () => {
    for (const providerId of enabledProviders) {
      setProviderStatus(prev => ({ ...prev, [providerId]: 'testing' }));
      try {
        const isConnected = await testMCPConnection(providerId);
        setProviderStatus(prev => ({ 
          ...prev, 
          [providerId]: isConnected ? 'connected' : 'error' 
        }));
        
        if (!isConnected) {
          toast.error(`Connection failed for ${MCPProviders[providerId as keyof typeof MCPProviders]?.name}`);
        }
      } catch (error) {
        setProviderStatus(prev => ({ ...prev, [providerId]: 'error' }));
        toast.error(`Connection error for ${MCPProviders[providerId as keyof typeof MCPProviders]?.name}`);
      }
    }
  };

  const toggleProvider = (providerId: string, enabled: boolean) => {
    setEnabledProviders(prev => {
      if (enabled) {
        return [...prev, providerId];
      } else {
        const newStatus = { ...providerStatus };
        delete newStatus[providerId];
        setProviderStatus(newStatus);
        return prev.filter(id => id !== providerId);
      }
    });
  };

  const fetchAllAdvice = async () => {
    if (enabledProviders.length === 0) {
      toast.error('Please enable at least one provider first');
      return;
    }

    setIsLoading(true);
    try {
      const allAdvice: FinancialAdvice[] = [];
      
      for (const providerId of enabledProviders) {
        if (providerStatus[providerId] === 'connected') {
          const advice = await getMCPFinancialAdvice(providerId, {
            transactions,
            savingGoals,
            budgets,
            userSettings
          });
          allAdvice.push(...advice);
        }
      }

      setFinancialAdvice(allAdvice);
      setLastUpdated(new Date());
      toast.success(`Fetched advice from ${allAdvice.length} sources`);
    } catch (error) {
      console.error('Failed to fetch financial advice:', error);
      toast.error('Failed to fetch financial advice');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'testing': return <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />;
      default: return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'investment': return <TrendingUp className="h-4 w-4" />;
      case 'savings': return <Target className="h-4 w-4" />;
      case 'budget': return <DollarSign className="h-4 w-4" />;
      case 'spending': return <BarChart3 className="h-4 w-4" />;
      case 'planning': return <Brain className="h-4 w-4" />;
      case 'market': return <BarChart3 className="h-4 w-4" />;
      case 'news': return <Globe className="h-4 w-4" />;
      case 'education': return <Brain className="h-4 w-4" />;
      case 'analysis': return <TrendingUp className="h-4 w-4" />;
      case 'budgeting': return <DollarSign className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const groupedAdvice = financialAdvice.reduce((acc, advice) => {
    const category = advice.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(advice);
    return acc;
  }, {} as Record<string, FinancialAdvice[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">MCP Financial Providers</h2>
          <p className="text-muted-foreground">
            Connect to multiple financial advice providers for comprehensive insights
          </p>
        </div>
        <Button 
          onClick={fetchAllAdvice} 
          disabled={isLoading || enabledProviders.length === 0}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Fetching...' : 'Get Latest Advice'}
        </Button>
      </div>

      {enabledProviders.length === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Enable at least one financial provider below to start receiving expert advice.
          </AlertDescription>
        </Alert>
      )}

      {lastUpdated && (
        <div className="text-sm text-muted-foreground">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="providers" className="gap-2">
            <Globe className="h-4 w-4" />
            Providers ({enabledProviders.length})
          </TabsTrigger>
          <TabsTrigger value="advice" className="gap-2">
            <Brain className="h-4 w-4" />
            Advice ({financialAdvice.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(MCPProviders).map(([providerId, provider]) => {
              const isEnabled = enabledProviders.includes(providerId);
              const status = providerStatus[providerId];
              
              return (
                <Card key={providerId} className={isEnabled ? 'ring-2 ring-primary/20' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                          <Globe className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{provider.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {provider.region}
                            </Badge>
                            {provider.isPremium && (
                              <Badge variant="secondary" className="text-xs">
                                Premium
                              </Badge>
                            )}
                            {isEnabled && getStatusIcon(status)}
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => toggleProvider(providerId, checked)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {provider.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {provider.categories.map(category => (
                        <Badge key={category} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="advice" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : Object.keys(groupedAdvice).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No financial advice available yet. Enable some providers and fetch advice to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedAdvice).map(([category, adviceList]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <h3 className="text-lg font-semibold capitalize">{category}</h3>
                    <Badge variant="outline">{adviceList.length}</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {adviceList.map(advice => (
                      <Card key={advice.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{advice.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {advice.provider}
                                </Badge>
                                <Badge variant={getPriorityColor(advice.priority)} className="text-xs">
                                  {advice.priority}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Star className="h-3 w-3" />
                                  {Math.round(advice.confidence * 100)}%
                                </div>
                              </div>
                            </div>
                            {advice.source_url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={advice.source_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {advice.content}
                          </p>
                          <div className="text-xs text-muted-foreground mt-2">
                            {advice.createdAt.toLocaleString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}