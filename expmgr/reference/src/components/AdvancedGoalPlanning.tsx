import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKV } from '@github/spark/hooks';
import { UserSettings } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { TrendUp, Target, Calculator, AlertCircle, CheckCircle, Plus, Lightbulb, Calendar, DollarSign } from '@phosphor-icons/react';

interface FinancialGoal {
  id: string;
  name: string;
  type: 'emergency-fund' | 'retirement' | 'house' | 'vacation' | 'education' | 'debt-payoff' | 'investment' | 'other';
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  priority: 'high' | 'medium' | 'low';
  monthlyContribution: number;
  notes: string;
  milestones: Milestone[];
}

interface Milestone {
  id: string;
  percentage: number;
  description: string;
  achieved: boolean;
  achievedDate?: Date;
}

interface GoalRecommendation {
  goalId: string;
  type: 'increase-contribution' | 'adjust-timeline' | 'rebalance-priorities' | 'emergency-action';
  message: string;
  impact: string;
  actionRequired: boolean;
}

interface AdvancedGoalPlanningProps {
  userSettings: UserSettings;
  transactions: any[];
  savingGoals: any[];
}

export function AdvancedGoalPlanning({ userSettings, transactions, savingGoals }: AdvancedGoalPlanningProps) {
  const [financialGoals, setFinancialGoals] = useKV('financialGoals', [] as FinancialGoal[]);
  const [goalRecommendations, setGoalRecommendations] = useState<GoalRecommendation[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState<Partial<FinancialGoal>>({
    name: '',
    type: 'other',
    targetAmount: 0,
    currentAmount: 0,
    targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    priority: 'medium',
    monthlyContribution: 0,
    notes: '',
    milestones: []
  });

  useEffect(() => {
    generateGoalRecommendations();
  }, [financialGoals, transactions]);

  const generateGoalRecommendations = async () => {
    const monthlyIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0) / 12;

    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0) / 12;

    const availableForGoals = monthlyIncome - monthlyExpenses;

    const prompt = spark.llmPrompt`Analyze these financial goals and provide specific recommendations:

Financial Goals:
${financialGoals.map(goal => `
- ${goal.name} (${goal.type}): ${userSettings.currency}${goal.currentAmount}/${goal.targetAmount}
  Target Date: ${goal.targetDate.toDateString()}
  Monthly Contribution: ${userSettings.currency}${goal.monthlyContribution}
  Priority: ${goal.priority}
`).join('')}

Financial Situation:
- Monthly Income: ${userSettings.currency}${monthlyIncome}
- Monthly Expenses: ${userSettings.currency}${monthlyExpenses}
- Available for Goals: ${userSettings.currency}${availableForGoals}
- Country: ${userSettings.country}

Provide 3-5 specific, actionable recommendations for improving goal achievement. Focus on realistic adjustments and prioritization strategies.`;

    try {
      const aiRecommendations = await spark.llm(prompt);
      const recommendations = parseRecommendations(aiRecommendations);
      setGoalRecommendations(recommendations);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    }
  };

  const parseRecommendations = (aiResponse: string): GoalRecommendation[] => {
    // Simple parsing - in a real app, this would be more sophisticated
    const lines = aiResponse.split('\n').filter(line => line.trim().length > 0);
    return lines.slice(0, 5).map((line, index) => ({
      goalId: financialGoals[index % financialGoals.length]?.id || 'general',
      type: 'increase-contribution',
      message: line.trim(),
      impact: 'Positive',
      actionRequired: true
    }));
  };

  const calculateGoalProgress = (goal: FinancialGoal) => {
    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    const monthsRemaining = Math.max(0, Math.ceil((goal.targetDate.getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)));
    const monthlyNeeded = monthsRemaining > 0 ? (goal.targetAmount - goal.currentAmount) / monthsRemaining : 0;
    const onTrack = goal.monthlyContribution >= monthlyNeeded;

    return {
      progress: Math.min(100, progress),
      monthsRemaining,
      monthlyNeeded,
      onTrack,
      projectedCompletion: goal.monthlyContribution > 0 ? 
        new Date(Date.now() + ((goal.targetAmount - goal.currentAmount) / goal.monthlyContribution) * 30 * 24 * 60 * 60 * 1000) :
        new Date(2099, 11, 31)
    };
  };

  const addGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount) {
      return;
    }

    // Generate default milestones
    const defaultMilestones: Milestone[] = [
      { id: '25', percentage: 25, description: '25% Complete', achieved: false },
      { id: '50', percentage: 50, description: 'Halfway There!', achieved: false },
      { id: '75', percentage: 75, description: '75% Complete', achieved: false },
      { id: '100', percentage: 100, description: 'Goal Achieved!', achieved: false }
    ];

    const goal: FinancialGoal = {
      id: Date.now().toString(),
      name: newGoal.name!,
      type: newGoal.type!,
      targetAmount: newGoal.targetAmount!,
      currentAmount: newGoal.currentAmount || 0,
      targetDate: newGoal.targetDate!,
      priority: newGoal.priority!,
      monthlyContribution: newGoal.monthlyContribution || 0,
      notes: newGoal.notes || '',
      milestones: defaultMilestones
    };

    setFinancialGoals(prev => [...prev, goal]);
    setNewGoal({
      name: '',
      type: 'other',
      targetAmount: 0,
      currentAmount: 0,
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      priority: 'medium',
      monthlyContribution: 0,
      notes: '',
      milestones: []
    });
    setIsAddingGoal(false);
  };

  const updateGoalProgress = (goalId: string, newAmount: number) => {
    setFinancialGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        const updatedGoal = { ...goal, currentAmount: newAmount };
        
        // Update milestones
        const progress = (newAmount / goal.targetAmount) * 100;
        const updatedMilestones = goal.milestones.map(milestone => ({
          ...milestone,
          achieved: progress >= milestone.percentage && !milestone.achieved ? true : milestone.achieved,
          achievedDate: progress >= milestone.percentage && !milestone.achieved ? new Date() : milestone.achievedDate
        }));

        return { ...updatedGoal, milestones: updatedMilestones };
      }
      return goal;
    }));
  };

  const deleteGoal = (goalId: string) => {
    setFinancialGoals(prev => prev.filter(goal => goal.id !== goalId));
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'emergency-fund': return '🚨';
      case 'retirement': return '👴';
      case 'house': return '🏠';
      case 'vacation': return '✈️';
      case 'education': return '🎓';
      case 'debt-payoff': return '💳';
      case 'investment': return '📈';
      default: return '🎯';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive border-destructive';
      case 'medium': return 'text-warning border-warning';
      case 'low': return 'text-muted-foreground border-muted';
      default: return 'text-muted-foreground border-muted';
    }
  };

  const generateGoalTimeline = () => {
    return financialGoals.map(goal => {
      const calc = calculateGoalProgress(goal);
      return {
        name: goal.name,
        current: goal.currentAmount,
        target: goal.targetAmount,
        monthsLeft: calc.monthsRemaining,
        onTrack: calc.onTrack
      };
    }).sort((a, b) => a.monthsLeft - b.monthsLeft);
  };

  const totalGoalValue = financialGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrentValue = financialGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const overallProgress = totalGoalValue > 0 ? (totalCurrentValue / totalGoalValue) * 100 : 0;

  const goalDistribution = financialGoals.reduce((acc, goal) => {
    acc[goal.type] = (acc[goal.type] || 0) + goal.targetAmount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(goalDistribution).map(([type, value]) => ({
    name: type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
    percentage: totalGoalValue > 0 ? (value / totalGoalValue) * 100 : 0
  }));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f', '#ffbb28'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Advanced Goal Planning & Tracking
            </CardTitle>
            <Button onClick={() => setIsAddingGoal(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Goal
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Goal Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Total Goals</div>
                <div className="text-2xl font-bold">{financialGoals.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-success" />
              <div>
                <div className="text-sm text-muted-foreground">Target Value</div>
                <div className="text-2xl font-bold">
                  {userSettings.currency} {totalGoalValue.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendUp className="h-8 w-8 text-info" />
              <div>
                <div className="text-sm text-muted-foreground">Progress</div>
                <div className="text-2xl font-bold">{overallProgress.toFixed(1)}%</div>
                <Progress value={overallProgress} className="h-2 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-warning" />
              <div>
                <div className="text-sm text-muted-foreground">On Track</div>
                <div className="text-2xl font-bold text-success">
                  {financialGoals.filter(goal => calculateGoalProgress(goal).onTrack).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Goals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {financialGoals.map(goal => {
            const calc = calculateGoalProgress(goal);
            return (
              <Card key={goal.id} className={`border-l-4 ${getPriorityColor(goal.priority).split(' ')[1]}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getGoalIcon(goal.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{goal.name}</h3>
                          <Badge variant="outline" className={getPriorityColor(goal.priority)}>
                            {goal.priority}
                          </Badge>
                          {calc.onTrack ? 
                            <Badge className="bg-success">On Track</Badge> : 
                            <Badge variant="destructive">Behind</Badge>
                          }
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span>{calc.progress.toFixed(1)}%</span>
                          </div>
                          <Progress value={calc.progress} className="h-2" />
                          
                          <div className="grid gap-2 md:grid-cols-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Current: </span>
                              <span className="font-medium">
                                {userSettings.currency} {goal.currentAmount.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Target: </span>
                              <span className="font-medium">
                                {userSettings.currency} {goal.targetAmount.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Monthly: </span>
                              <span className="font-medium">
                                {userSettings.currency} {goal.monthlyContribution.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="text-sm">
                            <span className="text-muted-foreground">Target Date: </span>
                            <span className="font-medium">{goal.targetDate.toLocaleDateString()}</span>
                            <span className="text-muted-foreground"> • Months Left: </span>
                            <span className="font-medium">{calc.monthsRemaining}</span>
                          </div>

                          {!calc.onTrack && (
                            <div className="text-sm text-destructive">
                              Need {userSettings.currency} {calc.monthlyNeeded.toLocaleString()}/month to stay on track
                            </div>
                          )}
                        </div>

                        {/* Milestones */}
                        <div className="mt-3">
                          <div className="text-sm font-medium mb-2">Milestones</div>
                          <div className="flex gap-2">
                            {goal.milestones.map(milestone => (
                              <Badge 
                                key={milestone.id} 
                                variant={milestone.achieved ? "default" : "outline"}
                                className={milestone.achieved ? "bg-success" : ""}
                              >
                                {milestone.percentage}%
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Input
                        type="number"
                        placeholder="Update amount"
                        className="w-32"
                        onBlur={(e) => {
                          const value = parseFloat(e.target.value);
                          if (value >= 0) {
                            updateGoalProgress(goal.id, value);
                            e.target.value = '';
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteGoal(goal.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {financialGoals.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No financial goals set</h3>
                <p className="text-muted-foreground mb-4">
                  Start planning your financial future with clear, achievable goals!
                </p>
                <Button onClick={() => setIsAddingGoal(true)}>
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Goal Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${userSettings.currency} ${value.toLocaleString()}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={generateGoalTimeline()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${userSettings.currency} ${value.toLocaleString()}`, 'Amount']} />
                    <Bar dataKey="current" fill="#82ca9d" name="Current" />
                    <Bar dataKey="target" fill="#8884d8" name="Target" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                AI-Powered Goal Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {goalRecommendations.length > 0 ? (
                <div className="space-y-3">
                  {goalRecommendations.map((recommendation, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{recommendation.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Impact: {recommendation.impact}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Add some financial goals to receive personalized recommendations!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Goal Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generateGoalTimeline().map((goal, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{goal.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {goal.monthsLeft} months remaining
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {userSettings.currency} {goal.current.toLocaleString()} / {goal.target.toLocaleString()}
                      </div>
                      <Badge variant={goal.onTrack ? "default" : "destructive"} className="text-xs">
                        {goal.onTrack ? "On Track" : "Behind"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Goal Modal */}
      {isAddingGoal && (
        <Card className="fixed inset-4 z-50 bg-background border shadow-lg overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Add Financial Goal</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsAddingGoal(false)}>
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Goal Name</Label>
                <Input
                  id="name"
                  value={newGoal.name || ''}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Emergency Fund"
                />
              </div>
              <div>
                <Label htmlFor="type">Goal Type</Label>
                <Select value={newGoal.type} onValueChange={(value) => setNewGoal(prev => ({ ...prev, type: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergency-fund">Emergency Fund</SelectItem>
                    <SelectItem value="retirement">Retirement</SelectItem>
                    <SelectItem value="house">House Purchase</SelectItem>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="debt-payoff">Debt Payoff</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="targetAmount">Target Amount</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  value={newGoal.targetAmount || ''}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="currentAmount">Current Amount</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  value={newGoal.currentAmount || ''}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, currentAmount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="targetDate">Target Date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={newGoal.targetDate ? new Date(newGoal.targetDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: new Date(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="monthlyContribution">Monthly Contribution</Label>
                <Input
                  id="monthlyContribution"
                  type="number"
                  value={newGoal.monthlyContribution || ''}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, monthlyContribution: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={newGoal.priority} onValueChange={(value) => setNewGoal(prev => ({ ...prev, priority: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newGoal.notes || ''}
                onChange={(e) => setNewGoal(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional details about this goal"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingGoal(false)}>
                Cancel
              </Button>
              <Button onClick={addGoal}>
                Add Goal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}