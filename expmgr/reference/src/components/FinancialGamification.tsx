import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useKV } from '@github/spark/hooks';
import { UserSettings } from '@/lib/types';
import { Trophy, Target, Star, Gift, Flame, Medal, Crown, Zap } from '@phosphor-icons/react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  requirement: number;
  current: number;
  unlocked: boolean;
  xp: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  target: number;
  current: number;
  reward: number;
  deadline: Date;
  type: 'spending' | 'saving' | 'streak' | 'category';
  completed: boolean;
}

interface FinancialGamificationProps {
  userSettings: UserSettings;
  transactions: any[];
  savingGoals: any[];
  budgets: any[];
}

export function FinancialGamification({ userSettings, transactions, savingGoals, budgets }: FinancialGamificationProps) {
  const [userLevel, setUserLevel] = useKV('userLevel', 1);
  const [userXP, setUserXP] = useKV('userXP', 0);
  const [currentStreak, setCurrentStreak] = useKV('currentStreak', 0);
  const [longestStreak, setLongestStreak] = useKV('longestStreak', 0);
  const [achievements, setAchievements] = useKV('achievements', [] as Achievement[]);
  const [challenges, setChallenges] = useKV('challenges', [] as Challenge[]);
  const [notifications, setNotifications] = useKV('gamificationNotifications', true);
  const [selectedTab, setSelectedTab] = useState('overview');

  const calculateLevel = (xp: number) => Math.floor(xp / 1000) + 1;
  const calculateXPForNextLevel = (level: number) => level * 1000;

  useEffect(() => {
    initializeAchievements();
    initializeChallenges();
    updateProgress();
  }, [transactions, savingGoals, budgets]);

  const initializeAchievements = () => {
    if (achievements.length === 0) {
      const defaultAchievements: Achievement[] = [
        {
          id: 'first-transaction',
          name: 'Getting Started',
          description: 'Record your first transaction',
          icon: <Star className="h-5 w-5" />,
          requirement: 1,
          current: 0,
          unlocked: false,
          xp: 100,
          rarity: 'common'
        },
        {
          id: 'budget-master',
          name: 'Budget Master',
          description: 'Stay within budget for 3 consecutive months',
          icon: <Trophy className="h-5 w-5" />,
          requirement: 3,
          current: 0,
          unlocked: false,
          xp: 500,
          rarity: 'epic'
        },
        {
          id: 'savings-champion',
          name: 'Savings Champion',
          description: 'Complete your first savings goal',
          icon: <Target className="h-5 w-5" />,
          requirement: 1,
          current: 0,
          unlocked: false,
          xp: 300,
          rarity: 'rare'
        },
        {
          id: 'streak-warrior',
          name: 'Streak Warrior',
          description: 'Maintain a 30-day tracking streak',
          icon: <Flame className="h-5 w-5" />,
          requirement: 30,
          current: 0,
          unlocked: false,
          xp: 750,
          rarity: 'epic'
        },
        {
          id: 'financial-guru',
          name: 'Financial Guru',
          description: 'Achieve a 20% savings rate',
          icon: <Crown className="h-5 w-5" />,
          requirement: 20,
          current: 0,
          unlocked: false,
          xp: 1000,
          rarity: 'legendary'
        }
      ];
      setAchievements(defaultAchievements);
    }
  };

  const initializeChallenges = () => {
    if (challenges.length === 0) {
      const defaultChallenges: Challenge[] = [
        {
          id: 'weekly-saver',
          name: 'Weekly Saver',
          description: 'Save $100 this week',
          target: 100,
          current: 0,
          reward: 200,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          type: 'saving',
          completed: false
        },
        {
          id: 'budget-defender',
          name: 'Budget Defender',
          description: 'Stay within food budget this month',
          target: 1,
          current: 0,
          reward: 150,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          type: 'category',
          completed: false
        }
      ];
      setChallenges(defaultChallenges);
    }
  };

  const updateProgress = () => {
    // Update achievements based on current data
    setAchievements(prev => prev.map(achievement => {
      let current = achievement.current;
      
      switch (achievement.id) {
        case 'first-transaction':
          current = Math.min(transactions.length, achievement.requirement);
          break;
        case 'savings-champion':
          current = savingGoals.filter(goal => goal.progress >= goal.target).length;
          break;
        case 'streak-warrior':
          current = currentStreak;
          break;
        case 'financial-guru':
          const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
          const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
          const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
          current = Math.min(savingsRate, achievement.requirement);
          break;
      }

      const unlocked = current >= achievement.requirement && !achievement.unlocked;
      
      if (unlocked) {
        addXP(achievement.xp);
        if (notifications) {
          setTimeout(() => {
            alert(`🎉 Achievement Unlocked: ${achievement.name}! +${achievement.xp} XP`);
          }, 500);
        }
      }

      return { ...achievement, current, unlocked: unlocked || achievement.unlocked };
    }));
  };

  const addXP = (points: number) => {
    setUserXP(prev => {
      const newXP = prev + points;
      const newLevel = calculateLevel(newXP);
      if (newLevel > userLevel) {
        setUserLevel(newLevel);
        if (notifications) {
          setTimeout(() => {
            alert(`🚀 Level Up! You're now level ${newLevel}!`);
          }, 1000);
        }
      }
      return newXP;
    });
  };

  const createCustomChallenge = () => {
    const newChallenge: Challenge = {
      id: `custom-${Date.now()}`,
      name: 'Custom Challenge',
      description: 'Complete your custom financial goal',
      target: 100,
      current: 0,
      reward: 100,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      type: 'saving',
      completed: false
    };
    
    setChallenges(prev => [...prev, newChallenge]);
  };

  const completeChallenge = (challengeId: string) => {
    setChallenges(prev => prev.map(challenge => {
      if (challenge.id === challengeId && !challenge.completed) {
        addXP(challenge.reward);
        if (notifications) {
          setTimeout(() => {
            alert(`🎯 Challenge Complete: ${challenge.name}! +${challenge.reward} XP`);
          }, 500);
        }
        return { ...challenge, completed: true };
      }
      return challenge;
    }));
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getRarityTextColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600';
      case 'rare': return 'text-blue-600';
      case 'epic': return 'text-purple-600';
      case 'legendary': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Player Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">Level {userLevel}</div>
                <div className="text-sm text-muted-foreground">Financial Master</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-warning/20 rounded-full flex items-center justify-center">
                <Zap className="h-6 w-6 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold">{userXP.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Experience Points</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-destructive/20 rounded-full flex items-center justify-center">
                <Flame className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <div className="text-2xl font-bold">{currentStreak}</div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-success/20 rounded-full flex items-center justify-center">
                <Medal className="h-6 w-6 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">{achievements.filter(a => a.unlocked).length}</div>
                <div className="text-sm text-muted-foreground">Achievements</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Level {userLevel} Progress</span>
              <span>{userXP % 1000} / {calculateXPForNextLevel(userLevel) - (userLevel - 1) * 1000} XP</span>
            </div>
            <Progress 
              value={(userXP % 1000) / (calculateXPForNextLevel(userLevel) - (userLevel - 1) * 1000) * 100} 
              className="h-3"
            />
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          variant={selectedTab === 'overview' ? 'default' : 'outline'} 
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </Button>
        <Button 
          variant={selectedTab === 'achievements' ? 'default' : 'outline'} 
          onClick={() => setSelectedTab('achievements')}
        >
          Achievements
        </Button>
        <Button 
          variant={selectedTab === 'challenges' ? 'default' : 'outline'} 
          onClick={() => setSelectedTab('challenges')}
        >
          Challenges
        </Button>
        <Button 
          variant={selectedTab === 'leaderboard' ? 'default' : 'outline'} 
          onClick={() => setSelectedTab('leaderboard')}
        >
          Leaderboard
        </Button>
      </div>

      {/* Tab Content */}
      {selectedTab === 'achievements' && (
        <div className="grid gap-4 md:grid-cols-2">
          {achievements.map(achievement => (
            <Card key={achievement.id} className={achievement.unlocked ? 'border-success' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                    achievement.unlocked ? getRarityColor(achievement.rarity) : 'bg-muted'
                  }`}>
                    <div className={achievement.unlocked ? 'text-white' : 'text-muted-foreground'}>
                      {achievement.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{achievement.name}</h3>
                      <Badge variant="outline" className={getRarityTextColor(achievement.rarity)}>
                        {achievement.rarity}
                      </Badge>
                      {achievement.unlocked && <Badge className="bg-success">Unlocked</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                    <div className="space-y-2">
                      <Progress 
                        value={(achievement.current / achievement.requirement) * 100} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{achievement.current} / {achievement.requirement}</span>
                        <span>+{achievement.xp} XP</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedTab === 'challenges' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Active Challenges</h3>
            <Button onClick={createCustomChallenge} size="sm">
              <Gift className="h-4 w-4 mr-1" />
              Create Challenge
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {challenges.map(challenge => (
              <Card key={challenge.id} className={challenge.completed ? 'border-success' : ''}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{challenge.name}</h4>
                      {challenge.completed && <Badge className="bg-success">Complete</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    <div className="space-y-2">
                      <Progress 
                        value={(challenge.current / challenge.target) * 100} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{challenge.current} / {challenge.target}</span>
                        <span>Reward: +{challenge.reward} XP</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Ends: {challenge.deadline.toLocaleDateString()}
                      </span>
                      {!challenge.completed && challenge.current >= challenge.target && (
                        <Button size="sm" onClick={() => completeChallenge(challenge.id)}>
                          Claim Reward
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedTab === 'leaderboard' && (
        <Card>
          <CardHeader>
            <CardTitle>Global Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { rank: 1, name: 'You', level: userLevel, xp: userXP, badge: '🥇' },
                { rank: 2, name: 'Financial Ninja', level: userLevel + 2, xp: userXP + 2500, badge: '🥈' },
                { rank: 3, name: 'Budget Master', level: userLevel + 1, xp: userXP + 1200, badge: '🥉' },
                { rank: 4, name: 'Savings Hero', level: userLevel, xp: userXP - 300, badge: '4️⃣' },
                { rank: 5, name: 'Money Wizard', level: userLevel - 1, xp: Math.max(0, userXP - 800), badge: '5️⃣' }
              ].map(player => (
                <div key={player.rank} className={`flex items-center justify-between p-3 rounded-lg ${
                  player.name === 'You' ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{player.badge}</span>
                    <div>
                      <div className="font-medium">{player.name}</div>
                      <div className="text-sm text-muted-foreground">Level {player.level}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{player.xp.toLocaleString()} XP</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Gamification Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Achievement Notifications</div>
              <div className="text-sm text-muted-foreground">Get notified when you unlock achievements</div>
            </div>
            <Switch 
              checked={notifications} 
              onCheckedChange={setNotifications}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}