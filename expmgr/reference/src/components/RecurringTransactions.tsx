import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RecurringTransaction, Transaction, Category } from '@/lib/types';
import { formatCurrency, formatDate, generateId, calculateNextDue } from '@/lib/constants';
import { Repeat, Plus, Calendar, CreditCard, Pause, Play, Trash2 } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface RecurringTransactionsProps {
  categories: Category[];
  userSettings: { currency: string };
  onAddTransaction: (transaction: Transaction) => void;
}

export function RecurringTransactions({ categories, userSettings, onAddTransaction }: RecurringTransactionsProps) {
  const [recurringTransactions, setRecurringTransactions] = useKV<RecurringTransaction[]>('recurringTransactions', []);
  const [isOpen, setIsOpen] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    type: 'expense' as 'expense' | 'income',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isEMI: false,
    emiDetails: {
      totalInstallments: '',
      loanAmount: '',
      interestRate: '',
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    const nextDue = calculateNextDue(formData.startDate, formData.frequency);

    const newRecurring: RecurringTransaction = {
      id: generateId(),
      amount,
      category: formData.category,
      description: formData.description,
      type: formData.type,
      frequency: formData.frequency as any,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      nextDue,
      isActive: true,
      isEMI: formData.isEMI,
    };

    if (formData.isEMI && formData.emiDetails.totalInstallments && formData.emiDetails.loanAmount) {
      const totalInstallments = parseInt(formData.emiDetails.totalInstallments);
      const loanAmount = parseFloat(formData.emiDetails.loanAmount);
      const interestRate = parseFloat(formData.emiDetails.interestRate) || 0;
      
      // Calculate EMI details
      const totalPayment = amount * totalInstallments;
      const totalInterest = totalPayment - loanAmount;
      const monthlyInterest = totalInterest / totalInstallments;

      newRecurring.emiDetails = {
        totalInstallments,
        currentInstallment: 1,
        principal: amount - monthlyInterest,
        interest: monthlyInterest,
        loanAmount,
      };
    }

    setRecurringTransactions(prev => [...prev, newRecurring]);
    
    // Reset form
    setFormData({
      amount: '',
      category: '',
      description: '',
      type: 'expense',
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      isEMI: false,
      emiDetails: {
        totalInstallments: '',
        loanAmount: '',
        interestRate: '',
      },
    });
    setIsOpen(false);
    toast.success('Recurring transaction created successfully!');
  };

  const toggleActive = (id: string) => {
    setRecurringTransactions(prev => prev.map(rt => 
      rt.id === id ? { ...rt, isActive: !rt.isActive } : rt
    ));
  };

  const deleteRecurring = (id: string) => {
    setRecurringTransactions(prev => prev.filter(rt => rt.id !== id));
    toast.success('Recurring transaction deleted');
  };

  const processRecurring = (rt: RecurringTransaction) => {
    // Create a new transaction
    const newTransaction: Transaction = {
      id: generateId(),
      date: new Date().toISOString().split('T')[0],
      amount: rt.amount,
      category: rt.category,
      description: `${rt.description} (Auto)`,
      type: rt.type,
      createdAt: new Date().toISOString(),
      recurringId: rt.id,
      isEMI: rt.isEMI,
      emiDetails: rt.emiDetails ? {
        totalInstallments: rt.emiDetails.totalInstallments,
        currentInstallment: rt.emiDetails.currentInstallment,
        principal: rt.emiDetails.principal,
        interest: rt.emiDetails.interest,
      } : undefined,
    };

    onAddTransaction(newTransaction);

    // Update the recurring transaction
    setRecurringTransactions(prev => prev.map(recurring => {
      if (recurring.id === rt.id) {
        const nextDue = calculateNextDue(rt.nextDue, rt.frequency);
        const updated = {
          ...recurring,
          nextDue,
          lastProcessed: new Date().toISOString(),
        };

        // Update EMI details if applicable
        if (recurring.emiDetails) {
          updated.emiDetails = {
            ...recurring.emiDetails,
            currentInstallment: recurring.emiDetails.currentInstallment + 1,
          };

          // Check if EMI is complete
          if (updated.emiDetails.currentInstallment > updated.emiDetails.totalInstallments) {
            updated.isActive = false;
            toast.success(`🎉 EMI for "${recurring.description}" completed!`);
          }
        }

        return updated;
      }
      return recurring;
    }));

    toast.success('Transaction processed automatically');
  };

  const getFrequencyBadgeColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'destructive';
      case 'weekly': return 'secondary';
      case 'monthly': return 'default';
      case 'yearly': return 'outline';
      default: return 'default';
    }
  };

  const upcomingTransactions = recurringTransactions
    .filter(rt => rt.isActive)
    .filter(rt => new Date(rt.nextDue) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
    .sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Recurring Transactions</h2>
          <p className="text-muted-foreground">Automate your regular income and expenses</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Recurring
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Recurring Transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Amount ({userSettings.currency}) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="100.00"
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter(cat => cat.type === formData.type)
                      .map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Monthly salary"
                />
              </div>

              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={formData.frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isEMI"
                  checked={formData.isEMI}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isEMI: checked }))}
                />
                <Label htmlFor="isEMI">This is an EMI/Loan Payment</Label>
              </div>

              {formData.isEMI && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium">EMI Details</h4>
                  <div>
                    <Label htmlFor="totalInstallments">Total Installments</Label>
                    <Input
                      id="totalInstallments"
                      type="number"
                      value={formData.emiDetails.totalInstallments}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        emiDetails: { ...prev.emiDetails, totalInstallments: e.target.value }
                      }))}
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="loanAmount">Original Loan Amount</Label>
                    <Input
                      id="loanAmount"
                      type="number"
                      step="0.01"
                      value={formData.emiDetails.loanAmount}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        emiDetails: { ...prev.emiDetails, loanAmount: e.target.value }
                      }))}
                      placeholder="10000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="interestRate">Interest Rate (% per annum)</Label>
                    <Input
                      id="interestRate"
                      type="number"
                      step="0.01"
                      value={formData.emiDetails.interestRate}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        emiDetails: { ...prev.emiDetails, interestRate: e.target.value }
                      }))}
                      placeholder="12.5"
                    />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full">
                Create Recurring Transaction
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Transactions */}
      {upcomingTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingTransactions.map(rt => (
                <div key={rt.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{rt.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {formatDate(rt.nextDue)} • {formatCurrency(rt.amount, userSettings.currency)}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => processRecurring(rt)}>
                    Process Now
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Recurring Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>All Recurring Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recurringTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Repeat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No recurring transactions</h3>
              <p className="text-muted-foreground">Set up automatic tracking for regular income and expenses</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurringTransactions.map(rt => {
                  const category = categories.find(c => c.id === rt.category);
                  return (
                    <TableRow key={rt.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rt.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {category?.name}
                            {rt.isEMI && <span className="ml-2"><CreditCard className="h-3 w-3 inline" /></span>}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={rt.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                          {rt.type === 'income' ? '+' : '-'}{formatCurrency(rt.amount, userSettings.currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getFrequencyBadgeColor(rt.frequency)}>
                          {rt.frequency}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(rt.nextDue)}</TableCell>
                      <TableCell>
                        <Badge variant={rt.isActive ? 'default' : 'secondary'}>
                          {rt.isActive ? 'Active' : 'Paused'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleActive(rt.id)}
                          >
                            {rt.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteRecurring(rt.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}