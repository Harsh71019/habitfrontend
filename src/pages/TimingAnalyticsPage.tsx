import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
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
  Clock,
  Calendar,
  Activity,
  LogIn,
  Zap,
  Target,
  Timer,
  BarChart3,
  Users,
  TrendingDown,
  AlertCircle,
  Lightbulb,
  Award
} from 'lucide-react';
import { api, type TimingAnalytics } from '@/lib/api';
import { format } from 'date-fns';

const chartConfig = {
  loginCount: {
    label: "Login Count",
    color: "#3b82f6",
  },
  completionCount: {
    label: "Habit Completions", 
    color: "#10b981",
  },
  sessionDuration: {
    label: "Session Duration (min)",
    color: "#f59e0b",
  },
  weekendCompletions: {
    label: "Weekend",
    color: "#8b5cf6",
  },
  weekdayCompletions: {
    label: "Weekday",
    color: "#06b6d4",
  },
  avgCompletions: {
    label: "Avg Completions",
    color: "#ef4444",
  }
} satisfies ChartConfig;

export function TimingAnalyticsPage() {
  const [dateRange, setDateRange] = useState<number>(30);

  const { data: timingData, isLoading } = useQuery({
    queryKey: ['timing-analytics', dateRange],
    queryFn: () => api.getTimingAnalytics({ days: dateRange }),
  });

  const { data: peakInsights } = useQuery({
    queryKey: ['peak-insights', dateRange],
    queryFn: () => api.getPeakPerformanceInsights({ days: dateRange }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Timing Analytics</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!timingData?.data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Timing Analytics</h1>
        <p className="text-muted-foreground">No timing data available yet. Complete some habits and log in regularly to see insights!</p>
      </div>
    );
  }

  const data = timingData.data;

  // Transform data for hourly login distribution chart
  const hourlyLoginData = Array.from({ length: 24 }, (_, hour) => {
    const loginData = data.loginPatterns.hourlyDistribution?.find((h: any) => h.hour === hour);
    const completionData = data.habitCompletionPatterns.hourlyDistribution?.find((h: any) => h.hour === hour);
    
    return {
      hour: `${hour}:00`,
      hourNumber: hour,
      loginCount: loginData?.count || 0,
      avgSessionDuration: loginData?.avgSessionDuration || 0,
      completionCount: completionData?.totalCompletions || 0,
      weekendCompletions: completionData?.weekendCompletions || 0,
      weekdayCompletions: completionData?.weekdayCompletions || 0
    };
  });

  // Transform data for daily patterns radar chart
  const dailyPatternsData = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, index) => {
    const loginData = data.loginPatterns.dailyDistribution?.find((d: any) => d.dayOfWeek === index);
    const completionData = data.habitCompletionPatterns.dailyDistribution?.find((d: any) => d.dayOfWeek === index);
    
    return {
      day: dayName.slice(0, 3),
      loginCount: loginData?.count || 0,
      completionCount: completionData?.totalCompletions || 0,
      avgCompletionHour: completionData?.avgCompletionHour || 12
    };
  });

  // Session duration vs completions data with safe fallbacks
  const sessionDurationData = (data.correlationInsights.sessionDurationVsCompletions || []).map(item => ({
    range: item.sessionDurationRange,
    avgCompletions: item.avgCompletions
  }));

  // Peak hours comparison data with safe fallbacks
  const loginPeak = data.loginPatterns.peakLoginHours?.[0] || { hour: 9, count: 0, percentage: 0 };
  const completionPeak = data.habitCompletionPatterns.peakCompletionHours?.[0] || { hour: 10, count: 0, percentage: 0 };
  
  const peakHoursData = [
    {
      type: 'Login Peak',
      hour: loginPeak.hour,
      count: loginPeak.count,
      percentage: loginPeak.percentage,
      fill: '#3b82f6'
    },
    {
      type: 'Completion Peak',
      hour: completionPeak.hour,
      count: completionPeak.count,
      percentage: completionPeak.percentage,
      fill: '#10b981'
    }
  ];

  // Most productive hours after login with safe fallbacks
  const productivityAfterLoginData = (data.correlationInsights.mostProductiveHoursAfterLogin || [])
    .slice(0, 6)
    .map(item => ({
      hoursAfter: `${item.hourAfterLogin}h after`,
      completionRate: item.completionRate
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timing Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Understand your usage patterns and optimize your productivity schedule
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={dateRange.toString()} onValueChange={(value) => setDateRange(parseInt(value))}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
            <LogIn className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalLogins}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.avgLoginsPerDay.toFixed(1)} per day
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
            <Clock className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.mostActiveHour}:00</div>
            <p className="text-xs text-muted-foreground">most active time</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Day</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.mostActiveDay}</div>
            <p className="text-xs text-muted-foreground">highest activity</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completions</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalCompletions}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.avgCompletionsPerDay.toFixed(1)} per day
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Activity Pattern - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            24-Hour Activity Pattern
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Login and habit completion patterns throughout the day
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <AreaChart data={hourlyLoginData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="fillLogins" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="fillCompletions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="hour"
                axisLine={false}
                tickLine={false}
                className="text-xs"
                tick={{ fontSize: 11 }}
                interval={1}
                label={{ value: 'Time of Day', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle' } }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                className="text-xs"
                tick={{ fontSize: 11 }}
                width={50}
                label={{ value: 'Activity Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
              />
              <ChartTooltip 
                content={<ChartTooltipContent 
                  className="bg-background border border-border shadow-lg"
                  formatter={(value, name, props) => [
                    `${value} ${name === 'loginCount' ? 'logins' : 'completions'}`,
                    name === 'loginCount' ? 'Login Count' : 'Habit Completions'
                  ]}
                  labelFormatter={(label) => `Time: ${label}`}
                />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="loginCount"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#fillLogins)"
                strokeWidth={2}
                name="Logins"
              />
              <Area
                type="monotone"
                dataKey="completionCount"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#fillCompletions)"
                strokeWidth={2}
                name="Completions"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Detailed Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Patterns - Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Weekly Activity Pattern
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Activity distribution across days of the week
            </p>
          </CardHeader>
          <CardContent className="p-6">
            <ChartContainer config={chartConfig} className="h-[400px] w-full [&_.recharts-surface]:!bg-transparent [&_svg]:!bg-transparent">
              <RadarChart data={dailyPatternsData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <PolarGrid className="stroke-muted" stroke="currentColor" strokeOpacity={0.2} />
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
                  content={<ChartTooltipContent 
                    className="bg-background border border-border shadow-lg"
                    formatter={(value, name) => [
                      `${value} ${name === 'loginCount' ? 'logins' : 'completions'}`,
                      name === 'loginCount' ? 'Login Activity' : 'Habit Completions'
                    ]}
                    labelFormatter={(label) => `${label}`}
                  />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Radar
                  dataKey="loginCount"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#3b82f6" }}
                  name="Login Activity"
                />
                <Radar
                  dataKey="completionCount"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#10b981" }}
                  name="Habit Completions"
                />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Session Duration vs Completions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Session Duration Impact
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              How session length affects habit completions
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <BarChart data={sessionDurationData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="range"
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Session Duration', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle' } }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                  width={50}
                  label={{ value: 'Avg Completions', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    className="bg-background border border-border shadow-lg"
                    formatter={(value, name) => [
                      `${(value as number).toFixed(1)} completions`,
                      'Average Habit Completions'
                    ]}
                    labelFormatter={(label) => `Session Length: ${label}`}
                  />}
                />
                <Bar
                  dataKey="avgCompletions"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList 
                    dataKey="avgCompletions" 
                    position="top" 
                    formatter={(value: number) => value.toFixed(1)}
                    className="text-xs font-medium"
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Peak Hours Distribution - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Peak Activity Hours
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribution of your most active times
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <PieChart>
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    className="bg-background border border-border shadow-lg"
                    formatter={(value, name) => [
                      `${value} activities (${((value as number / peakHoursData.reduce((sum, item) => sum + item.count, 0)) * 100).toFixed(1)}%)`,
                      name
                    ]}
                  />}
                />
                <Pie
                  data={peakHoursData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, hour, percentage }) => 
                    `${type}: ${hour}:00 (${percentage}%)`
                  }
                  outerRadius={120}
                  paddingAngle={3}
                  dataKey="count"
                  className="text-xs font-medium"
                >
                  {peakHoursData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fill}
                      stroke="var(--background)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours Comparison - Radial Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Peak Hours Comparison
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Login vs completion peak times visualization
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="40%"
                outerRadius="80%"
                data={peakHoursData}
                startAngle={90}
                endAngle={450}
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              >
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    className="bg-background border border-border shadow-lg"
                    formatter={(value, name, props) => [
                      `${value} events at ${props.payload.hour}:00 (${props.payload.percentage}%)`,
                      props.payload.type
                    ]}
                  />}
                />
                <RadialBar
                  dataKey="percentage"
                  cornerRadius={5}
                  fill={(entry) => entry.fill}
                >
                  <LabelList 
                    dataKey="hour"
                    position="center"
                    formatter={(value: number) => `${value}:00`}
                    className="text-sm font-bold"
                  />
                </RadialBar>
                <text
                  x="50%"
                  y="45%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-lg font-bold fill-foreground"
                >
                  Peak Hours
                </text>
                <text
                  x="50%"
                  y="55%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs fill-muted-foreground"
                >
                  Activity Analysis
                </text>
              </RadialBarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Productivity After Login */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Post-Login Productivity
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Habit completion rates by hours after login
            </p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={productivityAfterLoginData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="hoursAfter"
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Hours After Login', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle' } }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                  width={50}
                  label={{ value: 'Completion Rate', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    className="bg-background border border-border shadow-lg"
                    formatter={(value, name) => [
                      `${(value as number).toFixed(1)} completions/session`,
                      'Productivity Rate'
                    ]}
                    labelFormatter={(label) => `${label}`}
                  />}
                />
                <Line
                  type="monotone"
                  dataKey="completionRate"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ r: 6, fill: "#ef4444" }}
                  activeDot={{ r: 8, fill: "#ef4444", stroke: "#ef4444", strokeWidth: 2 }}
                >
                  <LabelList 
                    dataKey="completionRate" 
                    position="top" 
                    formatter={(value: number) => value.toFixed(1)}
                    className="text-xs font-medium"
                  />
                </Line>
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Timing Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Login Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              Login Frequency by Hour
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              When you typically start your day
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hourlyLoginData.slice(6, 23).map((hour, index) => {
                const maxLogins = Math.max(...hourlyLoginData.map((h: any) => h.loginCount));
                const intensity = maxLogins > 0 ? hour.loginCount / maxLogins : 0;
                return (
                  <div key={hour.hour} className="flex items-center justify-between">
                    <span className="text-sm font-medium w-16">{hour.hour}</span>
                    <div className="flex-1 mx-3">
                      <div className="h-4 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                          style={{ width: `${intensity * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {hour.loginCount}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Completion Frequency by Hour */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Completion Frequency by Hour
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              When you complete most habits
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hourlyLoginData.slice(6, 23).map((hour, index) => {
                const maxCompletions = Math.max(...hourlyLoginData.map((h: any) => h.completionCount));
                const intensity = maxCompletions > 0 ? hour.completionCount / maxCompletions : 0;
                return (
                  <div key={hour.hour} className="flex items-center justify-between">
                    <span className="text-sm font-medium w-16">{hour.hour}</span>
                    <div className="flex-1 mx-3">
                      <div className="h-4 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-300"
                          style={{ width: `${intensity * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {hour.completionCount}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Performance Metrics
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Key behavioral insights
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Login Consistency</span>
                  <span className="text-lg font-bold text-blue-600">
                    {((data.summary.totalLogins / dateRange) * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Daily login rate over {dateRange} days
                </p>
              </div>

              <div className="p-3 border rounded-lg bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completion Rate</span>
                  <span className="text-lg font-bold text-green-600">
                    {data.summary.avgCompletionsPerDay.toFixed(1)}/day
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average habits completed daily
                </p>
              </div>

              <div className="p-3 border rounded-lg bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Peak Activity</span>
                  <span className="text-lg font-bold text-orange-600">
                    {data.summary.mostActiveHour}:00
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Most productive hour of day
                </p>
              </div>

              <div className="p-3 border rounded-lg bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Best Day</span>
                  <span className="text-lg font-bold text-purple-600">
                    {data.summary.mostActiveDay}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Highest activity day of week
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights and Recommendations */}
      {peakInsights?.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Smart Recommendations & Correlations
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Actionable insights based on your timing patterns
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Recommendations
                </h3>
                {peakInsights.data.recommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                    <div className="flex items-start gap-3">
                      <Award className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">{recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Usage Patterns
                </h3>
                
                <div className="p-4 border rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
                  <div className="flex items-center gap-2 mb-2">
                    <LogIn className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-emerald-700 dark:text-emerald-300">Login Pattern</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Peak at <strong>{peakInsights.data.peakLoginHour?.hour || 'N/A'}:00</strong> with {peakInsights.data.peakLoginHour?.count || 0} logins ({peakInsights.data.peakLoginHour?.percentage || 0}% of total)
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-cyan-600" />
                    <span className="font-medium text-cyan-700 dark:text-cyan-300">Completion Pattern</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Peak at <strong>{peakInsights.data.peakCompletionHour?.hour || 'N/A'}:00</strong> with {peakInsights.data.peakCompletionHour?.count || 0} completions ({peakInsights.data.peakCompletionHour?.percentage || 0}% of total)
                  </p>
                </div>

                <div className="p-4 border rounded-lg bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-orange-700 dark:text-orange-300">Optimal Timing</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Best productivity <strong>{peakInsights.data.mostProductiveHoursAfterLogin[0]?.hourAfterLogin || 2} hours</strong> after login with {peakInsights.data.mostProductiveHoursAfterLogin[0]?.completionRate?.toFixed(1) || '0.0'} avg completions
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}