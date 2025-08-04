import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useKV } from '@github/spark/hooks';
import { Plus, Tag, Hash, MapPin, User, Calendar, TrendUp, Filter, X } from '@phosphor-icons/react';
import { Transaction, UserSettings } from '@/lib/types';

interface TransactionTag {
  id: string;
  name: string;
  color: string;
  category: 'personal' | 'location' | 'project' | 'person' | 'event';
  icon: string;
  count: number;
}

interface TaggedTransaction extends Transaction {
  tags: string[];
  location?: string;
  project?: string;
  person?: string;
  event?: string;
}

const TAG_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', 
  '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1'
];

const TAG_CATEGORIES = [
  { id: 'personal', label: 'Personal', icon: User, color: '#6366f1' },
  { id: 'location', label: 'Location', icon: MapPin, color: '#10b981' },
  { id: 'project', label: 'Project', icon: Hash, color: '#f59e0b' },
  { id: 'person', label: 'Person', icon: User, color: '#ec4899' },
  { id: 'event', label: 'Event', icon: Calendar, color: '#8b5cf6' }
];

interface EnhancedTransactionTaggingProps {
  transactions: Transaction[];
  userSettings: UserSettings;
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
}

export function EnhancedTransactionTagging({ 
  transactions, 
  userSettings, 
  onUpdateTransaction 
}: EnhancedTransactionTaggingProps) {
  const [tags, setTags] = useKV('transaction-tags', [] as TransactionTag[]);
  const [taggedTransactions, setTaggedTransactions] = useKV('tagged-transactions', [] as TaggedTransaction[]);
  const [newTagName, setNewTagName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('personal');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [isCreateTagOpen, setIsCreateTagOpen] = useState(false);

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;

    const newTag: TransactionTag = {
      id: Date.now().toString(),
      name: newTagName.trim(),
      color: selectedColor,
      category: selectedCategory as TransactionTag['category'],
      icon: TAG_CATEGORIES.find(c => c.id === selectedCategory)?.icon.name || 'Tag',
      count: 0
    };

    setTags(prev => [...prev, newTag]);
    setNewTagName('');
    setIsCreateTagOpen(false);
  };

  const handleAddTagToTransaction = (transactionId: string, tagId: string) => {
    const existingTagged = taggedTransactions.find(t => t.id === transactionId);
    
    if (existingTagged) {
      const updatedTags = existingTagged.tags.includes(tagId) 
        ? existingTagged.tags.filter(t => t !== tagId)
        : [...existingTagged.tags, tagId];
      
      setTaggedTransactions(prev => 
        prev.map(t => t.id === transactionId ? { ...t, tags: updatedTags } : t)
      );
    } else {
      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction) {
        const newTaggedTransaction: TaggedTransaction = {
          ...transaction,
          tags: [tagId]
        };
        setTaggedTransactions(prev => [...prev, newTaggedTransaction]);
      }
    }

    // Update tag count
    setTags(prev => 
      prev.map(tag => 
        tag.id === tagId 
          ? { ...tag, count: tag.count + (existingTagged?.tags.includes(tagId) ? -1 : 1) }
          : tag
      )
    );
  };

  const getTransactionTags = (transactionId: string): string[] => {
    const taggedTransaction = taggedTransactions.find(t => t.id === transactionId);
    return taggedTransaction?.tags || [];
  };

  const getTagsByCategory = (category: string) => {
    return tags.filter(tag => tag.category === category);
  };

  const getFilteredTransactions = () => {
    if (filterTags.length === 0) return transactions;
    
    return transactions.filter(transaction => {
      const transactionTags = getTransactionTags(transaction.id);
      return filterTags.some(filterTag => transactionTags.includes(filterTag));
    });
  };

  const toggleFilterTag = (tagId: string) => {
    setFilterTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const getTagAnalytics = () => {
    const analytics = tags.map(tag => {
      const taggedTxns = taggedTransactions.filter(t => t.tags.includes(tag.id));
      const totalAmount = taggedTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const avgAmount = taggedTxns.length > 0 ? totalAmount / taggedTxns.length : 0;
      
      return {
        ...tag,
        transactionCount: taggedTxns.length,
        totalAmount,
        avgAmount
      };
    });

    return analytics.sort((a, b) => b.totalAmount - a.totalAmount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Enhanced Transaction Tagging
              </CardTitle>
              <CardDescription>
                Organize and analyze your expenses with custom tags, locations, and metadata
              </CardDescription>
            </div>
            <Dialog open={isCreateTagOpen} onOpenChange={setIsCreateTagOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Tag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Tag</DialogTitle>
                  <DialogDescription>
                    Create a custom tag to categorize your transactions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="tag-name">Tag Name</Label>
                    <Input
                      id="tag-name"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Enter tag name..."
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {TAG_CATEGORIES.map((category) => {
                        const IconComponent = category.icon;
                        return (
                          <Button
                            key={category.id}
                            variant={selectedCategory === category.id ? "default" : "outline"}
                            className="justify-start"
                            onClick={() => setSelectedCategory(category.id)}
                          >
                            <IconComponent className="h-4 w-4 mr-2" />
                            {category.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label>Color</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {TAG_COLORS.map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${
                            selectedColor === color ? 'border-foreground' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setSelectedColor(color)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateTagOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTag} disabled={!newTagName.trim()}>
                      Create Tag
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="manage">Manage Tags</TabsTrigger>
          <TabsTrigger value="transactions">Tag Transactions</TabsTrigger>
          <TabsTrigger value="filter">Filter & Search</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-4">
          <div className="grid gap-6">
            {TAG_CATEGORIES.map((category) => {
              const categoryTags = getTagsByCategory(category.id);
              const IconComponent = category.icon;
              
              return (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <IconComponent className="h-5 w-5" style={{ color: category.color }} />
                      {category.label} Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {categoryTags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {categoryTags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="flex items-center gap-1"
                            style={{ borderColor: tag.color, color: tag.color }}
                          >
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                            <span className="text-xs ml-1">({tag.count})</span>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No {category.label.toLowerCase()} tags created yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tag Your Transactions</CardTitle>
              <CardDescription>
                Click on tags to add or remove them from transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.slice(0, 10).map((transaction) => {
                  const transactionTags = getTransactionTags(transaction.id);
                  
                  return (
                    <div key={transaction.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className={`font-bold ${transaction.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                          {userSettings.currency} {Math.abs(transaction.amount).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground font-medium">Available Tags:</div>
                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag) => (
                            <Badge
                              key={tag.id}
                              variant={transactionTags.includes(tag.id) ? "default" : "outline"}
                              className="cursor-pointer text-xs"
                              style={{ 
                                backgroundColor: transactionTags.includes(tag.id) ? tag.color : 'transparent',
                                borderColor: tag.color,
                                color: transactionTags.includes(tag.id) ? 'white' : tag.color
                              }}
                              onClick={() => handleAddTagToTransaction(transaction.id, tag.id)}
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filter" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter by Tags
              </CardTitle>
              <CardDescription>
                Select tags to filter transactions. Multiple tags show transactions with any of the selected tags.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={filterTags.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      style={{ 
                        backgroundColor: filterTags.includes(tag.id) ? tag.color : 'transparent',
                        borderColor: tag.color,
                        color: filterTags.includes(tag.id) ? 'white' : tag.color
                      }}
                      onClick={() => toggleFilterTag(tag.id)}
                    >
                      {tag.name}
                      {filterTags.includes(tag.id) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>

                {filterTags.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Showing {getFilteredTransactions().length} transactions
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setFilterTags([])}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  {getFilteredTransactions().slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center p-3 bg-muted/30 rounded">
                      <div>
                        <div className="font-medium text-sm">{transaction.description}</div>
                        <div className="text-xs text-muted-foreground">{transaction.category}</div>
                      </div>
                      <div className={`font-bold text-sm ${transaction.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                        {userSettings.currency} {Math.abs(transaction.amount).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendUp className="h-5 w-5" />
                Tag Analytics
              </CardTitle>
              <CardDescription>
                Analyze spending patterns by tags
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getTagAnalytics().map((tag) => (
                  <div key={tag.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <div>
                        <div className="font-medium">{tag.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {tag.transactionCount} transactions
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {userSettings.currency} {tag.totalAmount.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg: {userSettings.currency} {tag.avgAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}