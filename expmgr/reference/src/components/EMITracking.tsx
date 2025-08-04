import { useKV } from '@github/spark/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RecurringTransaction, Transaction } from '@/lib/types';
import { calculateEMISummary } from '@/lib/analytics';
import { formatCurrency, formatDate } from '@/lib/constants';
import { CreditCard, Calendar, TrendingDown, DollarSign, AlertCircle } from '@phosphor-icons/react';

interface EMITrackingProps {
  userSettings: { currency: string };
}

export function EMITracking({ userSettings }: EMITrackingProps) {
  const [recurringTransactions] = useKV<RecurringTransaction[]>('recurringTransactions', []);
  const [transactions] = useKV<Transaction[]>('transactions', []);

  const emiSummary = calculateEMISummary(recurringTransactions);
  const emiTransactions = recurringTransactions.filter(rt => rt.isEMI && rt.isActive);
  
  // Get recent EMI payments from transactions
  const recentEMIPayments = transactions
    .filter(t => t.isEMI)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const getEMIProgress = (emi: RecurringTransaction) => {
    if (!emi.emiDetails) return 0;
    return (emi.emiDetails.currentInstallment / emi.emiDetails.totalInstallments) * 100;
  };

  const getRemainingAmount = (emi: RecurringTransaction) => {
    if (!emi.emiDetails) return 0;
    const remaining = emi.emiDetails.totalInstallments - emi.emiDetails.currentInstallment;
    return remaining * emi.amount;
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (emiTransactions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">EMI Tracking</h2>
          <p className="text-muted-foreground">Monitor your loan payments and outstanding amounts</p>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No EMIs to track</h3>
            <p className="text-muted-foreground text-center">
              Set up recurring transactions with EMI details to track your loan payments
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">EMI Tracking</h2>
        <p className="text-muted-foreground">Monitor your loan payments and outstanding amounts</p>
      </div>

      {/* EMI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total EMIs</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emiSummary.totalEMIs}</div>
            <p className="text-xs text-muted-foreground">Active loans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(emiSummary.totalMonthlyPayment, userSettings.currency)}
            </div>
            <p className="text-xs text-muted-foreground">Total per month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(emiSummary.totalOutstanding, userSettings.currency)}
            </div>
            <p className="text-xs text-muted-foreground">Remaining amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emiSummary.upcomingPayments.length > 0 
                ? getDaysUntilDue(emiSummary.upcomingPayments[0].dueDate)
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">Days until due</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payments */}
      {emiSummary.upcomingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming EMI Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emiSummary.upcomingPayments.map((payment, index) => {
                const daysUntil = getDaysUntilDue(payment.dueDate);
                const isOverdue = daysUntil < 0;
                const isDueSoon = daysUntil >= 0 && daysUntil <= 3;

                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      isOverdue ? 'border-red-200 bg-red-50' : 
                      isDueSoon ? 'border-yellow-200 bg-yellow-50' : ''
                    }`}
                  >
                    <div>
                      <p className="font-medium">{payment.description}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {formatDate(payment.dueDate)}
                        {isOverdue && (
                          <span className="ml-2 text-red-600 font-medium">
                            {Math.abs(daysUntil)} days overdue
                          </span>
                        )}
                        {isDueSoon && !isOverdue && (
                          <span className="ml-2 text-yellow-600 font-medium">
                            Due in {daysUntil} day{daysUntil !== 1 ? 's' : ''}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {formatCurrency(payment.amount, userSettings.currency)}
                      </p>
                      {(isOverdue || isDueSoon) && (
                        <AlertCircle className={`h-4 w-4 ${isOverdue ? 'text-red-600' : 'text-yellow-600'}`} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* EMI Details */}
      <Card>
        <CardHeader>
          <CardTitle>EMI Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {emiTransactions.map(emi => {
              const progress = getEMIProgress(emi);
              const remaining = getRemainingAmount(emi);
              const daysUntilDue = getDaysUntilDue(emi.nextDue);

              return (
                <div key={emi.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{emi.description}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(emi.amount, userSettings.currency)} • {emi.frequency}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(remaining, userSettings.currency)}
                      </p>
                      <p className="text-sm text-muted-foreground">remaining</p>
                    </div>
                  </div>

                  {emi.emiDetails && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>
                          {emi.emiDetails.currentInstallment} of {emi.emiDetails.totalInstallments} payments
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>{progress.toFixed(1)}% complete</span>
                        <span>
                          {emi.emiDetails.totalInstallments - emi.emiDetails.currentInstallment} payments left
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Next Due</p>
                      <p className="font-medium">{formatDate(emi.nextDue)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Days Until Due</p>
                      <p className={`font-medium ${daysUntilDue < 0 ? 'text-red-600' : daysUntilDue <= 3 ? 'text-yellow-600' : ''}`}>
                        {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days`}
                      </p>
                    </div>
                    {emi.emiDetails && (
                      <>
                        <div>
                          <p className="text-muted-foreground">Original Loan</p>
                          <p className="font-medium">
                            {formatCurrency(emi.emiDetails.loanAmount, userSettings.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Principal/Interest</p>
                          <p className="font-medium">
                            {formatCurrency(emi.emiDetails.principal, userSettings.currency)} / {' '}
                            {formatCurrency(emi.emiDetails.interest, userSettings.currency)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent EMI Payments */}
      {recentEMIPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent EMI Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Installment</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Interest</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEMIPayments.map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.date)}</TableCell>
                    <TableCell>{payment.description}</TableCell>
                    <TableCell>
                      {formatCurrency(payment.amount, userSettings.currency)}
                    </TableCell>
                    <TableCell>
                      {payment.emiDetails 
                        ? `${payment.emiDetails.currentInstallment}/${payment.emiDetails.totalInstallments}`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {payment.emiDetails
                        ? formatCurrency(payment.emiDetails.principal, userSettings.currency)
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {payment.emiDetails
                        ? formatCurrency(payment.emiDetails.interest, userSettings.currency)
                        : '-'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}