import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SpendingInsight } from '@/lib/types';
import { AlertTriangle, Info, CheckCircle } from '@phosphor-icons/react';
import { formatCurrency } from '@/lib/constants';

interface InsightsProps {
  insights: SpendingInsight[];
}

export function Insights({ insights }: InsightsProps) {
  const getIcon = (type: SpendingInsight['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-accent" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-secondary" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const getBadgeVariant = (type: SpendingInsight['type']) => {
    switch (type) {
      case 'warning':
        return 'destructive' as const;
      case 'success':
        return 'default' as const;
      case 'info':
      default:
        return 'secondary' as const;
    }
  };

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Not enough data to generate insights yet. Add more transactions to see personalized recommendations!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 border border-border rounded-lg bg-card/50"
            >
              <div className="mt-0.5">
                {getIcon(insight.type)}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{insight.title}</h4>
                  <Badge variant={getBadgeVariant(insight.type)} className="text-xs">
                    {insight.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {insight.description}
                </p>
                {insight.amount && (
                  <div className="text-sm font-medium">
                    Amount: {formatCurrency(insight.amount)}
                  </div>
                )}
                {insight.category && (
                  <div className="text-sm text-muted-foreground">
                    Category: {insight.category}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}