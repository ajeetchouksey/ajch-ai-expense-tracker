import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKV } from '@github/spark/hooks';
import { UserSettings } from '@/lib/types';
import { Calendar, FileText, Calculator, Receipt, TrendUp, AlertTriangle, CheckCircle, Plus, Download } from '@phosphor-icons/react';

interface TaxCategory {
  id: string;
  name: string;
  description: string;
  deductionType: 'standard' | 'itemized';
  maxAmount?: number;
  percentage?: number;
  requiredDocuments: string[];
}

interface TaxRecord {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  date: Date;
  documentPath?: string;
  verified: boolean;
  transactionId?: string;
}

interface TaxEstimate {
  year: number;
  totalIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  estimatedTax: number;
  refundOwed: number;
  effectiveTaxRate: number;
  marginalTaxRate: number;
}

interface TaxPlanningProps {
  userSettings: UserSettings;
  transactions: any[];
}

export function TaxPlanning({ userSettings, transactions }: TaxPlanningProps) {
  const [taxRecords, setTaxRecords] = useKV('taxRecords', [] as TaxRecord[]);
  const [taxCategories] = useKV('taxCategories', getDefaultTaxCategories(userSettings.country));
  const [currentYear] = useState(new Date().getFullYear());
  const [selectedTab, setSelectedTab] = useState('overview');
  const [taxEstimate, setTaxEstimate] = useState<TaxEstimate | null>(null);
  const [autoTaxTracking, setAutoTaxTracking] = useKV('autoTaxTracking', true);
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<TaxRecord>>({
    categoryId: '',
    amount: 0,
    description: '',
    date: new Date(),
    verified: false
  });

  useEffect(() => {
    if (autoTaxTracking) {
      autoDetectTaxDeductibleTransactions();
    }
    calculateTaxEstimate();
  }, [transactions, taxRecords, autoTaxTracking]);

  function getDefaultTaxCategories(country: string): TaxCategory[] {
    const baseCategories = [
      {
        id: 'medical',
        name: 'Medical Expenses',
        description: 'Qualified medical and dental expenses',
        deductionType: 'itemized' as const,
        percentage: 7.5,
        requiredDocuments: ['Medical bills', 'Insurance statements', 'Receipts']
      },
      {
        id: 'charitable',
        name: 'Charitable Donations',
        description: 'Donations to qualified organizations',
        deductionType: 'itemized' as const,
        requiredDocuments: ['Donation receipts', 'Acknowledgment letters']
      },
      {
        id: 'education',
        name: 'Education Expenses',
        description: 'Qualified education expenses',
        deductionType: 'standard' as const,
        requiredDocuments: ['Tuition statements', 'Form 1098-T']
      },
      {
        id: 'business',
        name: 'Business Expenses',
        description: 'Ordinary and necessary business expenses',
        deductionType: 'standard' as const,
        requiredDocuments: ['Business receipts', 'Travel records', 'Equipment purchases']
      },
      {
        id: 'home-office',
        name: 'Home Office',
        description: 'Home office deduction',
        deductionType: 'standard' as const,
        requiredDocuments: ['Utility bills', 'Mortgage/rent statements', 'Square footage records']
      }
    ];

    // Add country-specific categories
    if (country === 'US') {
      baseCategories.push(
        {
          id: 'state-local-tax',
          name: 'State and Local Taxes',
          description: 'SALT deduction',
          deductionType: 'itemized' as const,
          maxAmount: 10000,
          requiredDocuments: ['Property tax bills', 'State tax returns']
        },
        {
          id: 'mortgage-interest',
          name: 'Mortgage Interest',
          description: 'Home mortgage interest deduction',
          deductionType: 'itemized' as const,
          requiredDocuments: ['Form 1098', 'Mortgage statements']
        }
      );
    }

    return baseCategories;
  }

  const autoDetectTaxDeductibleTransactions = () => {
    const potentialDeductions = transactions.filter(transaction => {
      const desc = transaction.description.toLowerCase();
      const category = transaction.category.toLowerCase();
      
      return (
        desc.includes('medical') || desc.includes('doctor') || desc.includes('pharmacy') ||
        desc.includes('donation') || desc.includes('charity') ||
        desc.includes('education') || desc.includes('tuition') ||
        desc.includes('business') || category.includes('business') ||
        desc.includes('office') || category.includes('office')
      );
    });

    // Auto-add new tax records for detected transactions
    potentialDeductions.forEach(transaction => {
      const existingRecord = taxRecords.find(record => record.transactionId === transaction.id);
      if (!existingRecord) {
        const categoryId = detectTaxCategory(transaction);
        if (categoryId) {
          const newTaxRecord: TaxRecord = {
            id: `auto-${transaction.id}`,
            categoryId,
            amount: transaction.amount,
            description: transaction.description,
            date: new Date(transaction.date),
            verified: false,
            transactionId: transaction.id
          };
          setTaxRecords(prev => [...prev, newTaxRecord]);
        }
      }
    });
  };

  const detectTaxCategory = (transaction: any): string | null => {
    const desc = transaction.description.toLowerCase();
    const category = transaction.category.toLowerCase();

    if (desc.includes('medical') || desc.includes('doctor') || desc.includes('pharmacy')) {
      return 'medical';
    }
    if (desc.includes('donation') || desc.includes('charity')) {
      return 'charitable';
    }
    if (desc.includes('education') || desc.includes('tuition')) {
      return 'education';
    }
    if (desc.includes('business') || category.includes('business')) {
      return 'business';
    }
    if (desc.includes('office') || category.includes('office')) {
      return 'home-office';
    }

    return null;
  };

  const calculateTaxEstimate = async () => {
    const currentYearRecords = taxRecords.filter(record => 
      new Date(record.date).getFullYear() === currentYear
    );

    const totalIncome = transactions
      .filter(t => t.type === 'income' && new Date(t.date).getFullYear() === currentYear)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDeductions = currentYearRecords.reduce((sum, record) => sum + record.amount, 0);

    // Generate AI tax estimation
    const prompt = spark.llmPrompt`Calculate tax estimate for ${userSettings.country} with:
    - Total Income: ${userSettings.currency} ${totalIncome}
    - Total Deductions: ${userSettings.currency} ${totalDeductions}
    - Year: ${currentYear}
    
    Provide realistic tax calculation including:
    - Taxable income
    - Estimated tax owed
    - Effective tax rate
    - Marginal tax rate
    
    Return as JSON with fields: taxableIncome, estimatedTax, effectiveTaxRate, marginalTaxRate`;

    try {
      const aiEstimate = await spark.llm(prompt, 'gpt-4o-mini', true);
      const estimate = JSON.parse(aiEstimate);
      
      setTaxEstimate({
        year: currentYear,
        totalIncome,
        totalDeductions,
        taxableIncome: estimate.taxableIncome,
        estimatedTax: estimate.estimatedTax,
        refundOwed: estimate.estimatedTax < 0 ? Math.abs(estimate.estimatedTax) : 0,
        effectiveTaxRate: estimate.effectiveTaxRate,
        marginalTaxRate: estimate.marginalTaxRate
      });
    } catch (error) {
      // Fallback calculation
      const standardDeduction = userSettings.country === 'US' ? 13850 : totalIncome * 0.1;
      const taxableIncome = Math.max(0, totalIncome - Math.max(totalDeductions, standardDeduction));
      const estimatedTax = taxableIncome * 0.22; // Simplified rate
      
      setTaxEstimate({
        year: currentYear,
        totalIncome,
        totalDeductions,
        taxableIncome,
        estimatedTax,
        refundOwed: 0,
        effectiveTaxRate: totalIncome > 0 ? (estimatedTax / totalIncome) * 100 : 0,
        marginalTaxRate: 22
      });
    }
  };

  const addTaxRecord = () => {
    if (!newRecord.categoryId || !newRecord.amount || !newRecord.description) {
      return;
    }

    const record: TaxRecord = {
      id: Date.now().toString(),
      categoryId: newRecord.categoryId!,
      amount: newRecord.amount!,
      description: newRecord.description!,
      date: newRecord.date!,
      verified: newRecord.verified!
    };

    setTaxRecords(prev => [...prev, record]);
    setNewRecord({
      categoryId: '',
      amount: 0,
      description: '',
      date: new Date(),
      verified: false
    });
    setIsAddingRecord(false);
  };

  const verifyRecord = (recordId: string) => {
    setTaxRecords(prev => prev.map(record => 
      record.id === recordId ? { ...record, verified: true } : record
    ));
  };

  const deleteRecord = (recordId: string) => {
    setTaxRecords(prev => prev.filter(record => record.id !== recordId));
  };

  const generateTaxReport = async () => {
    const prompt = spark.llmPrompt`Generate a comprehensive tax preparation report for ${currentYear} with:

Tax Records:
${taxRecords.map(record => {
  const category = taxCategories.find(c => c.id === record.categoryId);
  return `- ${category?.name}: ${userSettings.currency} ${record.amount} (${record.description})`;
}).join('\n')}

Tax Estimate:
${taxEstimate ? `
- Total Income: ${userSettings.currency} ${taxEstimate.totalIncome}
- Total Deductions: ${userSettings.currency} ${taxEstimate.totalDeductions}
- Taxable Income: ${userSettings.currency} ${taxEstimate.taxableIncome}
- Estimated Tax: ${userSettings.currency} ${taxEstimate.estimatedTax}
- Effective Rate: ${taxEstimate.effectiveTaxRate}%
` : 'No estimate available'}

Country: ${userSettings.country}

Generate a detailed tax preparation report with recommendations and action items.`;

    try {
      const report = await spark.llm(prompt);
      // In a real app, this would generate a downloadable PDF
      console.log('Tax Report Generated:', report);
      alert('Tax report generated successfully! Check console for details.');
    } catch (error) {
      alert('Failed to generate tax report');
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'medical': return '🏥';
      case 'charitable': return '💝';
      case 'education': return '📚';
      case 'business': return '💼';
      case 'home-office': return '🏠';
      case 'state-local-tax': return '🏛️';
      case 'mortgage-interest': return '🏡';
      default: return '📄';
    }
  };

  const verifiedRecords = taxRecords.filter(r => r.verified);
  const unverifiedRecords = taxRecords.filter(r => !r.verified);
  const totalDeductions = taxRecords.reduce((sum, record) => sum + record.amount, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Tax Planning & Preparation
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={generateTaxReport} size="sm">
                <Download className="h-4 w-4 mr-1" />
                Generate Report
              </Button>
              <Button onClick={() => setIsAddingRecord(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Record
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tax Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calculator className="h-8 w-8 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Total Deductions</div>
                <div className="text-2xl font-bold">
                  {userSettings.currency} {totalDeductions.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <div className="text-sm text-muted-foreground">Verified Records</div>
                <div className="text-2xl font-bold text-success">{verifiedRecords.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-warning" />
              <div>
                <div className="text-sm text-muted-foreground">Needs Review</div>
                <div className="text-2xl font-bold text-warning">{unverifiedRecords.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendUp className="h-8 w-8 text-info" />
              <div>
                <div className="text-sm text-muted-foreground">Est. Tax Savings</div>
                <div className="text-2xl font-bold text-success">
                  {userSettings.currency} {taxEstimate ? Math.round(totalDeductions * 0.22).toLocaleString() : 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Estimate */}
      {taxEstimate && (
        <Card>
          <CardHeader>
            <CardTitle>{currentYear} Tax Estimate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Taxable Income</div>
                <div className="text-xl font-bold">
                  {userSettings.currency} {taxEstimate.taxableIncome.toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Estimated Tax</div>
                <div className="text-xl font-bold text-destructive">
                  {userSettings.currency} {taxEstimate.estimatedTax.toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Effective Rate</div>
                <div className="text-xl font-bold">
                  {taxEstimate.effectiveTaxRate.toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Records</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {taxRecords.map(record => {
            const category = taxCategories.find(c => c.id === record.categoryId);
            return (
              <Card key={record.id} className={`border-l-4 ${record.verified ? 'border-l-success' : 'border-l-warning'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getCategoryIcon(record.categoryId)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{record.description}</h3>
                          {record.verified ? 
                            <Badge className="bg-success">Verified</Badge> : 
                            <Badge variant="outline" className="text-warning border-warning">Needs Review</Badge>
                          }
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="text-muted-foreground">Category: </span>
                            <span className="font-medium">{category?.name}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Amount: </span>
                            <span className="font-medium text-success">
                              {userSettings.currency} {record.amount.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date: </span>
                            <span className="font-medium">{new Date(record.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {!record.verified && (
                        <Button size="sm" onClick={() => verifyRecord(record.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Verify
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => deleteRecord(record.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {taxRecords.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No tax records yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start tracking your deductible expenses for tax season!
                </p>
                <Button onClick={() => setIsAddingRecord(true)}>
                  Add First Record
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          {taxCategories.map(category => (
            <Card key={category.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{getCategoryIcon(category.id)}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{category.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                    
                    <div className="flex gap-2 mb-2">
                      <Badge variant="outline">{category.deductionType}</Badge>
                      {category.maxAmount && (
                        <Badge variant="secondary">
                          Max: {userSettings.currency} {category.maxAmount.toLocaleString()}
                        </Badge>
                      )}
                      {category.percentage && (
                        <Badge variant="secondary">{category.percentage}% limit</Badge>
                      )}
                    </div>

                    <div className="text-sm">
                      <div className="text-muted-foreground mb-1">Required Documents:</div>
                      <div className="flex flex-wrap gap-1">
                        {category.requiredDocuments.map(doc => (
                          <Badge key={doc} variant="outline" className="text-xs">
                            {doc}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 text-sm">
                      <span className="text-muted-foreground">Records this year: </span>
                      <span className="font-medium">
                        {taxRecords.filter(r => r.categoryId === category.id).length}
                      </span>
                      <span className="text-muted-foreground"> • Total: </span>
                      <span className="font-medium text-success">
                        {userSettings.currency} {
                          taxRecords
                            .filter(r => r.categoryId === category.id)
                            .reduce((sum, r) => sum + r.amount, 0)
                            .toLocaleString()
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {taxCategories.map(category => {
                  const categoryRecords = taxRecords.filter(r => r.categoryId === category.id);
                  if (categoryRecords.length === 0) return null;

                  return (
                    <div key={category.id} className="border rounded p-3">
                      <h4 className="font-medium mb-2">{category.name}</h4>
                      <div className="space-y-1">
                        {category.requiredDocuments.map(doc => (
                          <div key={doc} className="flex items-center justify-between text-sm">
                            <span>{doc}</span>
                            <CheckCircle className="h-4 w-4 text-success" />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Automatic Tax Detection</div>
                  <div className="text-sm text-muted-foreground">
                    Automatically detect tax-deductible transactions
                  </div>
                </div>
                <Switch 
                  checked={autoTaxTracking} 
                  onCheckedChange={setAutoTaxTracking}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Record Modal */}
      {isAddingRecord && (
        <Card className="fixed inset-4 z-50 bg-background border shadow-lg overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Add Tax Record</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsAddingRecord(false)}>
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="category">Tax Category</Label>
              <Select value={newRecord.categoryId || ''} onValueChange={(value) => setNewRecord(prev => ({ ...prev, categoryId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {taxCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {getCategoryIcon(category.id)} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newRecord.amount || ''}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newRecord.date ? new Date(newRecord.date).toISOString().split('T')[0] : ''}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, date: new Date(e.target.value) }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newRecord.description || ''}
                onChange={(e) => setNewRecord(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the expense"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newRecord.verified || false}
                  onCheckedChange={(checked) => setNewRecord(prev => ({ ...prev, verified: checked }))}
                />
                <Label>Mark as verified</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingRecord(false)}>
                Cancel
              </Button>
              <Button onClick={addTaxRecord}>
                Add Record
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}