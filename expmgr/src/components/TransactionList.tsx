// ...existing code...
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import type { Transaction, Category, UserSettings } from '../lib/types';
import { formatCurrency, formatDate } from '../lib/constants';
import { CreditCard, TrendUp, TrendDown } from '@phosphor-icons/react';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  userSettings: UserSettings;
  limit?: number;
}

export function TransactionList({ transactions, categories, userSettings, limit }: TransactionListProps) {
  const displayTransactions = limit 
    ? transactions.slice(0, limit)
    : transactions;

  const sortedTransactions = displayTransactions.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || categoryId;
  };

  if (sortedTransactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No transactions yet. Add your first transaction to get started!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  transaction.type === 'income' ? 'bg-secondary/10' : 'bg-destructive/10'
                }`}>
                  {transaction.isEMI ? (
                    <CreditCard className="h-4 w-4 text-orange-600" />
                  ) : transaction.type === 'income' ? (
                    <TrendUp className="h-4 w-4 text-secondary" />
                  ) : (
                    <TrendDown className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div>
                  <div className="font-medium">
                    {transaction.description}
                    {transaction.recurringId && <span className="ml-1 text-xs text-muted-foreground">(Auto)</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getCategoryName(transaction.category)}  ￼ {String(formatDate(transaction.date, userSettings.dateFormat))}
                    {transaction.isEMI && transaction.emiDetails && (
                      <span className="ml-2">
                        EMI {transaction.emiDetails.currentInstallment}/{transaction.emiDetails.totalInstallments}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${
                  transaction.type === 'income' ? 'text-secondary' : 'text-destructive'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{String(formatCurrency(transaction.amount, userSettings.currency))}
                </div>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">
                    {transaction.type}
                  </Badge>
                  {transaction.isEMI && (
                    <Badge variant="secondary" className="text-xs">
                      EMI
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
