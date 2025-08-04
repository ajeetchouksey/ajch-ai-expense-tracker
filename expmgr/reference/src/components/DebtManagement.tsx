import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useKV } from '@github/spark/hooks';
import { UserSettings } from '@/lib/types';
import { format, addMonths, differenceInMonths } from 'date-fns';
import { CalendarIcon, Calculator, CreditCard, Banknote, TrendDown, AlertTriangle, Target, Plus, Trash, CheckCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface Debt {
  id: string;
  name: string;
  type: 'credit-card' | 'loan' | 'mortgage' | 'student-loan' | 'personal-loan' | 'other';
  balance: number;
  interestRate: number;
  minimumPayment: number;
  paymentDate: number; // Day of month
  creditor: string;
  priority: 'high' | 'medium' | 'low';
  payoffStrategy: 'avalanche' | 'snowball' | 'custom';
  notes: string;
  createdAt: Date;
}

interface PaymentPlan {
  id: string;
  debtId: string;
  monthlyPayment: number;
  payoffDate: Date;
  totalInterest: number;
  strategy: 'avalanche' | 'snowball' | 'custom';
}

interface DebtManagementProps {
  userSettings: UserSettings;
}

export function DebtManagement({ userSettings }: DebtManagementProps) {
  const [debts, setDebts] = useKV('debts', [] as Debt[]);
  const [paymentPlans, setPaymentPlans] = useKV('paymentPlans', [] as PaymentPlan[]);
  const [isAddingDebt, setIsAddingDebt] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [availableMonthlyAmount, setAvailableMonthlyAmount] = useKV('debtPaymentBudget', 0);
  const [newDebt, setNewDebt] = useState<Partial<Debt>>({
    name: '',
    type: 'credit-card',
    balance: 0,
    interestRate: 0,
    minimumPayment: 0,
    paymentDate: 1,
    creditor: '',
    priority: 'medium',
    payoffStrategy: 'avalanche',
    notes: ''
  });

  useEffect(() => {
    if (debts.length > 0) {
      generatePaymentPlans();
    }
  }, [debts, availableMonthlyAmount]);

  const generatePaymentPlans = async () => {
    const totalMinimumPayments = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
    const extraPayment = Math.max(0, availableMonthlyAmount - totalMinimumPayments);

    const plans: PaymentPlan[] = [];

    // Generate plans for different strategies
    const strategies = ['avalanche', 'snowball'] as const;
    
    for (const strategy of strategies) {
      let sortedDebts = [...debts];
      
      if (strategy === 'avalanche') {
        // Highest interest rate first
        sortedDebts.sort((a, b) => b.interestRate - a.interestRate);
      } else if (strategy === 'snowball') {
        // Smallest balance first
        sortedDebts.sort((a, b) => a.balance - b.balance);
      }

      let remainingExtra = extraPayment;
      
      for (const debt of sortedDebts) {
        const monthlyPayment = debt.minimumPayment + (sortedDebts.indexOf(debt) === 0 ? remainingExtra : 0);
        const { payoffDate, totalInterest } = calculatePayoffTime(debt.balance, debt.interestRate, monthlyPayment);
        
        plans.push({
          id: `${debt.id}-${strategy}`,
          debtId: debt.id,
          monthlyPayment,
          payoffDate,
          totalInterest,
          strategy
        });
      }
    }

    setPaymentPlans(plans);
  };

  const calculatePayoffTime = (balance: number, annualRate: number, monthlyPayment: number) => {
    if (monthlyPayment <= 0) {
      return { payoffDate: new Date(2099, 11, 31), totalInterest: Infinity };
    }

    const monthlyRate = annualRate / 100 / 12;
    let currentBalance = balance;
    let totalInterest = 0;
    let months = 0;

    while (currentBalance > 0.01 && months < 600) { // Cap at 50 years
      const interestPayment = currentBalance * monthlyRate;
      const principalPayment = Math.min(monthlyPayment - interestPayment, currentBalance);
      
      if (principalPayment <= 0) {
        // Payment doesn't cover interest
        return { payoffDate: new Date(2099, 11, 31), totalInterest: Infinity };
      }

      totalInterest += interestPayment;
      currentBalance -= principalPayment;
      months++;
    }

    const payoffDate = addMonths(new Date(), months);
    return { payoffDate, totalInterest };
  };

  const generateAIDebtAdvice = async () => {
    const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0);
    const averageRate = debts.length > 0 ? debts.reduce((sum, debt) => sum + debt.interestRate, 0) / debts.length : 0;
    
    const prompt = spark.llmPrompt`Provide personalized debt management advice for someone in ${userSettings.country} with:

Debt Summary:
- Total Debt: ${userSettings.currency} ${totalDebt}
- Number of Debts: ${debts.length}
- Average Interest Rate: ${averageRate.toFixed(2)}%
- Available Monthly Payment: ${userSettings.currency} ${availableMonthlyAmount}
- Debt Types: ${debts.map(d => d.type).join(', ')}

Provide 5 specific, actionable recommendations considering local financial practices and debt management strategies in ${userSettings.country}.`;

    try {
      return await spark.llm(prompt);
    } catch (error) {
      return 'Unable to generate personalized advice at this time. Consider consulting with a financial advisor.';
    }
  };

  const addDebt = () => {
    if (!newDebt.name || !newDebt.balance || !newDebt.interestRate) {
      return;
    }

    const debt: Debt = {
      id: Date.now().toString(),
      name: newDebt.name!,
      type: newDebt.type!,
      balance: newDebt.balance!,
      interestRate: newDebt.interestRate!,
      minimumPayment: newDebt.minimumPayment!,
      paymentDate: newDebt.paymentDate!,
      creditor: newDebt.creditor || '',
      priority: newDebt.priority!,
      payoffStrategy: newDebt.payoffStrategy!,
      notes: newDebt.notes || '',
      createdAt: new Date()
    };

    setDebts(prev => [...prev, debt]);
    setNewDebt({
      name: '',
      type: 'credit-card',
      balance: 0,
      interestRate: 0,
      minimumPayment: 0,
      paymentDate: 1,
      creditor: '',
      priority: 'medium',
      payoffStrategy: 'avalanche',
      notes: ''
    });
    setIsAddingDebt(false);
  };

  const deleteDebt = (id: string) => {
    setDebts(prev => prev.filter(debt => debt.id !== id));
    setPaymentPlans(prev => prev.filter(plan => plan.debtId !== id));
  };

  const updateDebtBalance = (id: string, newBalance: number) => {
    setDebts(prev => prev.map(debt => 
      debt.id === id ? { ...debt, balance: newBalance } : debt
    ));
  };

  const getDebtTypeIcon = (type: string) => {
    switch (type) {
      case 'credit-card': return <CreditCard className="h-5 w-5" />;
      case 'mortgage': return '🏠';
      case 'student-loan': return '🎓';
      case 'personal-loan': return <Banknote className="h-5 w-5" />;
      case 'loan': return <Calculator className="h-5 w-5" />;
      default: return <CreditCard className="h-5 w-5" />;
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

  const getDebtHealthScore = () => {
    if (debts.length === 0) return 100;
    
    const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0);
    const averageRate = debts.reduce((sum, debt) => sum + debt.interestRate, 0) / debts.length;
    const highInterestDebts = debts.filter(debt => debt.interestRate > 15).length;
    
    let score = 100;
    score -= Math.min(50, (totalDebt / 10000) * 10); // Penalty for high debt
    score -= Math.min(30, averageRate * 2); // Penalty for high interest rates
    score -= highInterestDebts * 10; // Penalty for high-interest debts
    
    return Math.max(0, Math.round(score));
  };

  const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0);
  const totalMinimumPayments = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
  const healthScore = getDebtHealthScore();

  // Calculate strategy comparisons
  const avalanchePlans = paymentPlans.filter(plan => plan.strategy === 'avalanche');
  const snowballPlans = paymentPlans.filter(plan => plan.strategy === 'snowball');
  
  const avalancheTotalInterest = avalanchePlans.reduce((sum, plan) => sum + plan.totalInterest, 0);
  const snowballTotalInterest = snowballPlans.reduce((sum, plan) => sum + plan.totalInterest, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendDown className="h-5 w-5 text-primary" />
              Debt Management & Payoff Planner
            </CardTitle>
            <Button onClick={() => setIsAddingDebt(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Debt
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Debt Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-destructive/10 to-warning/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <div className="text-sm text-muted-foreground">Total Debt</div>
                <div className="text-2xl font-bold text-destructive">
                  {userSettings.currency} {totalDebt.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calculator className="h-8 w-8 text-warning" />
              <div>
                <div className="text-sm text-muted-foreground">Min. Payments</div>
                <div className="text-2xl font-bold">
                  {userSettings.currency} {totalMinimumPayments.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Monthly Budget</div>
                <div className="text-2xl font-bold">
                  {userSettings.currency} {availableMonthlyAmount.toLocaleString()}
                </div>
                <Input
                  type="number"
                  placeholder="Set budget"
                  className="h-6 text-xs mt-1"
                  onBlur={(e) => {
                    const value = parseFloat(e.target.value);
                    if (value >= 0) {
                      setAvailableMonthlyAmount(value);
                    }
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <div className="text-sm text-muted-foreground">Debt Health</div>
                <div className="text-2xl font-bold">{healthScore}/100</div>
                <Progress value={healthScore} className="h-2 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="strategies">Payoff Strategies</TabsTrigger>
          <TabsTrigger value="calculator">Payoff Calculator</TabsTrigger>
          <TabsTrigger value="advice">AI Advice</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {debts.map(debt => (
            <Card key={debt.id} className={`border-l-4 ${getPriorityColor(debt.priority).split(' ')[1]}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 bg-muted/50 rounded-lg flex items-center justify-center">
                      {getDebtTypeIcon(debt.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{debt.name}</h3>
                        <Badge variant="outline" className={getPriorityColor(debt.priority)}>
                          {debt.priority}
                        </Badge>
                        <Badge variant="secondary">{debt.type.replace('-', ' ')}</Badge>
                      </div>
                      
                      <div className="grid gap-2 md:grid-cols-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Balance: </span>
                          <span className="font-medium text-destructive">
                            {userSettings.currency} {debt.balance.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Interest Rate: </span>
                          <span className="font-medium">{debt.interestRate}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Min Payment: </span>
                          <span className="font-medium">
                            {userSettings.currency} {debt.minimumPayment.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {debt.creditor && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Creditor: {debt.creditor}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Input
                      type="number"
                      placeholder="Update balance"
                      className="w-32"
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value);
                        if (value >= 0) {
                          updateDebtBalance(debt.id, value);
                          e.target.value = '';
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteDebt(debt.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {debts.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No debts tracked</h3>
                <p className="text-muted-foreground mb-4">Great job! You're debt-free or haven't added any debts yet.</p>
                <Button onClick={() => setIsAddingDebt(true)}>
                  Add Debt to Track
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="strategies" className="space-y-4">
          {debts.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">🏔️ Avalanche Method</CardTitle>
                  <p className="text-sm text-muted-foreground">Pay highest interest rate debts first</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground">Total Interest Savings</div>
                      <div className="text-xl font-bold text-success">
                        {userSettings.currency} {(snowballTotalInterest - avalancheTotalInterest).toLocaleString()}
                      </div>
                    </div>
                    
                    {avalanchePlans.map(plan => {
                      const debt = debts.find(d => d.id === plan.debtId);
                      if (!debt) return null;
                      return (
                        <div key={plan.id} className="border rounded p-3">
                          <div className="font-medium">{debt.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {userSettings.currency} {plan.monthlyPayment.toLocaleString()}/month
                          </div>
                          <div className="text-sm">
                            Payoff: {format(plan.payoffDate, 'MMM yyyy')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-primary">❄️ Snowball Method</CardTitle>
                  <p className="text-sm text-muted-foreground">Pay smallest balances first</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground">Psychological Wins</div>
                      <div className="text-xl font-bold text-primary">
                        {debts.length} debts eliminated
                      </div>
                    </div>
                    
                    {snowballPlans.map(plan => {
                      const debt = debts.find(d => d.id === plan.debtId);
                      if (!debt) return null;
                      return (
                        <div key={plan.id} className="border rounded p-3">
                          <div className="font-medium">{debt.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {userSettings.currency} {plan.monthlyPayment.toLocaleString()}/month
                          </div>
                          <div className="text-sm">
                            Payoff: {format(plan.payoffDate, 'MMM yyyy')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calculator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Debt Payoff Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Current Balance</Label>
                  <Input type="number" placeholder="Enter debt balance" />
                </div>
                <div>
                  <Label>Interest Rate (%)</Label>
                  <Input type="number" placeholder="Annual interest rate" />
                </div>
                <div>
                  <Label>Monthly Payment</Label>
                  <Input type="number" placeholder="Monthly payment amount" />
                </div>
                <div>
                  <Label>Extra Payment</Label>
                  <Input type="number" placeholder="Additional monthly payment" />
                </div>
              </div>
              <Button className="mt-4">Calculate Payoff Time</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                AI-Powered Debt Management Advice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={async () => {
                  const advice = await generateAIDebtAdvice();
                  // Display advice in UI
                }}
                className="mb-4"
              >
                Get Personalized Advice
              </Button>
              <p className="text-muted-foreground">
                Click to generate personalized debt management recommendations based on your specific situation and location.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Debt Modal */}
      {isAddingDebt && (
        <Card className="fixed inset-4 z-50 bg-background border shadow-lg overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Add New Debt</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsAddingDebt(false)}>
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Debt Name</Label>
                <Input
                  id="name"
                  value={newDebt.name || ''}
                  onChange={(e) => setNewDebt(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Chase Credit Card"
                />
              </div>
              <div>
                <Label htmlFor="type">Debt Type</Label>
                <Select value={newDebt.type} onValueChange={(value) => setNewDebt(prev => ({ ...prev, type: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit-card">Credit Card</SelectItem>
                    <SelectItem value="personal-loan">Personal Loan</SelectItem>
                    <SelectItem value="student-loan">Student Loan</SelectItem>
                    <SelectItem value="mortgage">Mortgage</SelectItem>
                    <SelectItem value="loan">Other Loan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="balance">Current Balance</Label>
                <Input
                  id="balance"
                  type="number"
                  value={newDebt.balance || ''}
                  onChange={(e) => setNewDebt(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  value={newDebt.interestRate || ''}
                  onChange={(e) => setNewDebt(prev => ({ ...prev, interestRate: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="minimumPayment">Minimum Payment</Label>
                <Input
                  id="minimumPayment"
                  type="number"
                  value={newDebt.minimumPayment || ''}
                  onChange={(e) => setNewDebt(prev => ({ ...prev, minimumPayment: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="creditor">Creditor</Label>
                <Input
                  id="creditor"
                  value={newDebt.creditor || ''}
                  onChange={(e) => setNewDebt(prev => ({ ...prev, creditor: e.target.value }))}
                  placeholder="Bank or lender name"
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newDebt.priority} onValueChange={(value) => setNewDebt(prev => ({ ...prev, priority: value as any }))}>
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

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newDebt.notes || ''}
                onChange={(e) => setNewDebt(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this debt"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingDebt(false)}>
                Cancel
              </Button>
              <Button onClick={addDebt}>
                Add Debt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}