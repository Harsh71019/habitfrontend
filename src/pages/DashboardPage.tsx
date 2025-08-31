import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HabitHeatmap } from '@/components/dashboard/HabitHeatmap';
import { HabitDailyGoals } from '@/components/dashboard/HabitDailyGoals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  CheckCircle,
  Clock,
  TrendingUp,
  Trophy,
  Activity,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const chartConfig = {
  completions: {
    label: 'Completions',
    color: '#3b82f6',
  },
  rate: {
    label: 'Completion Rate',
    color: '#10b981',
  },
  habits: {
    label: 'Habits',
    color: '#8b5cf6',
  },
} satisfies ChartConfig;

export function DashboardPage() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    format(today, 'yyyy-MM')
  );

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.getStats(),
  });

  const { data: habits } = useQuery({
    queryKey: ['habits'],
    queryFn: () => api.getHabits({ limit: 5 }),
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.getTasks({ limit: 5, completed: false }),
  });

  const { data: insights } = useQuery({
    queryKey: ['productivity-insights', '7days'],
    queryFn: () => api.getProductivityInsights({ period: '7days' }),
  });


  const { data: streakData } = useQuery({
    queryKey: ['user-streaks'],
    queryFn: () => api.getAllUserStreaks(),
  });

  const { data: todayCompletions } = useQuery({
    queryKey: ['today-completions', format(today, 'yyyy-MM-dd')],
    queryFn: () => api.getHabitCompletions(format(today, 'yyyy-MM-dd')),
  });

  const selectedDate = new Date(selectedMonth);
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate calendar layout with proper week alignment
  const firstDayOfWeek = monthStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const startFromMonday = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Convert to Monday = 0
  const totalCells = Math.ceil((monthDays.length + startFromMonday) / 7) * 7;

  // Helper function to get streak data for a habit
  const getHabitStreakData = (habitId: string) => {
    const streak = streakData?.data?.find((s) => s.habitId === habitId);
    return {
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      completedCount: 0, // Will need to calculate from completions
    };
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>
          Good {format(today, 'a') === 'AM' ? 'morning' : 'evening'}! ✨
        </h1>
        <p className='text-muted-foreground mt-1'>
          Here's how you're doing today, {format(today, 'EEEE, MMMM do')}
        </p>
      </div>

      {/* Habit Heatmaps and Daily Goals - Side by Side */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {habits?.data?.slice(0, 1).map((habit) => (
          <HabitHeatmap
            key={habit.id}
            habit={habit}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            getHabitStreakData={getHabitStreakData}
          />
        ))}

        {habits?.data?.slice(0, 1).map((habit) => (
          <HabitDailyGoals
            key={`daily-${habit.id}`}
            habit={habit}
            getHabitStreakData={getHabitStreakData}
          />
        ))}
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card className='transition-all duration-300 hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Habits</CardTitle>
            <Target className='h-4 w-4 text-blue-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {stats?.data?.habits?.active || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              of {stats?.data?.habits?.total || 0} total
            </p>
          </CardContent>
        </Card>

        <Card className='transition-all duration-300 hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Completion Rate
            </CardTitle>
            <TrendingUp className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {stats?.data?.habits?.completionRate
                ? `${stats.data.habits.completionRate}%`
                : '0%'}
            </div>
            <p className='text-xs text-muted-foreground'>last week</p>
          </CardContent>
        </Card>

        <Card className='transition-all duration-300 hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Overdue Tasks</CardTitle>
            <Clock className='h-4 w-4 text-orange-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {stats?.data?.tasks?.overdue || 0}
            </div>
            <p className='text-xs text-muted-foreground'>overdue tasks</p>
          </CardContent>
        </Card>

        <Card className='transition-all duration-300 hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Completed Tasks
            </CardTitle>
            <CheckCircle className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {stats?.data?.tasks?.completed || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              of {stats?.data?.tasks?.total || 0} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Score and Productivity Section */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Overview Stats */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-6'>
              <div className='text-center'>
                <div className='text-4xl font-bold text-blue-500'>
                  {todayCompletions?.data?.filter(completion => completion.completed).length || 0}
                </div>
                <div className='text-sm text-muted-foreground'>
                  Today's Completions
                </div>
              </div>

              <div className='text-center'>
                <div className='text-4xl font-bold text-blue-500'>
                  {habits?.data?.length || 0}
                </div>
                <div className='text-sm text-muted-foreground'>
                  Total Habits
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievement Score */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Trophy className='w-5 h-5' />
              My Achievement Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='relative'>
              <div className='text-center mb-4'>
                <div className='text-5xl font-bold text-emerald-500'>
                  {insights?.data?.performance?.consistencyScore || 74}
                </div>
                <div className='text-orange-500 text-right text-sm mt-2'>
                  You are more productive than{' '}
                  <span className='font-bold'>95%</span>
                </div>
              </div>

              {/* Simple progress chart placeholder */}
              <div className='h-24 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-end justify-center relative overflow-hidden'>
                <div className='absolute inset-x-0 bottom-0 h-3 bg-blue-400 rounded-b-lg'></div>
                <div className='text-xs text-blue-700 absolute bottom-1 left-2'>
                  Last 7 days
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Completion Rate Curve */}
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>
              Recent Completion Rate Curve
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insights?.data?.daily && (
              <ChartContainer config={chartConfig} className='h-32 w-full'>
                <AreaChart
                  data={insights.data.daily.slice(-7).map((day) => ({
                    date: format(new Date(day.date), 'dd'),
                    rate: Math.round(
                      (day.habitCompletions / Math.max(1, day.totalActions)) *
                        100
                    ),
                  }))}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id='fillRate' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#3b82f6' stopOpacity={0.8} />
                      <stop
                        offset='95%'
                        stopColor='#3b82f6'
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey='date'
                    axisLine={false}
                    tickLine={false}
                    className='text-xs'
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis hide />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value) => [`${value}%`, 'Completion Rate']}
                  />
                  <Area
                    type='monotone'
                    dataKey='rate'
                    stroke='#3b82f6'
                    fillOpacity={1}
                    fill='url(#fillRate)'
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Completion Trends Charts */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Recent Completion Curve */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='w-5 h-5' />
              Recent Completion Curve
            </CardTitle>
            <div className='flex gap-2'>
              <Badge variant='outline' className='text-xs'>
                Day
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {insights?.data?.daily && (
              <ChartContainer config={chartConfig} className='h-[200px] w-full'>
                <LineChart
                  data={insights.data.daily.slice(-7).map((day) => ({
                    date: format(new Date(day.date), 'dd'),
                    completions: day.habitCompletions,
                  }))}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray='3 3'
                    className='stroke-muted'
                  />
                  <XAxis
                    dataKey='date'
                    axisLine={false}
                    tickLine={false}
                    className='text-xs'
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    className='text-xs'
                    tick={{ fontSize: 11 }}
                    width={30}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value) => [`${value}`, 'Completions']}
                  />
                  <Line
                    type='monotone'
                    dataKey='completions'
                    stroke='#3b82f6'
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#3b82f6' }}
                    activeDot={{ r: 6, fill: '#3b82f6' }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Completion Rate Curve */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Activity className='w-5 h-5' />
              Recent Completion Rate Curve
            </CardTitle>
            <div className='flex gap-2'>
              <Badge variant='outline' className='text-xs'>
                Day
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {insights?.data?.daily && (
              <ChartContainer config={chartConfig} className='h-[200px] w-full'>
                <AreaChart
                  data={insights.data.daily.slice(-7).map((day) => ({
                    date: format(new Date(day.date), 'dd'),
                    rate: Math.round(
                      (day.habitCompletions / Math.max(1, day.totalActions)) *
                        100
                    ),
                  }))}
                  margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                >
                  <defs>
                    <linearGradient
                      id='fillRateMain'
                      x1='0'
                      y1='0'
                      x2='0'
                      y2='1'
                    >
                      <stop offset='5%' stopColor='#3b82f6' stopOpacity={0.8} />
                      <stop
                        offset='95%'
                        stopColor='#3b82f6'
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray='3 3'
                    className='stroke-muted'
                  />
                  <XAxis
                    dataKey='date'
                    axisLine={false}
                    tickLine={false}
                    className='text-xs'
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    className='text-xs'
                    tick={{ fontSize: 11 }}
                    width={30}
                    domain={[0, 100]}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value) => [`${value}%`, 'Completion Rate']}
                  />
                  <Area
                    type='monotone'
                    dataKey='rate'
                    stroke='#3b82f6'
                    fillOpacity={1}
                    fill='url(#fillRateMain)'
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>


      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {tasks?.data?.map((task) => (
                <div
                  key={task.id}
                  className='flex items-center justify-between p-3 border rounded-lg'
                >
                  <div>
                    <h3 className='font-medium'>{task.title}</h3>
                    <div className='flex items-center gap-2 mt-1'>
                      <Badge
                        variant={
                          task.priority === 'high'
                            ? 'destructive'
                            : task.priority === 'medium'
                            ? 'default'
                            : 'secondary'
                        }
                        className='text-xs'
                      >
                        {task.priority}
                      </Badge>
                      {task.isOverdue && (
                        <Badge variant='destructive' className='text-xs'>
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-sm text-gray-600'>
                      {format(new Date(task.deadline), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
              ))}
              {!tasks?.data?.length && (
                <p className='text-gray-500 text-center py-4'>
                  All caught up! No pending tasks.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
