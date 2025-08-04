import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useKV } from '@github/spark/hooks';
import { Transaction, Budget, SavingGoal, UserSettings } from '@/lib/types';
import { formatCurrency } from '@/lib/constants';
import { 
  Bell, 
  BellRinging, 
  Target, 
  TrendDown, 
  TrendUp, 
  Calendar, 
  CreditCard,
  Warning,
  CheckCircle,
  Info,
  X
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface SmartNotification {
  id: string;
  type: 'budget_alert' | 'goal_reminder' | 'emi_due' | 'spending_pattern' | 'savings_opportunity';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: string;
  isRead: boolean;
  actionRequired: boolean;
  metadata?: any;
}

interface SmartNotificationsProps {
  transactions: Transaction[];
  budgets: Budget[];
  savingGoals: SavingGoal[];
  userSettings: UserSettings;
}

export function SmartNotifications({ 
  transactions, 
  budgets, 
  savingGoals, 
  userSettings 
}: SmartNotificationsProps) {
  const [notifications, setNotifications] = useKV('notifications', [] as SmartNotification[]);
  const [notificationSettings, setNotificationSettings] = useKV('notificationSettings', {
    budgetAlerts: true,
    goalReminders: true,
    emiDue: true,
    spendingPatterns: true,
    savingsOpportunities: true,
    weeklyReports: false,
    realTimeAlerts: true,
  });

  useEffect(() => {
    generateSmartNotifications();
  }, [transactions, budgets, savingGoals]);

  const generateSmartNotifications = () => {
    const newNotifications: SmartNotification[] = [];
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Budget alerts
    if (notificationSettings.budgetAlerts) {
      budgets.forEach(budget => {
        const monthlySpent = transactions
          .filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === thisMonth && 
                   date.getFullYear() === thisYear &&
                   t.type === 'expense'
          })
          .reduce((sum, t) => sum + t.amount, 0);

        const percentage = (monthlySpent / budget.amount) * 100;
        
        if (percentage >= budget.alertThreshold) {
          newNotifications.push({
            id: `budget-${budget.id}-${Date.now()}`,
            type: 'budget_alert',
            title: `Budget Alert: ${percentage >= 100 ? 'Exceeded' : 'Almost Reached'}`,
            message: `You've spent ${formatCurrency(monthlySpent, userSettings.currency)} of your ${formatCurrency(budget.amount, userSettings.currency)} budget (${percentage.toFixed(0)}%)`,
            priority: percentage >= 100 ? 'high' : 'medium',
            timestamp: now.toISOString(),
            isRead: false,
            actionRequired: percentage >= 100,
            metadata: { budgetId: budget.id, percentage }
          });
        }
      });
    }

    // Goal reminders
    if (notificationSettings.goalReminders) {
      savingGoals.forEach(goal => {
        const targetDate = new Date(goal.targetDate);
        const daysLeft = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        
        if (daysLeft <= 30 && progress < 80) {
          newNotifications.push({
            id: `goal-${goal.id}-${Date.now()}`,
            type: 'goal_reminder',
            title: `Goal Deadline Approaching: ${goal.name}`,
            message: `Only ${daysLeft} days left! You're ${progress.toFixed(0)}% towards your goal of ${formatCurrency(goal.targetAmount, userSettings.currency)}`,
            priority: daysLeft <= 7 ? 'high' : 'medium',
            timestamp: now.toISOString(),
            isRead: false,
            actionRequired: true,
            metadata: { goalId: goal.id, daysLeft, progress }
          });
        }
      });
    }

    // Spending pattern alerts
    if (notificationSettings.spendingPatterns) {
      const lastWeekSpending = transactions
        .filter(t => {
          const date = new Date(t.date);
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return date >= weekAgo && t.type === 'expense';
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const previousWeekSpending = transactions
        .filter(t => {
          const date = new Date(t.date);
          const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return date >= twoWeeksAgo && date < weekAgo && t.type === 'expense';
        })
        .reduce((sum, t) => sum + t.amount, 0);

      if (previousWeekSpending > 0) {
        const percentageChange = ((lastWeekSpending - previousWeekSpending) / previousWeekSpending) * 100;
        
        if (Math.abs(percentageChange) >= 20) {
          newNotifications.push({
            id: `spending-pattern-${Date.now()}`,
            type: 'spending_pattern',
            title: `Spending ${percentageChange > 0 ? 'Increased' : 'Decreased'} Significantly`,
            message: `Your spending ${percentageChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(percentageChange).toFixed(0)}% this week (${formatCurrency(lastWeekSpending, userSettings.currency)} vs ${formatCurrency(previousWeekSpending, userSettings.currency)})`,
            priority: percentageChange > 0 ? 'medium' : 'low',
            timestamp: now.toISOString(),
            isRead: false,
            actionRequired: percentageChange > 50,
            metadata: { percentageChange, currentWeek: lastWeekSpending, previousWeek: previousWeekSpending }
          });
        }
      }
    }

    // Savings opportunities
    if (notificationSettings.savingsOpportunities) {
      const monthlyIncome = transactions
        .filter(t => {
          const date = new Date(t.date);
          return date.getMonth() === thisMonth && 
                 date.getFullYear() === thisYear &&
                 t.type === 'income'
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const monthlyExpenses = transactions
        .filter(t => {
          const date = new Date(t.date);
          return date.getMonth() === thisMonth && 
                 date.getFullYear() === thisYear &&
                 t.type === 'expense'
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
      
      if (savingsRate < 20 && monthlyIncome > 0) {
        newNotifications.push({
          id: `savings-opportunity-${Date.now()}`,
          type: 'savings_opportunity',
          title: 'Low Savings Rate Detected',
          message: `Your current savings rate is ${savingsRate.toFixed(0)}%. Consider increasing it to 20% or more for better financial health.`,
          priority: 'medium',
          timestamp: now.toISOString(),
          isRead: false,
          actionRequired: true,
          metadata: { savingsRate, monthlyIncome, monthlyExpenses }
        });
      }
    }

    // Only add notifications that don't already exist
    const existingIds = notifications.map(n => n.id);
    const uniqueNewNotifications = newNotifications.filter(n => !existingIds.includes(n.id));
    
    if (uniqueNewNotifications.length > 0) {
      setNotifications(prev => [...uniqueNewNotifications, ...prev].slice(0, 50)); // Keep only 50 latest
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getNotificationIcon = (type: SmartNotification['type']) => {
    switch (type) {
      case 'budget_alert':
        return <Warning className="h-5 w-5" />;
      case 'goal_reminder':
        return <Target className="h-5 w-5" />;
      case 'emi_due':
        return <CreditCard className="h-5 w-5" />;
      case 'spending_pattern':
        return <TrendUp className="h-5 w-5" />;
      case 'savings_opportunity':
        return <TrendDown className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: SmartNotification['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-destructive bg-destructive/5';
      case 'medium':
        return 'border-l-warning bg-warning/5';
      case 'low':
        return 'border-l-info bg-info/5';
      default:
        return 'border-l-muted';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Bell className="h-6 w-6 text-white" />
            </div>
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">Smart Notifications</h2>
            <p className="text-muted-foreground">AI-powered alerts and insights for your finances</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}
          disabled={unreadCount === 0}
        >
          Mark All Read
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRinging className="h-5 w-5" />
                Recent Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount} new</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications yet</p>
                  <p className="text-sm">We'll notify you about important financial insights</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border-l-4 ${getPriorityColor(notification.priority)} ${
                        !notification.isRead ? 'bg-opacity-100' : 'bg-opacity-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <div className={`mt-0.5 ${notification.priority === 'high' ? 'text-destructive' : notification.priority === 'medium' ? 'text-warning' : 'text-info'}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className={`font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <Badge variant="outline" className="text-xs">New</Badge>
                              )}
                              {notification.actionRequired && (
                                <Badge variant="destructive" className="text-xs">Action Required</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(notification.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-8 w-8 p-0"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissNotification(notification.id)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="budget-alerts">Budget Alerts</Label>
                <Switch
                  id="budget-alerts"
                  checked={notificationSettings.budgetAlerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, budgetAlerts: checked }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="goal-reminders">Goal Reminders</Label>
                <Switch
                  id="goal-reminders"
                  checked={notificationSettings.goalReminders}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, goalReminders: checked }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="spending-patterns">Spending Patterns</Label>
                <Switch
                  id="spending-patterns"
                  checked={notificationSettings.spendingPatterns}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, spendingPatterns: checked }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="savings-opportunities">Savings Opportunities</Label>
                <Switch
                  id="savings-opportunities"
                  checked={notificationSettings.savingsOpportunities}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, savingsOpportunities: checked }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="weekly-reports">Weekly Reports</Label>
                <Switch
                  id="weekly-reports"
                  checked={notificationSettings.weeklyReports}
                  onCheckedChange={(checked) =>
                    setNotificationSettings(prev => ({ ...prev, weeklyReports: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Total Notifications</span>
                  <Badge variant="outline">{notifications.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Unread</span>
                  <Badge variant="destructive">{unreadCount}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Action Required</span>
                  <Badge variant="warning">
                    {notifications.filter(n => n.actionRequired && !n.isRead).length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}