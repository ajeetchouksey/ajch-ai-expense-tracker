import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import type { Transaction, SavingGoal, UserSettings } from '../lib/types';

interface AdvancedGoalPlanningProps {
  transactions: Transaction[];
  savingGoals: SavingGoal[];
  userSettings: UserSettings;
}

export function AdvancedGoalPlanning({ transactions, savingGoals, userSettings }: AdvancedGoalPlanningProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Savings Goals</h2>
          <p className="text-muted-foreground">Track and manage your financial goals</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {savingGoals.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Goals Set</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Set up your first savings goal to start tracking your progress.
              </p>
            </CardContent>
          </Card>
        ) : (
          savingGoals.map((goal) => {
            const progress = calculateGoalProgress(transactions, goal);
            
            return (
              <Card key={goal.id}>
                <CardHeader>
                  <CardTitle>{goal.name}</CardTitle>
                  <div className="text-2xl font-bold">
                    {formatCurrency(goal.targetAmount, userSettings)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress value={progress} />
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(calculateCurrentAmount(transactions, goal), userSettings)} saved
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{getRemainingDays(goal)} days remaining</span>
                      <span>{progress.toFixed(1)}% complete</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

// Helper functions
function calculateGoalProgress(transactions: Transaction[], goal: SavingGoal): number {
  const currentAmount = calculateCurrentAmount(transactions, goal);
  return (currentAmount / goal.targetAmount) * 100;
}

function calculateCurrentAmount(transactions: Transaction[], goal: SavingGoal): number {
  // Filter transactions for this goal and sum them
  return transactions
    .filter(t => t.goalId === goal.id)
    .reduce((sum, t) => sum + t.amount, 0);
}

function getRemainingDays(goal: SavingGoal): number {
  const today = new Date();
  const deadline = new Date(goal.deadline);
  const diffTime = Math.abs(deadline.getTime() - today.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatCurrency(amount: number, userSettings: UserSettings): string {
  return new Intl.NumberFormat(userSettings.locale, {
    style: 'currency',
    currency: userSettings.currency,
  }).format(amount);
}
