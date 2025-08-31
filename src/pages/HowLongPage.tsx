import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Calendar,
  Gift,
  Target,
  Trophy,
  AlertTriangle,
  Heart,
  Timer,
  User,
  Plus
} from 'lucide-react';
import { api, type CountdownTask } from '@/lib/api';
import { format, isToday, isTomorrow } from 'date-fns';
import { CreateCountdownDialog } from '@/components/countdown/CreateCountdownDialog';

interface CountdownItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  daysRemaining: number;
  targetDate: Date;
  color: string;
  type: 'task' | 'birthday' | 'special';
}

export function HowLongPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch countdown data from dedicated how-long endpoints
  const { data: countdownData, isLoading: countdownLoading } = useQuery({
    queryKey: ['countdown-data'],
    queryFn: () => api.getCountdownData()
  });

  const { data: appUsageData, isLoading: usageLoading } = useQuery({
    queryKey: ['app-usage-stats'],
    queryFn: () => api.getAppUsageStats()
  });

  const { data: dailyTaskOverview } = useQuery({
    queryKey: ['daily-task-overview'],
    queryFn: () => api.getDailyTaskOverview()
  });

  // Convert backend countdown tasks to display format
  const getCountdownItems = (): CountdownItem[] => {
    const items: CountdownItem[] = [];

    // Add current date
    items.push({
      id: 'today',
      title: 'Weekend',
      icon: <Calendar className="w-6 h-6" />,
      daysRemaining: 0,
      targetDate: new Date(),
      color: 'from-blue-500 to-cyan-500',
      type: 'special'
    });

    if (countdownData?.data) {
      // Add upcoming tasks
      countdownData.data.upcoming.forEach(task => {
        let color = 'from-green-500 to-emerald-500';
        if (task.timeRemaining.days <= 1) color = 'from-red-500 to-pink-500';
        else if (task.timeRemaining.days <= 7) color = 'from-orange-500 to-yellow-500';
        else if (task.timeRemaining.days <= 30) color = 'from-blue-500 to-indigo-500';

        items.push({
          id: task.id,
          title: task.title,
          icon: task.isBirthday ? <Gift className="w-6 h-6" /> : <Target className="w-6 h-6" />,
          daysRemaining: task.timeRemaining.days,
          targetDate: new Date(task.deadline),
          color,
          type: task.isBirthday ? 'birthday' : 'task'
        });
      });

      // Add overdue tasks
      countdownData.data.overdue.forEach(task => {
        items.push({
          id: task.id,
          title: task.title,
          icon: <AlertTriangle className="w-6 h-6" />,
          daysRemaining: 0, // Will show as overdue
          targetDate: new Date(task.deadline),
          color: 'from-red-600 to-red-500',
          type: 'task'
        });
      });

      // Add birthdays
      countdownData.data.birthdays.forEach(task => {
        items.push({
          id: task.id,
          title: task.title,
          icon: <Gift className="w-6 h-6" />,
          daysRemaining: task.timeRemaining.days,
          targetDate: new Date(task.deadline),
          color: 'from-pink-500 to-purple-500',
          type: 'birthday'
        });
      });
    }

    // Add New Year countdown
    const now = new Date();
    const newYear = new Date(now.getFullYear() + 1, 0, 1);
    const newYearDays = Math.ceil((newYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    items.push({
      id: 'new-year',
      title: "New Year's Day",
      icon: <Trophy className="w-6 h-6" />,
      daysRemaining: newYearDays,
      targetDate: newYear,
      color: 'from-purple-500 to-pink-500',
      type: 'special'
    });

    return items;
  };

  const countdownItems = getCountdownItems();

  if (countdownLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Countdown</h1>
          <p className="text-muted-foreground">Time remaining for your important dates</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Countdown
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {countdownItems.map((item) => (
          <Card key={item.id} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground truncate">
                    {item.title}
                  </CardTitle>
                </div>
                {item.type === 'birthday' && (
                  <Badge variant="secondary" className="text-xs">
                    🎂
                  </Badge>
                )}
                {item.type === 'task' && item.daysRemaining <= 1 && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Urgent
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-center">
                <div className={`text-4xl font-bold mb-1 ${
                  item.daysRemaining === 0 ? 'text-green-500' :
                  item.daysRemaining <= 1 ? 'text-red-500' :
                  item.daysRemaining <= 7 ? 'text-orange-500' :
                  'text-blue-500'
                }`}>
                  {item.daysRemaining === 0 ? 'Today' : item.daysRemaining}
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {item.daysRemaining === 0 ? format(item.targetDate, 'dd/MM/yy') : 
                   `${item.daysRemaining === 1 ? 'Day until' : 'Days until'} ${format(item.targetDate, 'dd/MM/yy')}`}
                </div>
                {item.daysRemaining > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {format(item.targetDate, 'EEEE')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily Tasks Overview */}
      {dailyTaskOverview?.data && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Daily Tasks Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-500">{dailyTaskOverview.data.totalCreated}</div>
                <div className="text-xs text-muted-foreground">Total Created</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">{dailyTaskOverview.data.totalActive}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-500">{dailyTaskOverview.data.todayCompleted}</div>
                <div className="text-xs text-muted-foreground">Today Completed</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-500">{dailyTaskOverview.data.thisMonthCompleted}</div>
                <div className="text-xs text-muted-foreground">This Month</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-500">{dailyTaskOverview.data.totalArchived}</div>
                <div className="text-xs text-muted-foreground">Archived</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-cyan-500">
                  {dailyTaskOverview.data.totalActive > 0 
                    ? Math.round((dailyTaskOverview.data.todayCompleted / dailyTaskOverview.data.totalActive) * 100) 
                    : 0}%
                </div>
                <div className="text-xs text-muted-foreground">Today Rate</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Create Countdown Dialog */}
      <CreateCountdownDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}