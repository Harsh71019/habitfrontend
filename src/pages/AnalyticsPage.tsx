import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Pie,
  PieChart,
  Cell,
  Label,
  LabelList,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  Target,
  Calendar,
  Trophy,
  Activity,
  CheckCircle,
  Award,
  Flame,
  BarChart3,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { format, parseISO } from 'date-fns';

const chartConfig = {
  habitCompletions: {
    label: 'Habit Completions',
    color: '#2563eb',
  },
  taskCompletions: {
    label: 'Task Completions',
    color: '#0891b2',
  },
  productivity: {
    label: 'Productivity Score',
    color: '#0d9488',
  },
  momentum: {
    label: 'Momentum',
    color: '#7c3aed',
  },
  consistency: {
    label: 'Consistency',
    color: '#dc2626',
  },
  performance: {
    label: 'Performance',
    color: '#ea580c',
  },
  engagement: {
    label: 'Engagement',
    color: '#16a34a',
  },
} satisfies ChartConfig;

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<
    '7days' | '30days' | '90days' | '1year'
  >('30days');

  const { data: insights, isLoading } = useQuery({
    queryKey: ['productivity-insights', dateRange],
    queryFn: () => api.getProductivityInsights({ period: dateRange }),
  });

  const { data: dailyTaskAnalytics, isLoading: dailyTaskLoading } = useQuery({
    queryKey: ['daily-task-analytics'],
    queryFn: () => api.getDailyTaskAnalytics(),
  });

  if (isLoading || dailyTaskLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-3xl font-bold'>Analytics</h1>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {[...Array(8)].map((_, i) => (
            <div key={i} className='h-32 bg-muted animate-pulse rounded-lg' />
          ))}
        </div>
      </div>
    );
  }

  if (!insights?.data) {
    return (
      <div className='space-y-6'>
        <h1 className='text-3xl font-bold'>Analytics</h1>
        <p className='text-muted-foreground'>
          No data available yet. Start completing habits and tasks to see
          insights!
        </p>
      </div>
    );
  }

  const data = insights.data;

  // Transform data for charts with proper colors
  const dailyData = data.daily.map((day) => ({
    date: format(parseISO(day.date), 'MMM d'),
    habitCompletions: day.habitCompletions,
    taskCompletions: day.taskCompletions,
    productivity: day.productivity,
    momentum: day.momentum,
    totalActions: day.totalActions,
  }));

  // Daily task analytics data
  const dailyTaskData = dailyTaskAnalytics?.data;
  
  // Transform daily task completion trends
  const dailyTaskTrendsData = dailyTaskData?.completionTrends?.map((trend) => ({
    date: format(parseISO(trend.date), 'MMM d'),
    completions: trend.completions,
  })) || [];

  // Transform weekly patterns for daily tasks
  const dailyTaskWeeklyData = dailyTaskData?.weeklyPatterns?.map((pattern) => ({
    day: pattern.day.substring(0, 3),
    completions: pattern.completions,
    fullMark: Math.max(...(dailyTaskData?.weeklyPatterns?.map(p => p.completions) || [1])),
  })) || [];

  // Weekly patterns data for radar chart
  const weeklyData = [
    {
      day: 'Mon',
      value: data.weeklyPatterns.monday,
      fullMark: Math.max(...Object.values(data.weeklyPatterns)),
    },
    {
      day: 'Tue',
      value: data.weeklyPatterns.tuesday,
      fullMark: Math.max(...Object.values(data.weeklyPatterns)),
    },
    {
      day: 'Wed',
      value: data.weeklyPatterns.wednesday,
      fullMark: Math.max(...Object.values(data.weeklyPatterns)),
    },
    {
      day: 'Thu',
      value: data.weeklyPatterns.thursday,
      fullMark: Math.max(...Object.values(data.weeklyPatterns)),
    },
    {
      day: 'Fri',
      value: data.weeklyPatterns.friday,
      fullMark: Math.max(...Object.values(data.weeklyPatterns)),
    },
    {
      day: 'Sat',
      value: data.weeklyPatterns.saturday,
      fullMark: Math.max(...Object.values(data.weeklyPatterns)),
    },
    {
      day: 'Sun',
      value: data.weeklyPatterns.sunday,
      fullMark: Math.max(...Object.values(data.weeklyPatterns)),
    },
  ];

  // Radial progress data
  const radialData = [
    {
      name: 'Habits',
      value: Math.round(
        (data.performance.avgDailyCompletions /
          Math.max(
            1,
            data.categories.reduce((sum, cat) => sum + cat.habitCount, 0)
          )) *
          100
      ),
      fill: '#2563eb',
    },
    {
      name: 'Tasks',
      value: Math.round(
        (data.performance.avgDailyTasks /
          Math.max(
            1,
            data.categories.reduce((sum, cat) => sum + cat.taskCount, 0)
          )) *
          100
      ),
      fill: '#0891b2',
    },
    {
      name: 'Consistency',
      value: data.performance.consistencyScore,
      fill: '#0d9488',
    },
  ];

  // Category pie chart data
  const categoryData = data.categories.map((cat) => ({
    name: cat.name,
    value: cat.totalItems,
    score: cat.overallScore,
    fill: cat.color || `hsl(${Math.random() * 360}, 70%, 50%)`,
  }));

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Analytics</h1>
          <p className='text-muted-foreground mt-1'>
            Detailed insights into your productivity patterns
          </p>
        </div>

        <div className='flex items-center gap-4'>
          <Select
            value={dateRange}
            onValueChange={(value: any) => setDateRange(value)}
          >
            <SelectTrigger className='w-[140px]'>
              <Calendar className='w-4 h-4 mr-2' />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='7days'>Last 7 days</SelectItem>
              <SelectItem value='30days'>Last 30 days</SelectItem>
              <SelectItem value='90days'>Last 90 days</SelectItem>
              <SelectItem value='1year'>Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='transition-all duration-300 hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Actions</CardTitle>
            <Activity className='h-4 w-4 text-blue-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {data.performance.totalActiveDays}
            </div>
            <p className='text-xs text-muted-foreground flex items-center'>
              <TrendingUp className='w-3 h-3 mr-1' />
              Active days
            </p>
          </CardContent>
        </Card>

        <Card className='transition-all duration-300 hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Consistency</CardTitle>
            <Target className='h-4 w-4 text-emerald-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {data.performance.consistencyScore}%
            </div>
            <p className='text-xs text-muted-foreground'>daily habits</p>
          </CardContent>
        </Card>

        <Card className='transition-all duration-300 hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Best Day</CardTitle>
            <Trophy className='h-4 w-4 text-yellow-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {data.insights.mostProductiveDay.day}
            </div>
            <p className='text-xs text-muted-foreground'>
              {data.insights.mostProductiveDay.actions} actions
            </p>
          </CardContent>
        </Card>

        <Card className='transition-all duration-300 hover:shadow-lg hover:-translate-y-1'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Peak Score</CardTitle>
            <Zap className='h-4 w-4 text-orange-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {data.performance.bestPerformanceScore}
            </div>
            <p className='text-xs text-muted-foreground'>
              {format(parseISO(data.performance.bestPerformanceDay), 'MMM d')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Activity - Full Width Chart */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='w-5 h-5' />
            Daily Activity
          </CardTitle>
          <p className='text-sm text-muted-foreground'>
            Trending up by 5.2% this month
          </p>
        </CardHeader>
        <CardContent className='p-6'>
          <ChartContainer config={chartConfig} className='h-[400px] w-full'>
            <AreaChart
              data={dailyData}
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            >
              <defs>
                <linearGradient id='fillHabits' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='#2563eb' stopOpacity={0.8} />
                  <stop offset='95%' stopColor='#2563eb' stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id='fillTasks' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='#0891b2' stopOpacity={0.8} />
                  <stop offset='95%' stopColor='#0891b2' stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
              <XAxis
                dataKey='date'
                axisLine={false}
                tickLine={false}
                className='text-xs'
                tick={{ fontSize: 11 }}
                interval='preserveStartEnd'
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                className='text-xs'
                tick={{ fontSize: 11 }}
                width={40}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent className='bg-background border border-border shadow-lg' />
                }
              />
              <Area
                type='monotone'
                dataKey='habitCompletions'
                stroke='#2563eb'
                fillOpacity={1}
                fill='url(#fillHabits)'
                strokeWidth={2}
              />
              <Area
                type='monotone'
                dataKey='taskCompletions'
                stroke='#0891b2'
                fillOpacity={1}
                fill='url(#fillTasks)'
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Secondary Charts Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Weekly Patterns - Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Target className='w-5 h-5' />
              Weekly Patterns
            </CardTitle>
            <p className='text-sm text-muted-foreground'>
              Activity by day of week
            </p>
          </CardHeader>
          <CardContent className='p-6'>
            <ChartContainer
              config={chartConfig}
              className='h-[400px] w-full [&_.recharts-surface]:!bg-transparent [&_svg]:!bg-transparent'
            >
              <RadarChart
                data={weeklyData}
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              >
                <PolarGrid
                  className='stroke-muted'
                  stroke='currentColor'
                  strokeOpacity={0.2}
                />
                <PolarAngleAxis
                  dataKey='day'
                  className='text-xs fill-foreground'
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 'dataMax']}
                  tick={false}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent className='bg-background border border-border shadow-lg' />
                  }
                />
                <Radar
                  dataKey='value'
                  stroke='#2563eb'
                  fill='#2563eb'
                  fillOpacity={0.3}
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#2563eb' }}
                />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Progress Overview - Radial Chart */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CheckCircle className='w-5 h-5' />
              Progress Overview
            </CardTitle>
            <p className='text-sm text-muted-foreground'>
              Completion rates by type
            </p>
          </CardHeader>
          <CardContent className='p-6'>
            <ChartContainer config={chartConfig} className='h-[400px] w-full'>
              <RadialBarChart
                cx='50%'
                cy='50%'
                innerRadius='30%'
                outerRadius='70%'
                data={radialData}
                startAngle={90}
                endAngle={450}
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              >
                <ChartTooltip
                  content={
                    <ChartTooltipContent className='bg-background border border-border shadow-lg' />
                  }
                />
                <RadialBar
                  dataKey='value'
                  cornerRadius={10}
                  fill={(entry) => entry.fill}
                />
                <text
                  x='50%'
                  y='50%'
                  textAnchor='middle'
                  dominantBaseline='middle'
                  className='text-2xl font-bold fill-foreground'
                >
                  {Math.round(
                    radialData.reduce((sum, item) => sum + item.value, 0) /
                      radialData.length
                  )}
                  %
                </text>
                <text
                  x='50%'
                  y='50%'
                  dy={20}
                  textAnchor='middle'
                  dominantBaseline='middle'
                  className='text-xs fill-muted-foreground'
                >
                  Average
                </text>
              </RadialBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Category Distribution - Enhanced Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BarChart3 className='w-5 h-5' />
              Category Distribution
            </CardTitle>
            <p className='text-sm text-muted-foreground'>Items by category</p>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ChartContainer config={chartConfig} className='h-[400px] w-full'>
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent className='bg-background border border-border shadow-lg' />
                    }
                    formatter={(value, name) => [
                      `${value} items (${Math.round(
                        ((value as number) /
                          categoryData.reduce(
                            (sum, cat) => sum + cat.value,
                            0
                          )) *
                          100
                      )}%)`,
                      name,
                    ]}
                  />
                  <Pie
                    data={categoryData}
                    cx='50%'
                    cy='50%'
                    labelLine={false}
                    label={({ name, value, percent }) => 
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey='value'
                    className='text-xs font-medium'
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.fill}
                        stroke='var(--background)'
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : (
              <div className='text-center py-12 text-muted-foreground'>
                No categories to display
              </div>
            )}
          </CardContent>
        </Card>

        {/* Productivity Trends - Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='w-5 h-5' />
              Productivity Trends
            </CardTitle>
            <p className='text-sm text-muted-foreground'>
              Daily productivity and momentum
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className='h-[400px] w-full'>
              <LineChart
                data={dailyData}
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                <XAxis
                  dataKey='date'
                  axisLine={false}
                  tickLine={false}
                  className='text-xs'
                  tick={{ fontSize: 11 }}
                  interval='preserveStartEnd'
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  className='text-xs'
                  tick={{ fontSize: 11 }}
                  width={40}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent className='bg-background border border-border shadow-lg' />
                  }
                />
                <Line
                  type='monotone'
                  dataKey='productivity'
                  stroke='#0d9488'
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0d9488' }}
                  activeDot={{
                    r: 6,
                    fill: '#0d9488',
                    stroke: '#0d9488',
                    strokeWidth: 2,
                  }}
                />
                <Line
                  type='monotone'
                  dataKey='momentum'
                  stroke='#7c3aed'
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#7c3aed' }}
                  activeDot={{
                    r: 6,
                    fill: '#7c3aed',
                    stroke: '#7c3aed',
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Award className='w-5 h-5' />
              Top Performing Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {data.categories.slice(0, 5).map((category, index) => (
                <div
                  key={category.id}
                  className='flex items-center justify-between p-3 border rounded-lg'
                >
                  <div className='flex items-center gap-3'>
                    <div
                      className='w-4 h-4 rounded-full'
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <h3 className='font-medium'>{category.name}</h3>
                      <p className='text-xs text-muted-foreground'>
                        {category.habitCount} habits • {category.taskCount}{' '}
                        tasks
                      </p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-lg font-bold text-blue-600'>
                      {category.overallScore}%
                    </div>
                    <div className='text-xs text-muted-foreground'>score</div>
                  </div>
                </div>
              ))}
              {data.categories.length === 0 && (
                <p className='text-center py-8 text-muted-foreground'>
                  No categories created yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Insights Summary */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Flame className='w-5 h-5' />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20'>
                <div className='flex items-center gap-2 mb-2'>
                  <Calendar className='w-4 h-4 text-blue-600' />
                  <span className='font-medium text-blue-700 dark:text-blue-300'>
                    Most Productive Day
                  </span>
                </div>
                <p className='text-sm text-muted-foreground'>
                  You perform best on{' '}
                  <strong>{data.insights.mostProductiveDay.day}s</strong> with
                  an average of {data.insights.mostProductiveDay.actions}{' '}
                  completed actions.
                </p>
              </div>

              <div className='p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20'>
                <div className='flex items-center gap-2 mb-2'>
                  <TrendingUp className='w-4 h-4 text-green-600' />
                  <span className='font-medium text-green-700 dark:text-green-300'>
                    Weekend vs Weekday
                  </span>
                </div>
                <p className='text-sm text-muted-foreground'>
                  <strong>Weekdays:</strong>{' '}
                  {data.insights.weekendVsWeekday.weekday} actions •
                  <strong> Weekends:</strong>{' '}
                  {data.insights.weekendVsWeekday.weekend} actions
                </p>
              </div>

              <div className='p-4 border rounded-lg bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20'>
                <div className='flex items-center gap-2 mb-2'>
                  <Target className='w-4 h-4 text-orange-600' />
                  <span className='font-medium text-orange-700 dark:text-orange-300'>
                    Performance
                  </span>
                </div>
                <p className='text-sm text-muted-foreground'>
                  <strong>{data.performance.avgDailyCompletions}</strong>{' '}
                  habits/day •<strong>{data.performance.avgDailyTasks}</strong>{' '}
                  tasks/day average
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Tasks Analytics Section */}
      {dailyTaskData && (
        <>
          <div className="mt-8 mb-6">
            <h2 className="text-2xl font-bold">Daily Tasks Analytics</h2>
            <p className="text-muted-foreground">Insights into your daily task completion patterns</p>
          </div>

          {/* Daily Task Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <Target className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dailyTaskData.overview.totalTasks}</div>
                <p className="text-xs text-muted-foreground">created</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dailyTaskData.overview.activeTasks}</div>
                <p className="text-xs text-muted-foreground">current</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(dailyTaskData.overview.completionRate)}%</div>
                <p className="text-xs text-muted-foreground">last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Most Productive</CardTitle>
                <Trophy className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dailyTaskData.summary.mostProductiveDay}</div>
                <p className="text-xs text-muted-foreground">day of week</p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Task Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Task Completion Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Daily Task Completions
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Task completion trends over the last 30 days
                </p>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <LineChart
                    data={dailyTaskTrendsData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                      width={30}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent className="bg-background border border-border shadow-lg" />
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="completions"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#10b981" }}
                      activeDot={{
                        r: 6,
                        fill: "#10b981",
                        stroke: "#10b981",
                        strokeWidth: 2,
                      }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Daily Task Weekly Patterns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Weekly Task Patterns
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Task completions by day of week
                </p>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <RadarChart
                    data={dailyTaskWeeklyData}
                    margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                  >
                    <PolarGrid
                      className="stroke-muted"
                      stroke="currentColor"
                      strokeOpacity={0.2}
                    />
                    <PolarAngleAxis
                      dataKey="day"
                      className="text-xs fill-foreground"
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 'dataMax']}
                      tick={false}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent className="bg-background border border-border shadow-lg" />
                      }
                    />
                    <Radar
                      dataKey="completions"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#10b981" }}
                    />
                  </RadarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Tasks and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Top Performing Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Top Performing Daily Tasks
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Most frequently completed tasks
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dailyTaskData.topPerformingTasks.slice(0, 5).map((task, index) => (
                    <div
                      key={task._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-medium">{task.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            Priority: {task.priority}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {task.completions}
                        </div>
                        <div className="text-xs text-muted-foreground">completions</div>
                      </div>
                    </div>
                  ))}
                  {dailyTaskData.topPerformingTasks.length === 0 && (
                    <p className="text-center py-8 text-muted-foreground">
                      No completed tasks yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5" />
                  Recent Daily Task Activity
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Last 7 days completed tasks
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dailyTaskData.recentActivity.slice(0, 5).map((activity, index) => (
                    <div
                      key={`${activity._id}-${index}`}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <div>
                          <h3 className="font-medium">{activity.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(activity.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {activity.completedAt && format(parseISO(activity.completedAt), 'HH:mm')}
                      </div>
                    </div>
                  ))}
                  {dailyTaskData.recentActivity.length === 0 && (
                    <p className="text-center py-8 text-muted-foreground">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
