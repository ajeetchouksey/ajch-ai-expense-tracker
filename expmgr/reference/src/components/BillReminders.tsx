import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKV } from '@github/spark/hooks';
import { Transaction, UserSettings } from '@/lib/types';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { CalendarIcon, Plus, Trash, Edit, Check, X, Receipt, Clock, Repeat } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BillReminder {
  id: string;
  name: string;
  description: string;
  amount: number;
  category: string;
  dueDate: Date;
  frequency: 'once' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  isRecurring: boolean;
  isPaid: boolean;
  reminderDays: number[];
  priority: 'low' | 'medium' | 'high';
  paymentMethod: string;
  lastPaid?: Date;
  nextDue: Date;
  tags: string[];
}

interface BillRemindersProps {
  userSettings: UserSettings;
  categories: any[];
  onAddTransaction: (transaction: Transaction) => void;
}

export function BillReminders({ userSettings, categories, onAddTransaction }: BillRemindersProps) {
  const [bills, setBills] = useKV('billReminders', [] as BillReminder[]);
  const [isAddingBill, setIsAddingBill] = useState(false);
  const [editingBill, setEditingBill] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [newBill, setNewBill] = useState<Partial<BillReminder>>({
    name: '',
    description: '',
    amount: 0,
    category: '',
    dueDate: new Date(),
    frequency: 'monthly',
    isRecurring: true,
    isPaid: false,
    reminderDays: [3, 1],
    priority: 'medium',
    paymentMethod: '',
    tags: []
  });

  useEffect(() => {
    checkUpcomingBills();
    updateRecurringBills();
  }, [bills]);

  const checkUpcomingBills = () => {
    const today = new Date();
    const upcomingBills = bills.filter(bill => {
      if (bill.isPaid) return false;
      const daysUntilDue = Math.ceil((bill.nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return bill.reminderDays.includes(daysUntilDue);
    });

    upcomingBills.forEach(bill => {
      const daysUntilDue = Math.ceil((bill.nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 0) {
        toast.error(`⚠️ Bill Overdue: ${bill.name} - ${userSettings.currency} ${bill.amount}`);
      } else if (daysUntilDue === 1) {
        toast.warning(`🔔 Bill Due Tomorrow: ${bill.name} - ${userSettings.currency} ${bill.amount}`);
      } else {
        toast.info(`📅 Upcoming Bill: ${bill.name} due in ${daysUntilDue} days`);
      }
    });
  };

  const updateRecurringBills = () => {
    const today = new Date();
    setBills(prevBills => prevBills.map(bill => {
      if (!bill.isRecurring || bill.nextDue > today) return bill;

      let nextDue = new Date(bill.nextDue);
      while (nextDue <= today) {
        switch (bill.frequency) {
          case 'weekly':
            nextDue = addWeeks(nextDue, 1);
            break;
          case 'monthly':
            nextDue = addMonths(nextDue, 1);
            break;
          case 'quarterly':
            nextDue = addMonths(nextDue, 3);
            break;
          case 'yearly':
            nextDue = addMonths(nextDue, 12);
            break;
        }
      }

      return { ...bill, nextDue, isPaid: false };
    }));
  };

  const generateAIBillSuggestions = async () => {
    const prompt = spark.llmPrompt`Based on common household bills in ${userSettings.country}, suggest 5-7 typical recurring bills with realistic amounts in ${userSettings.currency}. Consider utilities, subscriptions, insurance, etc. Return as JSON array with fields: name, description, estimatedAmount, category, frequency, priority.`;
    
    try {
      const suggestions = await spark.llm(prompt, 'gpt-4o-mini', true);
      const billSuggestions = JSON.parse(suggestions);
      
      // Show suggestions to user
      toast.success(`💡 Generated ${billSuggestions.length} bill suggestions based on your location!`);
      return billSuggestions;
    } catch (error) {
      toast.error('Failed to generate bill suggestions');
      return [];
    }
  };

  const addBill = () => {
    if (!newBill.name || !newBill.amount || !newBill.category) {
      toast.error('Please fill in required fields');
      return;
    }

    const bill: BillReminder = {
      id: Date.now().toString(),
      name: newBill.name!,
      description: newBill.description || '',
      amount: newBill.amount!,
      category: newBill.category!,
      dueDate: newBill.dueDate!,
      frequency: newBill.frequency!,
      isRecurring: newBill.isRecurring!,
      isPaid: false,
      reminderDays: newBill.reminderDays!,
      priority: newBill.priority!,
      paymentMethod: newBill.paymentMethod || '',
      nextDue: newBill.dueDate!,
      tags: newBill.tags || []
    };

    setBills(prev => [...prev, bill]);
    setNewBill({
      name: '',
      description: '',
      amount: 0,
      category: '',
      dueDate: new Date(),
      frequency: 'monthly',
      isRecurring: true,
      isPaid: false,
      reminderDays: [3, 1],
      priority: 'medium',
      paymentMethod: '',
      tags: []
    });
    setIsAddingBill(false);
    toast.success('Bill reminder added successfully!');
  };

  const markAsPaid = (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;

    // Add transaction
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'expense',
      amount: bill.amount,
      description: `Bill Payment: ${bill.name}`,
      category: bill.category,
      date: new Date().toISOString(),
      tags: [...(bill.tags || []), 'bill-payment']
    };

    onAddTransaction(transaction);

    // Update bill
    setBills(prev => prev.map(b => 
      b.id === billId 
        ? { ...b, isPaid: true, lastPaid: new Date() }
        : b
    ));

    toast.success(`✅ Marked ${bill.name} as paid and added transaction`);
  };

  const deleteBill = (billId: string) => {
    setBills(prev => prev.filter(b => b.id !== billId));
    toast.success('Bill reminder deleted');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive border-destructive';
      case 'medium': return 'text-warning border-warning';
      case 'low': return 'text-muted-foreground border-muted';
      default: return 'text-muted-foreground border-muted';
    }
  };

  const getStatusColor = (bill: BillReminder) => {
    const today = new Date();
    const daysUntilDue = Math.ceil((bill.nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (bill.isPaid) return 'bg-success text-success-foreground';
    if (daysUntilDue < 0) return 'bg-destructive text-destructive-foreground';
    if (daysUntilDue <= 1) return 'bg-warning text-warning-foreground';
    if (daysUntilDue <= 3) return 'bg-info text-info-foreground';
    return 'bg-muted text-muted-foreground';
  };

  const upcomingBills = bills.filter(bill => {
    const today = new Date();
    const daysUntilDue = Math.ceil((bill.nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return !bill.isPaid && daysUntilDue >= 0 && daysUntilDue <= 30;
  }).sort((a, b) => a.nextDue.getTime() - b.nextDue.getTime());

  const overdueBills = bills.filter(bill => {
    const today = new Date();
    return !bill.isPaid && bill.nextDue < today;
  });

  const paidBills = bills.filter(bill => bill.isPaid);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Bill Reminders & Management
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={generateAIBillSuggestions} size="sm">
                💡 AI Suggestions
              </Button>
              <Button onClick={() => setIsAddingBill(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Bill
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-destructive">{overdueBills.length}</div>
            <div className="text-sm text-muted-foreground">Overdue Bills</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">{upcomingBills.length}</div>
            <div className="text-sm text-muted-foreground">Upcoming Bills</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">{paidBills.length}</div>
            <div className="text-sm text-muted-foreground">Paid This Month</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {userSettings.currency} {upcomingBills.reduce((sum, bill) => sum + bill.amount, 0).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Upcoming</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcomingBills.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({overdueBills.length})</TabsTrigger>
          <TabsTrigger value="paid">Paid ({paidBills.length})</TabsTrigger>
          <TabsTrigger value="all">All Bills ({bills.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingBills.map(bill => (
            <BillCard key={bill.id} bill={bill} onMarkPaid={markAsPaid} onDelete={deleteBill} userSettings={userSettings} />
          ))}
          {upcomingBills.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No upcoming bills</h3>
                <p className="text-muted-foreground">All your bills are up to date!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          {overdueBills.map(bill => (
            <BillCard key={bill.id} bill={bill} onMarkPaid={markAsPaid} onDelete={deleteBill} userSettings={userSettings} />
          ))}
          {overdueBills.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Check className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No overdue bills</h3>
                <p className="text-muted-foreground">Great job staying on top of your bills!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          {paidBills.map(bill => (
            <BillCard key={bill.id} bill={bill} onMarkPaid={markAsPaid} onDelete={deleteBill} userSettings={userSettings} />
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {bills.map(bill => (
            <BillCard key={bill.id} bill={bill} onMarkPaid={markAsPaid} onDelete={deleteBill} userSettings={userSettings} />
          ))}
        </TabsContent>
      </Tabs>

      {/* Add Bill Modal */}
      {isAddingBill && (
        <Card className="fixed inset-4 z-50 bg-background border shadow-lg overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Add New Bill Reminder</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsAddingBill(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Bill Name *</Label>
                <Input
                  id="name"
                  value={newBill.name || ''}
                  onChange={(e) => setNewBill(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Electricity Bill"
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newBill.amount || ''}
                  onChange={(e) => setNewBill(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newBill.description || ''}
                onChange={(e) => setNewBill(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional details about this bill"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={newBill.category || ''} onValueChange={(value) => setNewBill(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c.type === 'expense').map(category => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newBill.priority || 'medium'} onValueChange={(value) => setNewBill(prev => ({ ...prev, priority: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={newBill.frequency || 'monthly'} onValueChange={(value) => setNewBill(prev => ({ ...prev, frequency: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">One-time</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newBill.dueDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newBill.dueDate ? format(newBill.dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newBill.dueDate}
                      onSelect={(date) => date && setNewBill(prev => ({ ...prev, dueDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingBill(false)}>
                Cancel
              </Button>
              <Button onClick={addBill}>
                Add Bill
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface BillCardProps {
  bill: BillReminder;
  onMarkPaid: (id: string) => void;
  onDelete: (id: string) => void;
  userSettings: UserSettings;
}

function BillCard({ bill, onMarkPaid, onDelete, userSettings }: BillCardProps) {
  const today = new Date();
  const daysUntilDue = Math.ceil((bill.nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  const getStatusText = () => {
    if (bill.isPaid) return 'Paid';
    if (daysUntilDue < 0) return `Overdue by ${Math.abs(daysUntilDue)} days`;
    if (daysUntilDue === 0) return 'Due today';
    if (daysUntilDue === 1) return 'Due tomorrow';
    return `Due in ${daysUntilDue} days`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-destructive';
      case 'medium': return 'border-l-warning';
      case 'low': return 'border-l-muted';
      default: return 'border-l-muted';
    }
  };

  return (
    <Card className={`border-l-4 ${getPriorityColor(bill.priority)}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{bill.name}</h3>
              {bill.isRecurring && <Repeat className="h-4 w-4 text-muted-foreground" />}
              <Badge variant="outline" className={getPriorityColor(bill.priority)}>
                {bill.priority}
              </Badge>
            </div>
            
            <div className="text-2xl font-bold mb-2">
              {userSettings.currency} {bill.amount.toLocaleString()}
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>Category: {bill.category}</div>
              <div>Due: {format(bill.nextDue, 'PPP')}</div>
              {bill.description && <div>{bill.description}</div>}
            </div>

            <div className="mt-3">
              <Badge className={
                bill.isPaid ? 'bg-success text-success-foreground' :
                daysUntilDue < 0 ? 'bg-destructive text-destructive-foreground' :
                daysUntilDue <= 1 ? 'bg-warning text-warning-foreground' :
                'bg-muted text-muted-foreground'
              }>
                {getStatusText()}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {!bill.isPaid && (
              <Button size="sm" onClick={() => onMarkPaid(bill.id)}>
                <Check className="h-4 w-4 mr-1" />
                Mark Paid
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onDelete(bill.id)}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}