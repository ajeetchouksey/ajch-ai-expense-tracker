import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Budget, Transaction, Category } from '@/lib/types';
import { calculateBudgetStatus } from '@/lib/analytics';
import { formatCurrency, generateId } from '@/lib/constants';
import { Plus, AlertTriangle, CheckCircle, Target, Trash2 } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface BudgetManagementProps {
  categories: Category[];
  transactions: Transaction[];
  userSettings: { currency: string };
}

export function BudgetManagement({ categories, transactions, userSettings }: BudgetManagementProps) {
  const [budgets, setBudgets] = useKV<Budget[]>('budgets', []);
  const [isOpen, setIsOpen] = useState(false);

  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    period: 'monthly',
    alertThreshold: '80',
  });

  const budgetStatus = calculateBudgetStatus(budgets, transactions);
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if budget already exists for this category
    const existingBudget = budgets.find(b => b.categoryId === formData.categoryId);
    if (existingBudget) {
      toast.error('Budget already exists for this category');
      return;
    }

    const newBudget: Budget = {
      id: generateId(),
      categoryId: formData.categoryId,
      amount: parseFloat(formData.amount),
      period: formData.period as any,
      spent: 0,
      alertThreshold: parseInt(formData.alertThreshold),
      isActive: true,
    };

    setBudgets(prev => [...prev, newBudget]);
    
    setFormData({
      categoryId: '',
      amount: '',
      period: 'monthly',
      alertThreshold: '80',
    });
    setIsOpen(false);
    toast.success('Budget created successfully!');
  };

  const updateBudget = (id: string, updates: Partial<Budget>) => {
    setBudgets(prev => prev.map(budget => 
      budget.id === id ? { ...budget, ...updates } : budget
    ));
    toast.success('Budget updated successfully!');
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(budget => budget.id !== id));
    toast.success('Budget deleted successfully');
  };

  const getProgressColor = (percentage: number, isOverBudget: boolean) => {
    if (isOverBudget) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    if (percentage >= 60) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStatusBadge = (budget: any) => {
    if (budget.isOverBudget) {
      return <Badge variant="destructive">Over Budget</Badge>;
    }
    if (budget.isNearLimit) {
      return <Badge variant="secondary">Near Limit</Badge>;
    }
    return <Badge variant="default">On Track</Badge>;
  };

  const overBudgetCategories = budgetStatus.filter(b => b.isOverBudget);
  const nearLimitCategories = budgetStatus.filter(b => b.isNearLimit && !b.isOverBudget);

  const availableCategories = expenseCategories.filter(
    cat => !budgets.some(budget => budget.categoryId === cat.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Budget Management</h2>
          <p className="text-muted-foreground">Set spending limits and track your progress</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={availableCategories.length === 0}>
              <Plus className="h-4 w-4" />
              Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Budget</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="categoryId">Category *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="amount">Budget Amount * ({userSettings.currency})</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="500.00"
                />
              </div>
              
              <div>
                <Label htmlFor="period">Period</Label>
                <Select value={formData.period} onValueChange={(value) => setFormData(prev => ({ ...prev, period: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
                <Input
                  id="alertThreshold"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.alertThreshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, alertThreshold: e.target.value }))}
                  placeholder="80"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Get notified when spending reaches this percentage
                </p>
              </div>
              
              <Button type="submit" className="w-full">
                Create Budget
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {(overBudgetCategories.length > 0 || nearLimitCategories.length > 0) && (
        <div className="space-y-4">
          {overBudgetCategories.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Over Budget Alert:</strong> You've exceeded your budget in{' '}
                {overBudgetCategories.map(b => {
                  const category = categories.find(c => c.id === b.categoryId);
                  return category?.name;
                }).join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {nearLimitCategories.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Budget Warning:</strong> You're approaching your limit in{' '}
                {nearLimitCategories.map(b => {
                  const category = categories.find(c => c.id === b.categoryId);
                  return category?.name;
                }).join(', ')}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {budgetStatus.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No budgets set yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create budgets for your spending categories to track progress and get alerts
            </p>
            {availableCategories.length > 0 ? (
              <Button onClick={() => setIsOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Budget
              </Button>
            ) : (
              <p className="text-muted-foreground">
                All expense categories already have budgets set
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgetStatus.map((budget) => {
            const category = categories.find(c => c.id === budget.categoryId);
            if (!category) return null;

            return (
              <Card key={budget.id} className={budget.isOverBudget ? 'border-red-200' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">{budget.period}</p>
                    </div>
                    {getStatusBadge(budget)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Spent</span>
                      <span>{budget.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={Math.min(100, budget.percentage)} 
                        className="h-3"
                      />
                      <div 
                        className={`absolute inset-0 rounded-full ${getProgressColor(budget.percentage, budget.isOverBudget)}`}
                        style={{ width: `${Math.min(100, budget.percentage)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>{formatCurrency(budget.spent, userSettings.currency)}</span>
                      <span>{formatCurrency(budget.amount, userSettings.currency)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Remaining:</span>
                    <span className={budget.remaining > 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(Math.abs(budget.remaining), userSettings.currency)}
                      {budget.remaining < 0 && ' over'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Alert at:</span>
                    <span>{budget.alertThreshold}%</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="flex-1">
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Edit Budget: {category.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="editAmount">Budget Amount ({userSettings.currency})</Label>
                            <Input
                              id="editAmount"
                              type="number"
                              step="0.01"
                              defaultValue={budget.amount.toString()}
                              onBlur={(e) => {
                                const newAmount = parseFloat(e.target.value);
                                if (!isNaN(newAmount) && newAmount > 0) {
                                  updateBudget(budget.id, { amount: newAmount });
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label htmlFor="editThreshold">Alert Threshold (%)</Label>
                            <Input
                              id="editThreshold"
                              type="number"
                              min="1"
                              max="100"
                              defaultValue={budget.alertThreshold.toString()}
                              onBlur={(e) => {
                                const newThreshold = parseInt(e.target.value);
                                if (!isNaN(newThreshold) && newThreshold > 0 && newThreshold <= 100) {
                                  updateBudget(budget.id, { alertThreshold: newThreshold });
                                }
                              }}
                            />
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => deleteBudget(budget.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Budget Summary */}
      {budgetStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{budgetStatus.length}</p>
                <p className="text-sm text-muted-foreground">Total Budgets</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {budgetStatus.filter(b => !b.isNearLimit && !b.isOverBudget).length}
                </p>
                <p className="text-sm text-muted-foreground">On Track</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {nearLimitCategories.length}
                </p>
                <p className="text-sm text-muted-foreground">Near Limit</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {overBudgetCategories.length}
                </p>
                <p className="text-sm text-muted-foreground">Over Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}