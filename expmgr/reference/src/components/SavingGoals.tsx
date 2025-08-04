import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { SavingGoal } from '@/lib/types';
import { calculateGoalProgress } from '@/lib/analytics';
import { formatCurrency, formatDate, generateId } from '@/lib/constants';
import { Plus, Target, Calendar, TrendingUp, CheckCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface SavingGoalsProps {
  userSettings: { currency: string };
}

export function SavingGoals({ userSettings }: SavingGoalsProps) {
  const [goals, setGoals] = useKV<SavingGoal[]>('savingGoals', []);
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingFunds, setIsAddingFunds] = useState<string | null>(null);
  const [addFundsAmount, setAddFundsAmount] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    description: '',
    category: 'emergency',
    priority: 'medium' as const,
  });

  const goalProgress = calculateGoalProgress(goals);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.targetAmount || !formData.targetDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newGoal: SavingGoal = {
      id: generateId(),
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: 0,
      targetDate: formData.targetDate,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    setGoals(prev => [...prev, newGoal]);
    setFormData({
      name: '',
      targetAmount: '',
      targetDate: '',
      description: '',
      category: 'emergency',
      priority: 'medium',
    });
    setIsOpen(false);
    toast.success('Saving goal created successfully!');
  };

  const handleAddFunds = (goalId: string) => {
    const amount = parseFloat(addFundsAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        const newAmount = goal.currentAmount + amount;
        const isCompleted = newAmount >= goal.targetAmount;
        
        if (isCompleted && !goal.isCompleted) {
          toast.success(`🎉 Congratulations! You've reached your "${goal.name}" goal!`);
        }
        
        return {
          ...goal,
          currentAmount: newAmount,
          isCompleted,
        };
      }
      return goal;
    }));

    setAddFundsAmount('');
    setIsAddingFunds(null);
    toast.success('Funds added successfully!');
  };

  const deleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId));
    toast.success('Goal deleted successfully');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Saving Goals</h2>
          <p className="text-muted-foreground">Track your progress towards financial milestones</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Saving Goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Goal Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Emergency Fund"
                />
              </div>
              
              <div>
                <Label htmlFor="targetAmount">Target Amount * ({userSettings.currency})</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
                  placeholder="10000"
                />
              </div>
              
              <div>
                <Label htmlFor="targetDate">Target Date *</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergency">Emergency Fund</SelectItem>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="house">House Down Payment</SelectItem>
                    <SelectItem value="car">Car Purchase</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="retirement">Retirement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your goal..."
                />
              </div>
              
              <Button type="submit" className="w-full">
                Create Goal
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {goalProgress.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No saving goals yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first saving goal to start tracking your progress
            </p>
            <Button onClick={() => setIsOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goalProgress.map((goal) => (
            <Card key={goal.id} className={goal.isCompleted ? 'border-green-200 bg-green-50' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {goal.isCompleted && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {goal.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground capitalize">{goal.category}</p>
                  </div>
                  <Badge variant={getPriorityColor(goal.priority)}>
                    {goal.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{goal.progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>{formatCurrency(goal.currentAmount, userSettings.currency)}</span>
                    <span>{formatCurrency(goal.targetAmount, userSettings.currency)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{goal.daysLeft} days left</span>
                  </div>
                  {goal.monthlyRequired > 0 && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{formatCurrency(goal.monthlyRequired, userSettings.currency)}/mo</span>
                    </div>
                  )}
                </div>

                {goal.description && (
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                )}

                {!goal.isCompleted && (
                  <div className="flex gap-2">
                    {isAddingFunds === goal.id ? (
                      <div className="flex gap-2 w-full">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Amount"
                          value={addFundsAmount}
                          onChange={(e) => setAddFundsAmount(e.target.value)}
                          className="flex-1"
                        />
                        <Button size="sm" onClick={() => handleAddFunds(goal.id)}>
                          Add
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setIsAddingFunds(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button size="sm" onClick={() => setIsAddingFunds(goal.id)} className="flex-1">
                          Add Funds
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteGoal(goal.id)}>
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}