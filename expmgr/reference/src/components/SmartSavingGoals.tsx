import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format, differenceInDays, differenceInMonths, addDays, addMonths } from 'date-fns';
import { 
  Plus, 
  TrendUp, 
  Target, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign,
  Calendar,
  Lightbulb,
  Download,
  Upload,
  X,
  Edit
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { UserSettings, Transaction } from '@/lib/types';

interface SmartGoal {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  priority: 'high' | 'medium' | 'low';
  category: 'emergency' | 'vacation' | 'purchase' | 'debt' | 'investment' | 'other';
  autoSaveEnabled: boolean;
  autoSaveAmount: number;
  autoSaveFrequency: 'daily' | 'weekly' | 'monthly';
  milestones: Milestone[];
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  completedAt?: Date;
  linkedBudgetCategory?: string;
  motivationalQuotes: string[];
  currentQuoteIndex: number;
}

interface Milestone {
  id: string;
  name: string;
  amount: number;
  achieved: boolean;
  achievedAt?: Date;
  reward?: string;
}

interface SmartSavingGoalsProps {
  userSettings: UserSettings;
  transactions?: Transaction[];
  onAddTransaction?: (transaction: any) => void;
}

const DEFAULT_MOTIVATIONAL_QUOTES = [
  "Every small step counts towards your big goal!",
  "Consistency beats perfection every time.",
  "Your future self will thank you for saving today.",
  "Dreams don't have expiration dates.",
  "Save today for a better tomorrow.",
  "Financial freedom is worth the sacrifice.",
  "You're closer than you think!",
  "Small amounts grow into big results.",
  "Stay focused on your why.",
  "Progress, not perfection!"
];

const GOAL_CATEGORIES = [
  { value: 'emergency', label: 'Emergency Fund', icon: '🛡️', color: 'bg-red-100 text-red-800' },
  { value: 'vacation', label: 'Vacation', icon: '🏖️', color: 'bg-blue-100 text-blue-800' },
  { value: 'purchase', label: 'Purchase', icon: '🛍️', color: 'bg-green-100 text-green-800' },
  { value: 'debt', label: 'Debt Payoff', icon: '💳', color: 'bg-orange-100 text-orange-800' },
  { value: 'investment', label: 'Investment', icon: '📈', color: 'bg-purple-100 text-purple-800' },
  { value: 'other', label: 'Other', icon: '🎯', color: 'bg-gray-100 text-gray-800' }
];

export function SmartSavingGoals({ userSettings, transactions = [], onAddTransaction }: SmartSavingGoalsProps) {
  const [smartGoals, setSmartGoals] = useKV('smartSavingGoals', [] as SmartGoal[]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SmartGoal | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    deadline: '',
    priority: 'medium' as const,
    category: 'other' as const,
    autoSaveEnabled: false,
    autoSaveAmount: '',
    autoSaveFrequency: 'monthly' as const,
    linkedBudgetCategory: '',
    tags: [] as string[]
  });

  const generateAISuggestions = async (goal: SmartGoal) => {
    const prompt = spark.llmPrompt`
    Analyze this saving goal and provide 3 specific, actionable suggestions to help achieve it faster:
    
    Goal: ${goal.name}
    Target: ${userSettings.currency}${goal.targetAmount}
    Current: ${userSettings.currency}${goal.currentAmount}
    Deadline: ${format(goal.deadline, 'MMM dd, yyyy')}
    Category: ${goal.category}
    
    Consider the user's country (${userSettings.country}) and currency (${userSettings.currency}) for culturally relevant suggestions.
    Provide practical, specific advice that the user can implement immediately.
    `;

    try {
      const suggestions = await spark.llm(prompt);
      return suggestions;
    } catch (error) {
      return "Unable to generate suggestions at this time. Try reviewing your goal timeline and consider increasing your monthly savings amount.";
    }
  };

  const calculateSavingsRecommendation = (goal: SmartGoal): string => {
    const daysLeft = differenceInDays(goal.deadline, new Date());
    const amountNeeded = goal.targetAmount - goal.currentAmount;
    
    if (daysLeft <= 0) return "Goal deadline has passed";
    if (amountNeeded <= 0) return "Goal already achieved!";

    const dailyAmount = amountNeeded / daysLeft;
    const weeklyAmount = dailyAmount * 7;
    const monthlyAmount = amountNeeded / Math.max(1, differenceInMonths(goal.deadline, new Date()));

    return `To reach your goal, save ${userSettings.currency}${dailyAmount.toFixed(2)}/day, ${userSettings.currency}${weeklyAmount.toFixed(2)}/week, or ${userSettings.currency}${monthlyAmount.toFixed(2)}/month`;
  };

  const createMilestones = (targetAmount: number): Milestone[] => {
    const milestones: Milestone[] = [];
    const milestoneAmounts = [0.25, 0.5, 0.75, 1.0];
    
    milestoneAmounts.forEach((percentage, index) => {
      milestones.push({
        id: Date.now().toString() + index,
        name: `${(percentage * 100)}% Complete`,
        amount: targetAmount * percentage,
        achieved: false,
        reward: percentage === 1 ? 'Goal Achieved! 🎉' : `${(percentage * 100)}% milestone reached! 🌟`
      });
    });

    return milestones;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.targetAmount || !formData.deadline) {
      toast.error('Please fill in all required fields');
      return;
    }

    const targetAmount = parseFloat(formData.targetAmount);
    const deadline = new Date(formData.deadline);

    if (deadline <= new Date()) {
      toast.error('Deadline must be in the future');
      return;
    }

    const goalData: SmartGoal = {
      id: editingGoal?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      targetAmount,
      currentAmount: editingGoal?.currentAmount || 0,
      deadline,
      priority: formData.priority,
      category: formData.category,
      autoSaveEnabled: formData.autoSaveEnabled,
      autoSaveAmount: parseFloat(formData.autoSaveAmount) || 0,
      autoSaveFrequency: formData.autoSaveFrequency,
      milestones: editingGoal?.milestones || createMilestones(targetAmount),
      tags: formData.tags,
      isActive: true,
      createdAt: editingGoal?.createdAt || new Date(),
      linkedBudgetCategory: formData.linkedBudgetCategory,
      motivationalQuotes: DEFAULT_MOTIVATIONAL_QUOTES,
      currentQuoteIndex: 0
    };

    if (editingGoal) {
      setSmartGoals(prev => prev.map(g => g.id === editingGoal.id ? goalData : g));
      toast.success('Smart goal updated successfully');
    } else {
      setSmartGoals(prev => [...prev, goalData]);
      toast.success('Smart saving goal created successfully');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      targetAmount: '',
      deadline: '',
      priority: 'medium',
      category: 'other',
      autoSaveEnabled: false,
      autoSaveAmount: '',
      autoSaveFrequency: 'monthly',
      linkedBudgetCategory: '',
      tags: []
    });
    setEditingGoal(null);
    setIsAddDialogOpen(false);
  };

  const addToGoal = (goalId: string, amount: number) => {
    setSmartGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        const newAmount = goal.currentAmount + amount;
        const updatedMilestones = goal.milestones.map(milestone => {
          if (!milestone.achieved && newAmount >= milestone.amount) {
            toast.success(`🎉 Milestone achieved: ${milestone.name}!`);
            return { ...milestone, achieved: true, achievedAt: new Date() };
          }
          return milestone;
        });

        const updatedGoal = {
          ...goal,
          currentAmount: newAmount,
          milestones: updatedMilestones
        };

        if (newAmount >= goal.targetAmount && !goal.completedAt) {
          updatedGoal.completedAt = new Date();
          updatedGoal.isActive = false;
          toast.success(`🎉 Congratulations! Goal "${goal.name}" completed!`);
        }

        // Add transaction if callback is provided
        if (onAddTransaction) {
          onAddTransaction({
            id: Date.now().toString(),
            description: `Savings: ${goal.name}`,
            amount: amount,
            category: 'Savings',
            type: 'transfer',
            date: new Date(),
            tags: ['savings', 'goal-contribution', ...goal.tags]
          });
        }

        return updatedGoal;
      }
      return goal;
    }));
  };

  const deleteGoal = (goalId: string) => {
    setSmartGoals(prev => prev.filter(g => g.id !== goalId));
    toast.success('Goal deleted successfully');
  };

  const toggleGoalStatus = (goalId: string) => {
    setSmartGoals(prev => prev.map(goal => 
      goal.id === goalId ? { ...goal, isActive: !goal.isActive } : goal
    ));
  };

  const getFilteredGoals = () => {
    switch (activeTab) {
      case 'active':
        return smartGoals.filter(g => g.isActive && !g.completedAt);
      case 'completed':
        return smartGoals.filter(g => g.completedAt);
      case 'paused':
        return smartGoals.filter(g => !g.isActive && !g.completedAt);
      default:
        return smartGoals;
    }
  };

  const getProgressPercentage = (goal: SmartGoal): number => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const getDaysLeft = (deadline: Date): number => {
    return Math.max(0, differenceInDays(deadline, new Date()));
  };

  const getCategoryInfo = (category: string) => {
    return GOAL_CATEGORIES.find(c => c.value === category) || GOAL_CATEGORIES[5];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const filteredGoals = getFilteredGoals();
  const activeGoals = smartGoals.filter(g => g.isActive && !g.completedAt);
  const completedGoals = smartGoals.filter(g => g.completedAt);
  const totalSaved = smartGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Smart Saving Goals</h2>
          <p className="text-muted-foreground">AI-powered goal tracking with intelligent insights</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Smart Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit' : 'Create'} Smart Saving Goal</DialogTitle>
              <DialogDescription>
                Set up intelligent saving goals with automated tracking and AI recommendations.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Goal Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Emergency Fund"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What are you saving for?"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetAmount">Target Amount ({userSettings.currency}) *</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    step="0.01"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
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
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoSave"
                    checked={formData.autoSaveEnabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoSaveEnabled: checked }))}
                  />
                  <Label htmlFor="autoSave">Enable Auto-Save</Label>
                </div>

                {formData.autoSaveEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="autoSaveAmount">Auto-Save Amount ({userSettings.currency})</Label>
                      <Input
                        id="autoSaveAmount"
                        type="number"
                        step="0.01"
                        value={formData.autoSaveAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, autoSaveAmount: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="autoSaveFrequency">Frequency</Label>
                      <Select value={formData.autoSaveFrequency} onValueChange={(value: any) => setFormData(prev => ({ ...prev, autoSaveFrequency: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingGoal ? 'Update' : 'Create'} Goal
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Target className="h-8 w-8 text-primary mr-3" />
            <div>
              <p className="text-2xl font-bold">{activeGoals.length}</p>
              <p className="text-xs text-muted-foreground">Active Goals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-success mr-3" />
            <div>
              <p className="text-2xl font-bold">{completedGoals.length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <DollarSign className="h-8 w-8 text-accent mr-3" />
            <div>
              <p className="text-2xl font-bold">{userSettings.currency}{totalSaved.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Total Saved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <TrendUp className="h-8 w-8 text-secondary mr-3" />
            <div>
              <p className="text-2xl font-bold">
                {activeGoals.length > 0 
                  ? `${(activeGoals.reduce((sum, g) => sum + getProgressPercentage(g), 0) / activeGoals.length).toFixed(0)}%`
                  : '0%'
                }
              </p>
              <p className="text-xs text-muted-foreground">Avg Progress</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active ({activeGoals.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedGoals.length})</TabsTrigger>
          <TabsTrigger value="paused">Paused ({smartGoals.filter(g => !g.isActive && !g.completedAt).length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredGoals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No goals found</h3>
                <p className="text-muted-foreground text-center">
                  {activeTab === 'active' 
                    ? 'Create your first smart saving goal to get started'
                    : `No ${activeTab} goals at the moment`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredGoals.map(goal => {
              const categoryInfo = getCategoryInfo(goal.category);
              const progressPercentage = getProgressPercentage(goal);
              const daysLeft = getDaysLeft(goal.deadline);
              const savingsRecommendation = calculateSavingsRecommendation(goal);

              return (
                <Card key={goal.id} className={`${getPriorityColor(goal.priority)} border-l-4`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{categoryInfo.icon}</span>
                          <div>
                            <CardTitle className="text-xl">{goal.name}</CardTitle>
                            <CardDescription>{goal.description}</CardDescription>
                          </div>
                          <Badge className={categoryInfo.color}>
                            {categoryInfo.label}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                          <div>
                            <p className="text-muted-foreground">Progress</p>
                            <p className="font-medium">{userSettings.currency}{goal.currentAmount} / {userSettings.currency}{goal.targetAmount}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Deadline</p>
                            <p className="font-medium">{format(goal.deadline, 'MMM dd, yyyy')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Days Left</p>
                            <p className="font-medium flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {daysLeft}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Priority</p>
                            <p className="font-medium capitalize">{goal.priority}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <DollarSign className="h-4 w-4 mr-1" />
                              Add Money
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add to {goal.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Amount ({userSettings.currency})</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const amount = parseFloat((e.target as HTMLInputElement).value);
                                      if (amount > 0) {
                                        addToGoal(goal.id, amount);
                                        (e.target as HTMLInputElement).value = '';
                                        toast.success(`Added ${userSettings.currency}${amount} to ${goal.name}`);
                                      }
                                    }
                                  }}
                                />
                              </div>
                              <Button 
                                onClick={(e) => {
                                  const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                                  const amount = parseFloat(input.value);
                                  if (amount > 0) {
                                    addToGoal(goal.id, amount);
                                    input.value = '';
                                    toast.success(`Added ${userSettings.currency}${amount} to ${goal.name}`);
                                  }
                                }}
                                className="w-full"
                              >
                                Add to Goal
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingGoal(goal);
                            setFormData({
                              name: goal.name,
                              description: goal.description,
                              targetAmount: goal.targetAmount.toString(),
                              deadline: format(goal.deadline, 'yyyy-MM-dd'),
                              priority: goal.priority,
                              category: goal.category,
                              autoSaveEnabled: goal.autoSaveEnabled,
                              autoSaveAmount: goal.autoSaveAmount.toString(),
                              autoSaveFrequency: goal.autoSaveFrequency,
                              linkedBudgetCategory: goal.linkedBudgetCategory || '',
                              tags: goal.tags
                            });
                            setIsAddDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-destructive">
                              <X className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{goal.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteGoal(goal.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress: {progressPercentage.toFixed(1)}%</span>
                        <span>{userSettings.currency}{(goal.targetAmount - goal.currentAmount).toFixed(2)} remaining</span>
                      </div>
                      <Progress value={progressPercentage} className="h-3" />
                    </div>

                    {/* Milestones */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Milestones</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {goal.milestones.map(milestone => (
                          <div 
                            key={milestone.id}
                            className={`p-2 rounded-lg text-xs ${
                              milestone.achieved 
                                ? 'bg-success text-success-foreground' 
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              {milestone.achieved ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <Target className="h-3 w-3" />
                              )}
                              <span>{milestone.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Recommendations */}
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-accent" />
                        <span className="font-medium text-sm">Smart Recommendation</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{savingsRecommendation}</p>
                      
                      {goal.autoSaveEnabled && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Auto-save: {userSettings.currency}{goal.autoSaveAmount} {goal.autoSaveFrequency}
                        </div>
                      )}
                    </div>

                    {/* Motivational Quote */}
                    <div className="bg-primary/5 p-3 rounded-lg border-l-4 border-primary">
                      <p className="text-sm italic text-primary">
                        "{goal.motivationalQuotes[goal.currentQuoteIndex % goal.motivationalQuotes.length]}"
                      </p>
                    </div>

                    {goal.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {goal.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}