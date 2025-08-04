import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Transaction, UserSettings } from '@/lib/types';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns';
import { CalendarIcon, Download, FileText, Printer, Share } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface AdvancedReportingProps {
  transactions: Transaction[];
  userSettings: UserSettings;
}

export function AdvancedReporting({ transactions, userSettings }: AdvancedReportingProps) {
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
  const [reportData, setReportData] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    setGenerating(true);
    
    const filteredTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= dateRange.from && date <= dateRange.to;
    });

    let data = {};

    switch (reportType) {
      case 'summary':
        data = generateSummaryReport(filteredTransactions);
        break;
      case 'detailed':
        data = generateDetailedReport(filteredTransactions);
        break;
      case 'tax':
        data = generateTaxReport(filteredTransactions);
        break;
      case 'cashflow':
        data = generateCashFlowReport(filteredTransactions);
        break;
      case 'comparative':
        data = generateComparativeReport(filteredTransactions);
        break;
    }

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    setReportData(data);
    setGenerating(false);
  };

  const generateSummaryReport = (txns: Transaction[]) => {
    const totalIncome = txns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = txns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netSavings = totalIncome - totalExpense;
    
    const categoryBreakdown = txns.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate: totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0,
      categoryBreakdown,
      transactionCount: txns.length,
      averageTransaction: txns.length > 0 ? totalExpense / txns.filter(t => t.type === 'expense').length : 0
    };
  };

  const generateDetailedReport = (txns: Transaction[]) => {
    return {
      transactions: txns,
      dailyBreakdown: txns.reduce((acc, t) => {
        const date = format(new Date(t.date), 'yyyy-MM-dd');
        if (!acc[date]) acc[date] = { income: 0, expense: 0 };
        acc[date][t.type] += t.amount;
        return acc;
      }, {} as Record<string, { income: number; expense: number }>)
    };
  };

  const generateTaxReport = (txns: Transaction[]) => {
    const taxDeductible = txns.filter(t => 
      t.category.toLowerCase().includes('business') || 
      t.category.toLowerCase().includes('medical') ||
      t.category.toLowerCase().includes('education')
    );
    
    return {
      totalDeductible: taxDeductible.reduce((sum, t) => sum + t.amount, 0),
      deductibleTransactions: taxDeductible,
      estimatedSavings: taxDeductible.reduce((sum, t) => sum + t.amount, 0) * 0.25 // Estimate 25% tax rate
    };
  };

  const generateCashFlowReport = (txns: Transaction[]) => {
    const monthlyFlow = txns.reduce((acc, t) => {
      const month = format(new Date(t.date), 'yyyy-MM');
      if (!acc[month]) acc[month] = { income: 0, expense: 0 };
      acc[month][t.type] += t.amount;
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);

    return { monthlyFlow };
  };

  const generateComparativeReport = (txns: Transaction[]) => {
    const currentPeriod = txns;
    const previousStart = new Date(dateRange.from);
    previousStart.setMonth(previousStart.getMonth() - 1);
    const previousEnd = new Date(dateRange.to);
    previousEnd.setMonth(previousEnd.getMonth() - 1);
    
    const previousTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= previousStart && date <= previousEnd;
    });

    const currentExpense = currentPeriod.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const previousExpense = previousTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    return {
      currentExpense,
      previousExpense,
      change: currentExpense - previousExpense,
      changePercent: previousExpense > 0 ? ((currentExpense - previousExpense) / previousExpense) * 100 : 0
    };
  };

  const exportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    // Simulate export functionality
    const prompt = spark.llmPrompt`Generate a ${format.toUpperCase()} export summary for this financial report data: ${JSON.stringify(reportData)}`;
    await spark.llm(prompt);
    
    // In a real app, this would trigger actual file download
    alert(`Report exported as ${format.toUpperCase()} successfully!`);
  };

  const quickDateRanges = [
    { label: 'This Month', from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
    { label: 'Last Month', from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) },
    { label: 'This Year', from: startOfYear(new Date()), to: endOfYear(new Date()) },
    { label: 'Last Year', from: startOfYear(subYears(new Date(), 1)), to: endOfYear(subYears(new Date(), 1)) }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Advanced Reporting & Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary Report</SelectItem>
                  <SelectItem value="detailed">Detailed Analysis</SelectItem>
                  <SelectItem value="tax">Tax Report</SelectItem>
                  <SelectItem value="cashflow">Cash Flow Analysis</SelectItem>
                  <SelectItem value="comparative">Comparative Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Quick Date Range</label>
              <Select onValueChange={(value) => {
                const range = quickDateRanges.find(r => r.label === value);
                if (range) setDateRange(range);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {quickDateRanges.map(range => (
                    <SelectItem key={range.label} value={range.label}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Custom Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => range && setDateRange(range)}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={generateReport} disabled={generating} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {generating ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Report Results</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportReport('pdf')}>
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportReport('excel')}>
                  <Download className="h-4 w-4 mr-1" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportReport('csv')}>
                  <Download className="h-4 w-4 mr-1" />
                  CSV
                </Button>
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
                <Button variant="outline" size="sm">
                  <Share className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {reportType === 'summary' && reportData && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Income</div>
                  <div className="text-2xl font-bold text-success">
                    {userSettings.currency} {reportData.totalIncome.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Expenses</div>
                  <div className="text-2xl font-bold text-destructive">
                    {userSettings.currency} {reportData.totalExpense.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Net Savings</div>
                  <div className={`text-2xl font-bold ${reportData.netSavings >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {userSettings.currency} {reportData.netSavings.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Savings Rate</div>
                  <div className="text-2xl font-bold text-primary">
                    {reportData.savingsRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            )}

            {reportType === 'comparative' && reportData && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Current Period</div>
                  <div className="text-2xl font-bold">
                    {userSettings.currency} {reportData.currentExpense.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Previous Period</div>
                  <div className="text-2xl font-bold">
                    {userSettings.currency} {reportData.previousExpense.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Change</div>
                  <div className={`text-2xl font-bold ${reportData.change >= 0 ? 'text-destructive' : 'text-success'}`}>
                    {reportData.change >= 0 ? '+' : ''}{reportData.changePercent.toFixed(1)}%
                  </div>
                </div>
              </div>
            )}

            {reportType === 'tax' && reportData && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Deductible</div>
                    <div className="text-2xl font-bold text-primary">
                      {userSettings.currency} {reportData.totalDeductible.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Estimated Tax Savings</div>
                    <div className="text-2xl font-bold text-success">
                      {userSettings.currency} {reportData.estimatedSavings.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Deductible Transactions</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {reportData.deductibleTransactions.map((txn: Transaction) => (
                      <div key={txn.id} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                        <div>
                          <div className="font-medium">{txn.description}</div>
                          <div className="text-sm text-muted-foreground">{txn.category}</div>
                        </div>
                        <Badge variant="secondary">
                          {userSettings.currency} {txn.amount.toLocaleString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}