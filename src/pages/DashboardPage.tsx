import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';
import { format, isToday, startOfDay } from 'date-fns';

export function DashboardPage() {
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

  const today = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Good {format(today, 'a') === 'AM' ? 'morning' : 'evening'}! ✨
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's how you're doing today, {format(today, 'EEEE, MMMM do')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Habits</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.data?.habits?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              of {stats?.data?.habits?.total || 0} total
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.data?.habits?.completionRate ? `${stats.data.habits.completionRate}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">last week</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.data?.tasks?.overdue || 0}
            </div>
            <p className="text-xs text-muted-foreground">overdue tasks</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.data?.tasks?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              of {stats?.data?.tasks?.total || 0} total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Habits */}
        <Card>
          <CardHeader>
            <CardTitle>Your Habits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {habits?.data?.map((habit) => (
                <div key={habit.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{habit.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {habit.categories.map((category) => (
                        <Badge key={category.id} variant="secondary" className="text-xs">
                          {category.name}
                        </Badge>
                      ))}
                      {habit.type === 'quantitative' && (
                        <Badge variant="outline" className="text-xs">
                          Measurable
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {habit.schedule.type === 'daily' ? 'Daily' : 
                       habit.schedule.type === 'weekly' ? `${habit.schedule.frequency}x/week` :
                       'Custom schedule'}
                    </div>
                  </div>
                </div>
              ))}
              {!habits?.data?.length && (
                <p className="text-gray-500 text-center py-4">
                  No habits yet. Start building your first habit!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks?.data?.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{task.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={
                          task.priority === 'high' ? 'destructive' :
                          task.priority === 'medium' ? 'default' : 'secondary'
                        } 
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                      {task.isOverdue && (
                        <Badge variant="destructive" className="text-xs">
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {format(new Date(task.deadline), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
              ))}
              {!tasks?.data?.length && (
                <p className="text-gray-500 text-center py-4">
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