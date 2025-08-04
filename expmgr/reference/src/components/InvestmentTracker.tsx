import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKV } from '@github/spark/hooks';
import { UserSettings } from '@/lib/types';
import { TrendUp, TrendDown, DollarSign, PiggyBank, Calculator, Target, Award, Lightbulb } from '@phosphor-icons/react';

interface Investment {
  id: string;
  name: string;
  type: 'stocks' | 'bonds' | 'crypto' | 'real-estate' | 'mutual-funds' | 'etf' | 'commodities';
  amount: number;
  currentValue: number;
  purchaseDate: Date;
  expectedReturn: number;
  risk: 'low' | 'medium' | 'high';
  platform: string;
  notes: string;
}

interface PortfolioAnalysis {
  totalValue: number;
  totalInvested: number;
  totalGains: number;
  totalGainsPercent: number;
  diversificationScore: number;
  riskScore: number;
  recommendations: string[];
}

interface InvestmentTrackerProps {
  userSettings: UserSettings;
}

export function InvestmentTracker({ userSettings }: InvestmentTrackerProps) {
  const [investments, setInvestments] = useKV('investments', [] as Investment[]);
  const [isAddingInvestment, setIsAddingInvestment] = useState(false);
  const [selectedTab, setSelectedTab] = useState('portfolio');
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [newInvestment, setNewInvestment] = useState<Partial<Investment>>({
    name: '',
    type: 'stocks',
    amount: 0,
    currentValue: 0,
    purchaseDate: new Date(),
    expectedReturn: 8,
    risk: 'medium',
    platform: '',
    notes: ''
  });

  useEffect(() => {
    if (investments.length > 0) {
      calculatePortfolioAnalysis();
    }
  }, [investments]);

  const calculatePortfolioAnalysis = async () => {
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalGains = totalValue - totalInvested;
    const totalGainsPercent = totalInvested > 0 ? (totalGains / totalInvested) * 100 : 0;

    // Calculate diversification score (0-100)
    const typeDistribution = investments.reduce((acc, inv) => {
      acc[inv.type] = (acc[inv.type] || 0) + inv.currentValue;
      return acc;
    }, {} as Record<string, number>);

    const typeCount = Object.keys(typeDistribution).length;
    const maxConcentration = Math.max(...Object.values(typeDistribution)) / totalValue;
    const diversificationScore = Math.min(100, (typeCount * 15) + ((1 - maxConcentration) * 50));

    // Calculate risk score (weighted average)
    const riskWeights = { low: 1, medium: 2, high: 3 };
    const weightedRisk = investments.reduce((sum, inv) => 
      sum + (riskWeights[inv.risk] * inv.currentValue), 0
    ) / totalValue;
    const riskScore = (weightedRisk / 3) * 100;

    // Generate AI recommendations
    const prompt = spark.llmPrompt`Analyze this investment portfolio and provide 3-5 actionable recommendations:
    
Portfolio Summary:
- Total Invested: ${userSettings.currency} ${totalInvested}
- Current Value: ${userSettings.currency} ${totalValue}
- Returns: ${totalGainsPercent.toFixed(2)}%
- Diversification Score: ${diversificationScore}/100
- Risk Score: ${riskScore}/100
- Asset Types: ${Object.keys(typeDistribution).join(', ')}
- Country: ${userSettings.country}

Focus on practical advice for improving returns, managing risk, and optimizing the portfolio for someone in ${userSettings.country}.`;

    try {
      const aiRecommendations = await spark.llm(prompt);
      const recommendations = aiRecommendations.split('\n').filter(r => r.trim().length > 0).slice(0, 5);

      setAnalysis({
        totalValue,
        totalInvested,
        totalGains,
        totalGainsPercent,
        diversificationScore,
        riskScore,
        recommendations
      });
    } catch (error) {
      setAnalysis({
        totalValue,
        totalInvested,
        totalGains,
        totalGainsPercent,
        diversificationScore,
        riskScore,
        recommendations: ['Unable to generate recommendations at this time.']
      });
    }
  };

  const addInvestment = () => {
    if (!newInvestment.name || !newInvestment.amount) {
      return;
    }

    const investment: Investment = {
      id: Date.now().toString(),
      name: newInvestment.name!,
      type: newInvestment.type!,
      amount: newInvestment.amount!,
      currentValue: newInvestment.currentValue || newInvestment.amount!,
      purchaseDate: newInvestment.purchaseDate!,
      expectedReturn: newInvestment.expectedReturn || 8,
      risk: newInvestment.risk!,
      platform: newInvestment.platform || '',
      notes: newInvestment.notes || ''
    };

    setInvestments(prev => [...prev, investment]);
    setNewInvestment({
      name: '',
      type: 'stocks',
      amount: 0,
      currentValue: 0,
      purchaseDate: new Date(),
      expectedReturn: 8,
      risk: 'medium',
      platform: '',
      notes: ''
    });
    setIsAddingInvestment(false);
  };

  const updateInvestmentValue = (id: string, newValue: number) => {
    setInvestments(prev => prev.map(inv => 
      inv.id === id ? { ...inv, currentValue: newValue } : inv
    ));
  };

  const deleteInvestment = (id: string) => {
    setInvestments(prev => prev.filter(inv => inv.id !== id));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'stocks': return '📈';
      case 'bonds': return '🏛️';
      case 'crypto': return '₿';
      case 'real-estate': return '🏠';
      case 'mutual-funds': return '📊';
      case 'etf': return '📋';
      case 'commodities': return '🥇';
      default: return '💼';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-success border-success';
      case 'medium': return 'text-warning border-warning';
      case 'high': return 'text-destructive border-destructive';
      default: return 'text-muted-foreground border-muted';
    }
  };

  const getReturnColor = (percentage: number) => {
    if (percentage > 0) return 'text-success';
    if (percentage < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendUp className="h-5 w-5 text-primary" />
              Investment Portfolio Tracker
            </CardTitle>
            <Button onClick={() => setIsAddingInvestment(true)} size="sm">
              Add Investment
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Portfolio Summary */}
      {analysis && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Portfolio Value</div>
                  <div className="text-2xl font-bold">
                    {userSettings.currency} {analysis.totalValue.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  analysis.totalGains >= 0 ? 'bg-success/20' : 'bg-destructive/20'
                }`}>
                  {analysis.totalGains >= 0 ? 
                    <TrendUp className="h-5 w-5 text-success" /> : 
                    <TrendDown className="h-5 w-5 text-destructive" />
                  }
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Returns</div>
                  <div className={`text-2xl font-bold ${getReturnColor(analysis.totalGainsPercent)}`}>
                    {analysis.totalGainsPercent > 0 ? '+' : ''}{analysis.totalGainsPercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-info" />
                <div>
                  <div className="text-sm text-muted-foreground">Diversification</div>
                  <div className="text-2xl font-bold">{analysis.diversificationScore.toFixed(0)}/100</div>
                  <Progress value={analysis.diversificationScore} className="h-1 mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-warning" />
                <div>
                  <div className="text-sm text-muted-foreground">Risk Level</div>
                  <div className="text-2xl font-bold">{analysis.riskScore.toFixed(0)}/100</div>
                  <Progress value={analysis.riskScore} className="h-1 mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-4">
          {investments.map(investment => (
            <Card key={investment.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getTypeIcon(investment.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{investment.name}</h3>
                        <Badge variant="outline" className={getRiskColor(investment.risk)}>
                          {investment.risk} risk
                        </Badge>
                        <Badge variant="secondary">{investment.type}</Badge>
                      </div>
                      
                      <div className="grid gap-2 md:grid-cols-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Invested: </span>
                          <span className="font-medium">
                            {userSettings.currency} {investment.amount.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Current: </span>
                          <span className="font-medium">
                            {userSettings.currency} {investment.currentValue.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Return: </span>
                          <span className={`font-medium ${getReturnColor(
                            ((investment.currentValue - investment.amount) / investment.amount) * 100
                          )}`}>
                            {((investment.currentValue - investment.amount) / investment.amount) * 100 > 0 ? '+' : ''}
                            {(((investment.currentValue - investment.amount) / investment.amount) * 100).toFixed(2)}%
                          </span>
                        </div>
                      </div>

                      {investment.platform && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Platform: {investment.platform}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Input
                      type="number"
                      placeholder="Update value"
                      className="w-32"
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value);
                        if (value > 0) {
                          updateInvestmentValue(investment.id, value);
                          e.target.value = '';
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteInvestment(investment.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {investments.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No investments tracked</h3>
                <p className="text-muted-foreground mb-4">Start building your investment portfolio!</p>
                <Button onClick={() => setIsAddingInvestment(true)}>
                  Add Your First Investment
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {analysis && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Asset Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.entries(
                    investments.reduce((acc, inv) => {
                      acc[inv.type] = (acc[inv.type] || 0) + inv.currentValue;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, value]) => {
                    const percentage = analysis.totalValue > 0 ? (value / analysis.totalValue) * 100 : 0;
                    return (
                      <div key={type} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <span>{getTypeIcon(type)}</span>
                          <span className="capitalize">{type.replace('-', ' ')}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{percentage.toFixed(1)}%</div>
                          <div className="text-sm text-muted-foreground">
                            {userSettings.currency} {value.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Portfolio Risk Score</span>
                        <span className="font-bold">{analysis.riskScore.toFixed(0)}/100</span>
                      </div>
                      <Progress value={analysis.riskScore} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Diversification Score</span>
                        <span className="font-bold">{analysis.diversificationScore.toFixed(0)}/100</span>
                      </div>
                      <Progress value={analysis.diversificationScore} className="h-2" />
                    </div>

                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span>Low Risk Assets:</span>
                        <span>{investments.filter(i => i.risk === 'low').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Medium Risk Assets:</span>
                        <span>{investments.filter(i => i.risk === 'medium').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>High Risk Assets:</span>
                        <span>{investments.filter(i => i.risk === 'high').length}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  AI-Powered Investment Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.recommendations.map((recommendation, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Investment Modal */}
      {isAddingInvestment && (
        <Card className="fixed inset-4 z-50 bg-background border shadow-lg overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Add Investment</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsAddingInvestment(false)}>
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Investment Name</Label>
                <Input
                  id="name"
                  value={newInvestment.name || ''}
                  onChange={(e) => setNewInvestment(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Apple Stock, Bitcoin, REIT Fund"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={newInvestment.type} onValueChange={(value) => setNewInvestment(prev => ({ ...prev, type: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stocks">Stocks</SelectItem>
                    <SelectItem value="bonds">Bonds</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                    <SelectItem value="real-estate">Real Estate</SelectItem>
                    <SelectItem value="mutual-funds">Mutual Funds</SelectItem>
                    <SelectItem value="etf">ETF</SelectItem>
                    <SelectItem value="commodities">Commodities</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="amount">Amount Invested</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newInvestment.amount || ''}
                  onChange={(e) => setNewInvestment(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="currentValue">Current Value</Label>
                <Input
                  id="currentValue"
                  type="number"
                  value={newInvestment.currentValue || ''}
                  onChange={(e) => setNewInvestment(prev => ({ ...prev, currentValue: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="risk">Risk Level</Label>
                <Select value={newInvestment.risk} onValueChange={(value) => setNewInvestment(prev => ({ ...prev, risk: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="platform">Platform/Broker</Label>
                <Input
                  id="platform"
                  value={newInvestment.platform || ''}
                  onChange={(e) => setNewInvestment(prev => ({ ...prev, platform: e.target.value }))}
                  placeholder="e.g., Robinhood, TD Ameritrade"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingInvestment(false)}>
                Cancel
              </Button>
              <Button onClick={addInvestment}>
                Add Investment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}