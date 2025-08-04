import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { format, addDays, addMonths, differenceInDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { 
  Plus, 
  TrendUp, 
  Target, 
  Calendar, 
  Award, 
  Star, 
  Gift,
  CheckCircle,
  Clock,
  Zap,
  Trophy,
  DollarSign,
  Lightbulb,
  Crown
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { UserSettings, Transaction } from '@/lib/types';

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'spending' | 'saving' | 'streak' | 'category' | 'custom';
  target: number;
  current: number;
  unit: 'amount' | 'days' | 'transactions' | 'percentage';
  startDate: Date;
  endDate: Date;
  reward: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  isActive: boolean;
  isCompleted: boolean;
  completedAt?: Date;
  participants: string[];
  createdBy: string;
  tags: string[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'milestone' | 'streak' | 'category' | 'special';
  requirement: string;
  points: number;
  unlockedAt?: Date;
  isUnlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface StreakData {
  id: string;
  type: 'no_spend' | 'daily_save' | 'budget_adherence' | 'log_expense';
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  target: number;
  isActive: boolean;
}

interface GamificationSystemProps {
  userSettings: UserSettings;
  transactions: Transaction[];
}

const PREDEFINED_CHALLENGES = [
  {
    name: "No Coffee Week",
    description: "Skip buying coffee for 7 days straight",
    type: 'spending' as const,
    target: 7,
    unit: 'days' as const,
    difficulty: 'easy' as const,
    category: 'Food & Dining'
  },
  {
    name: "Save $100 This Month",
    description: "Put aside $100 by the end of the month",
    type: 'saving' as const,
    target: 100,
    unit: 'amount' as const,
    difficulty: 'medium' as const
  },
  {
    name: "Track Every Expense",
    description: "Log every single expense for 30 days",
    type: 'streak' as const,
    target: 30,
    unit: 'days' as const,
    difficulty: 'hard' as const
  }
];

const PREDEFINED_ACHIEVEMENTS = [
  {
    name: "First Step",
    description: "Log your first expense",
    icon: "🎯",
    type: 'milestone' as const,
    requirement: "first_expense",
    points: 10,
    rarity: 'common' as const
  },
  {
    name: "Century Saver",
    description: "Save $100 in total",
    icon: "💰",
    type: 'milestone' as const,
    requirement: "save_100",
    points: 50,
    rarity: 'rare' as const
  },
  {
    name: "Week Warrior",
    description: "Log expenses for 7 consecutive days",
    icon: "⚡",
    type: 'streak' as const,
    requirement: "7_day_streak",
    points: 25,
    rarity: 'common' as const
  },
  {
    name: "Budget Master",
    description: "Stay within budget for 3 months",
    icon: "👑",
    type: 'special' as const,
    requirement: "budget_master",
    points: 200,
    rarity: 'legendary' as const
  }
];

export function GamificationSystem({ userSettings, transactions }: GamificationSystemProps) {
  const [challenges, setChallenges] = useKV('gamificationChallenges', [] as Challenge[]);
  const [achievements, setAchievements] = useKV('gamificationAchievements', PREDEFINED_ACHIEVEMENTS as Achievement[]);
  const [streaks, setStreaks] = useKV('gamificationStreaks', [] as StreakData[]);
  const [userPoints, setUserPoints] = useKV('gamificationPoints', 0);
  const [userLevel, setUserLevel] = useKV('gamificationLevel', 1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'spending' as const,
    target: '',
    unit: 'amount' as const,
    duration: '7',
    reward: '',
    difficulty: 'medium' as const,
    category: ''
  });

  const calculateLevel = (points: number): number => {
    return Math.floor(Math.sqrt(points / 100)) + 1;
  };

  const getPointsForNextLevel = (currentLevel: number): number => {
    return Math.pow(currentLevel, 2) * 100;
  };

  const checkAchievements = async () => {
    const unlockedAchievements: string[] = [];

    achievements.forEach(achievement => {
      if (!achievement.isUnlocked) {
        let shouldUnlock = false;

        switch (achievement.requirement) {
          case 'first_expense':
            shouldUnlock = transactions.length > 0;
            break;
          case 'save_100':
            const totalSavings = transactions
              .filter(t => t.category === 'Savings')
              .reduce((sum, t) => sum + t.amount, 0);
            shouldUnlock = totalSavings >= 100;
            break;
          case '7_day_streak':
            const hasSevenDayStreak = streaks.some(s => s.currentStreak >= 7);
            shouldUnlock = hasSevenDayStreak;
            break;
          case 'budget_master':
            // This would require budget adherence tracking
            shouldUnlock = false; // Placeholder
            break;
        }

        if (shouldUnlock) {
          unlockedAchievements.push(achievement.name);
          achievement.isUnlocked = true;
          achievement.unlockedAt = new Date();
          setUserPoints(prev => prev + achievement.points);
        }
      }
    });

    if (unlockedAchievements.length > 0) {
      setAchievements([...achievements]);
      unlockedAchievements.forEach(name => {
        toast.success(`🏆 Achievement Unlocked: ${name}!`);
      });
    }
  };

  const updateStreaks = () => {
    const today = new Date();
    const yesterday = addDays(today, -1);

    // Update expense logging streak
    const expenseStreak = streaks.find(s => s.type === 'log_expense') || {
      id: 'log_expense',
      type: 'log_expense' as const,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: new Date(),
      target: 30,
      isActive: true
    };

    const todayExpenses = transactions.filter(t => 
      format(new Date(t.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
    );

    if (todayExpenses.length > 0) {
      if (format(expenseStreak.lastActivityDate, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
        expenseStreak.currentStreak += 1;
      } else {
        expenseStreak.currentStreak = 1;
      }
      expenseStreak.lastActivityDate = today;
      expenseStreak.longestStreak = Math.max(expenseStreak.longestStreak, expenseStreak.currentStreak);
    } else if (format(expenseStreak.lastActivityDate, 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd')) {
      expenseStreak.currentStreak = 0;
    }

    const updatedStreaks = streaks.filter(s => s.type !== 'log_expense');
    updatedStreaks.push(expenseStreak);
    setStreaks(updatedStreaks);
  };

  const createChallenge = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.target) {
      toast.error('Please fill in all required fields');
      return;
    }

    const startDate = new Date();
    const endDate = addDays(startDate, parseInt(formData.duration));

    const challenge: Challenge = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      type: formData.type,
      target: parseFloat(formData.target),
      current: 0,
      unit: formData.unit,
      startDate,
      endDate,
      reward: formData.reward,
      difficulty: formData.difficulty,
      category: formData.category,
      isActive: true,
      isCompleted: false,
      participants: ['user'],
      createdBy: 'user',
      tags: []
    };

    setChallenges(prev => [...prev, challenge]);
    toast.success('Challenge created successfully!');
    setIsCreateDialogOpen(false);
    
    setFormData({
      name: '',
      description: '',
      type: 'spending',
      target: '',
      unit: 'amount',
      duration: '7',
      reward: '',
      difficulty: 'medium',
      category: ''
    });
  };

  const updateChallengeProgress = () => {
    const updatedChallenges = challenges.map(challenge => {
      if (!challenge.isActive || challenge.isCompleted) return challenge;

      let progress = 0;

      switch (challenge.type) {
        case 'spending':
          if (challenge.category) {
            const categorySpending = transactions
              .filter(t => 
                t.category === challenge.category && 
                new Date(t.date) >= challenge.startDate &&
                new Date(t.date) <= challenge.endDate
              )
              .reduce((sum, t) => sum + t.amount, 0);
            progress = challenge.target - categorySpending;
          }
          break;
        case 'saving':
          const savings = transactions
            .filter(t => 
              t.category === 'Savings' && 
              new Date(t.date) >= challenge.startDate &&
              new Date(t.date) <= challenge.endDate
            )
            .reduce((sum, t) => sum + t.amount, 0);
          progress = savings;
          break;
        case 'streak':
          const relevantStreak = streaks.find(s => s.type === 'log_expense');
          progress = relevantStreak?.currentStreak || 0;
          break;
      }

      const updatedChallenge = { ...challenge, current: progress };

      if (progress >= challenge.target && !challenge.isCompleted) {
        updatedChallenge.isCompleted = true;
        updatedChallenge.completedAt = new Date();
        toast.success(`🎉 Challenge completed: ${challenge.name}!`);
        
        // Award points based on difficulty
        const points = challenge.difficulty === 'easy' ? 10 : challenge.difficulty === 'medium' ? 25 : 50;
        setUserPoints(prev => prev + points);
      }

      return updatedChallenge;
    });

    if (JSON.stringify(updatedChallenges) !== JSON.stringify(challenges)) {
      setChallenges(updatedChallenges);
    }
  };

  const generatePersonalizedChallenges = async (): Promise<Challenge[]> => {
    const prompt = spark.llmPrompt`
    Based on this user's spending data, suggest 3 personalized financial challenges:
    
    Recent transactions: ${transactions.slice(-10).map(t => `${t.category}: ${userSettings.currency}${t.amount}`).join(', ')}
    Country: ${userSettings.country}
    Currency: ${userSettings.currency}
    
    Create challenges that are:
    1. Specific to their spending patterns
    2. Achievable but motivating
    3. Culturally relevant to their country
    
    Format as JSON array with name, description, type, target, duration.
    `;

    try {
      const suggestions = await spark.llm(prompt, "gpt-4o-mini", true);
      const parsedSuggestions = JSON.parse(suggestions);
      
      return parsedSuggestions.map((suggestion: any, index: number) => ({
        id: `ai_${Date.now()}_${index}`,
        name: suggestion.name,
        description: suggestion.description,
        type: suggestion.type,
        target: suggestion.target,
        current: 0,
        unit: 'amount',
        startDate: new Date(),
        endDate: addDays(new Date(), suggestion.duration || 7),
        reward: `${suggestion.target} points`,
        difficulty: 'medium',
        isActive: false,
        isCompleted: false,
        participants: [],
        createdBy: 'ai',
        tags: ['ai-suggested']
      }));
    } catch (error) {
      return [];
    }
  };

  useEffect(() => {
    updateStreaks();
    updateChallengeProgress();
    checkAchievements();
    
    const newLevel = calculateLevel(userPoints);
    if (newLevel !== userLevel) {
      setUserLevel(newLevel);
      toast.success(`🎊 Level up! You're now level ${newLevel}!`);
    }
  }, [transactions, userPoints]);

  const activeChallenges = challenges.filter(c => c.isActive && !c.isCompleted);
  const completedChallenges = challenges.filter(c => c.isCompleted);
  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const pointsForNext = getPointsForNextLevel(userLevel);
  const progressToNext = ((userPoints % pointsForNext) / pointsForNext) * 100;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400 bg-gray-50';
      case 'rare': return 'border-blue-400 bg-blue-50';
      case 'epic': return 'border-purple-400 bg-purple-50';
      case 'legendary': return 'border-yellow-400 bg-yellow-50';
      default: return 'border-gray-400 bg-gray-50';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gamification Center</h2>
          <p className="text-muted-foreground">Level up your financial habits with challenges and achievements</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Challenge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Personal Challenge</DialogTitle>
              <DialogDescription>
                Design a custom financial challenge to motivate yourself.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createChallenge} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Challenge Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., No Takeout Week"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spending">Reduce Spending</SelectItem>
                      <SelectItem value="saving">Increase Savings</SelectItem>
                      <SelectItem value="streak">Build Streak</SelectItem>
                      <SelectItem value="category">Category Focus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What are you trying to achieve?"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target">Target *</Label>
                  <Input
                    id="target"
                    type="number"
                    value={formData.target}
                    onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value }))}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="7"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(value: any) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy (10 pts)</SelectItem>
                      <SelectItem value="medium">Medium (25 pts)</SelectItem>
                      <SelectItem value="hard">Hard (50 pts)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reward">Reward</Label>
                <Input
                  id="reward"
                  value={formData.reward}
                  onChange={(e) => setFormData(prev => ({ ...prev, reward: e.target.value }))}
                  placeholder="What will you reward yourself with?"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Challenge
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Level & Progress */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Crown className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold">Level {userLevel}</p>
              <p className="text-xs text-muted-foreground">Financial Expert</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Star className="h-8 w-8 text-primary mr-3" />
            <div>
              <p className="text-2xl font-bold">{userPoints}</p>
              <p className="text-xs text-muted-foreground">Total Points</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Target className="h-8 w-8 text-success mr-3" />
            <div>
              <p className="text-2xl font-bold">{activeChallenges.length}</p>
              <p className="text-xs text-muted-foreground">Active Challenges</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Trophy className="h-8 w-8 text-warning mr-3" />
            <div>
              <p className="text-2xl font-bold">{unlockedAchievements.length}</p>
              <p className="text-xs text-muted-foreground">Achievements</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress to Level {userLevel + 1}</span>
            <span className="text-sm text-muted-foreground">
              {userPoints % pointsForNext}/{pointsForNext} points
            </span>
          </div>
          <Progress value={progressToNext} className="h-3" />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="challenges">Challenges ({activeChallenges.length})</TabsTrigger>
          <TabsTrigger value="achievements">Achievements ({unlockedAchievements.length})</TabsTrigger>
          <TabsTrigger value="streaks">Streaks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Active Challenges
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeChallenges.length === 0 ? (
                  <p className="text-muted-foreground">No active challenges</p>
                ) : (
                  <div className="space-y-3">
                    {activeChallenges.slice(0, 3).map(challenge => (
                      <div key={challenge.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{challenge.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {challenge.current}/{challenge.target} {challenge.unit}
                          </p>
                        </div>
                        <Progress 
                          value={(challenge.current / challenge.target) * 100} 
                          className="w-20 h-2" 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-500" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {unlockedAchievements.length === 0 ? (
                  <p className="text-muted-foreground">No achievements yet</p>
                ) : (
                  <div className="space-y-3">
                    {unlockedAchievements.slice(-3).map(achievement => (
                      <div key={achievement.id} className="flex items-center gap-3">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{achievement.name}</p>
                          <p className="text-xs text-muted-foreground">{achievement.points} points</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              onClick={async () => {
                const aiChallenges = await generatePersonalizedChallenges();
                if (aiChallenges.length > 0) {
                  setChallenges(prev => [...prev, ...aiChallenges]);
                  toast.success(`Generated ${aiChallenges.length} AI challenges!`);
                }
              }}
              variant="outline"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Get AI Suggestions
            </Button>
          </div>

          {activeChallenges.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active challenges</h3>
                <p className="text-muted-foreground text-center">
                  Create your first challenge to start improving your financial habits!
                </p>
              </CardContent>
            </Card>
          ) : (
            activeChallenges.map(challenge => (
              <Card key={challenge.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {challenge.type === 'spending' && <DollarSign className="h-5 w-5" />}
                        {challenge.type === 'saving' && <Target className="h-5 w-5" />}
                        {challenge.type === 'streak' && <Zap className="h-5 w-5" />}
                        {challenge.name}
                      </CardTitle>
                      <CardDescription>{challenge.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getDifficultyColor(challenge.difficulty)}>
                        {challenge.difficulty}
                      </Badge>
                      <Badge variant="outline">
                        {differenceInDays(challenge.endDate, new Date())} days left
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>
                          {challenge.current}/{challenge.target} {challenge.unit}
                        </span>
                      </div>
                      <Progress value={(challenge.current / challenge.target) * 100} className="h-3" />
                    </div>

                    {challenge.reward && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Reward: {challenge.reward}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {completedChallenges.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Completed Challenges</h3>
              {completedChallenges.slice(-3).map(challenge => (
                <Card key={challenge.id} className="border-success bg-success/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-success" />
                        <div>
                          <p className="font-medium">{challenge.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Completed {challenge.completedAt && format(challenge.completedAt, 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-success text-success-foreground">
                        Completed
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {achievements.map(achievement => (
              <Card 
                key={achievement.id} 
                className={achievement.isUnlocked ? getRarityColor(achievement.rarity) : 'opacity-50'}
              >
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className="text-4xl">{achievement.icon}</div>
                    <h3 className="font-semibold">{achievement.name}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    <div className="flex items-center justify-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {achievement.points} points
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {achievement.rarity}
                      </Badge>
                    </div>
                    {achievement.isUnlocked && achievement.unlockedAt && (
                      <p className="text-xs text-success">
                        Unlocked {format(achievement.unlockedAt, 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="streaks" className="space-y-4">
          {streaks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No streaks yet</h3>
                <p className="text-muted-foreground text-center">
                  Start logging expenses daily to build your first streak!
                </p>
              </CardContent>
            </Card>
          ) : (
            streaks.map(streak => (
              <Card key={streak.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold capitalize">
                        {streak.type.replace('_', ' ')} Streak
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Keep it going to build consistency!
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Zap className="h-6 w-6 text-orange-500" />
                        <span className="text-2xl font-bold">{streak.currentStreak}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Best: {streak.longestStreak} days
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress 
                      value={(streak.currentStreak / streak.target) * 100} 
                      className="h-2" 
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: {streak.target} days
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}