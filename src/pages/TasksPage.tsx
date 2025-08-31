import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Calendar,
  Clock,
  Timer,
  AlertTriangle,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { api, type Task } from '@/lib/api';
import { format } from 'date-fns';
import {
  calculateTimeRemaining,
  formatTimeRemaining,
  getTimeUrgencyColor,
  getUrgencyBadgeVariant,
} from '@/utils/timeUtils';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';

export function TasksPage() {
  const [filterPriority, setFilterPriority] = useState<
    'all' | 'low' | 'medium' | 'high'
  >('all');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'pending' | 'completed'
  >('pending');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const queryClient = useQueryClient();

  // Update time every second for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', filterPriority, filterStatus],
    queryFn: () =>
      api.getTasks({
        priority: filterPriority === 'all' ? undefined : filterPriority,
        completed:
          filterStatus === 'all' ? undefined : filterStatus === 'completed',
      }),
  });

  const toggleTaskMutation = useMutation({
    mutationFn: (taskId: string) => api.toggleTaskCompletion(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-3xl font-bold'>Tasks</h1>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {[...Array(6)].map((_, i) => (
            <div key={i} className='h-48 bg-muted animate-pulse rounded-lg' />
          ))}
        </div>
      </div>
    );
  }

  const allTasks = tasks?.data || [];
  const pendingTasks = allTasks.filter((task) => !task.completed);
  const completedTasks = allTasks.filter((task) => task.completed);

  // Sort pending tasks by time remaining (most urgent first)
  const sortedPendingTasks = pendingTasks.sort((a, b) => {
    const timeA = calculateTimeRemaining(a.deadline);
    const timeB = calculateTimeRemaining(b.deadline);

    // Overdue tasks come first
    if (timeA.isOverdue && !timeB.isOverdue) return -1;
    if (!timeA.isOverdue && timeB.isOverdue) return 1;
    if (timeA.isOverdue && timeB.isOverdue) return 0;

    // Then sort by total minutes remaining
    return timeA.totalMinutes - timeB.totalMinutes;
  });

  const overdueTasks = sortedPendingTasks.filter(
    (task) => calculateTimeRemaining(task.deadline).isOverdue
  );

  const TaskTimerCard = ({ task }: { task: Task }) => {
    const timeRemaining = calculateTimeRemaining(task.deadline);
    const urgencyColor = getTimeUrgencyColor(timeRemaining);
    const urgencyVariant = getUrgencyBadgeVariant(timeRemaining);

    return (
      <Card
        className={`transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
          timeRemaining.isOverdue
            ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20'
            : timeRemaining.totalMinutes <= 60
            ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
            : 'hover:bg-accent/50'
        }`}
      >
        <CardHeader className='pb-3'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center gap-2'>
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => toggleTaskMutation.mutate(task.id)}
                disabled={toggleTaskMutation.isPending}
              />
              <div className='flex items-center gap-2'>
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
              </div>
            </div>
            {timeRemaining.isOverdue && (
              <AlertTriangle className='w-4 h-4 text-red-500' />
            )}
          </div>
        </CardHeader>
        <CardContent className='pt-0'>
          {/* Timer Display - Large Font */}
          <div className='text-center mb-4'>
            <div
              className={`text-4xl font-mono font-bold ${urgencyColor} mb-1`}
            >
              {formatTimeRemaining(timeRemaining)}
            </div>
            <div className='flex items-center justify-center gap-1 text-xs text-muted-foreground'>
              <Timer className='w-3 h-3' />
              {timeRemaining.isOverdue ? 'Overdue' : 'remaining'}
            </div>
          </div>

          {/* Task Title */}
          <div className='space-y-2'>
            <h3 className='font-bold text-center text-lg leading-tight'>
              <span className='font-black'>{task.title.charAt(0)}</span>
              {task.title.slice(1)}
            </h3>

            {task.description && (
              <p className='text-sm text-muted-foreground text-center line-clamp-2'>
                {task.description}
              </p>
            )}

            {/* Deadline Info */}
            <div className='flex items-center justify-center gap-1 text-xs border-t pt-3'>
              <Calendar className='w-3 h-3 text-muted-foreground' />
              <span className='uppercase font-medium text-black dark:text-white'>
                Due {format(new Date(task.deadline), 'MMM d, yyyy • h:mm a')}
              </span>
            </div>

            {/* Categories */}
            {task.categories.length > 0 && (
              <div className='flex flex-wrap gap-1 justify-center'>
                {task.categories.map((category) => (
                  <div
                    key={category.id}
                    className='flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full'
                  >
                    <div
                      className='w-2 h-2 rounded-full'
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Tasks</h1>
          <p className='text-muted-foreground mt-1'>
            Track your tasks and deadlines with live timers
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className='w-4 h-4 mr-2' />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <Select
          value={filterStatus}
          onValueChange={(value: any) => setFilterStatus(value)}
        >
          <SelectTrigger className='w-[140px]'>
            <Filter className='w-4 h-4 mr-2' />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Tasks</SelectItem>
            <SelectItem value='pending'>Pending</SelectItem>
            <SelectItem value='completed'>Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filterPriority}
          onValueChange={(value: any) => setFilterPriority(value)}
        >
          <SelectTrigger className='w-[140px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Priority</SelectItem>
            <SelectItem value='high'>High Priority</SelectItem>
            <SelectItem value='medium'>Medium Priority</SelectItem>
            <SelectItem value='low'>Low Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-blue-600'>
              {pendingTasks.length}
            </div>
            <div className='text-sm text-muted-foreground'>Pending Tasks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-green-600'>
              {completedTasks.length}
            </div>
            <div className='text-sm text-muted-foreground'>Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-red-600'>
              {overdueTasks.length}
            </div>
            <div className='text-sm text-muted-foreground'>Overdue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='text-2xl font-bold text-orange-600'>
              {
                sortedPendingTasks.filter((task) => {
                  const time = calculateTimeRemaining(task.deadline);
                  return !time.isOverdue && time.totalMinutes <= 24 * 60;
                }).length
              }
            </div>
            <div className='text-sm text-muted-foreground'>Due Today</div>
          </CardContent>
        </Card>
      </div>

      {/* Task Timer Cards */}
      {filterStatus !== 'completed' && sortedPendingTasks.length > 0 && (
        <div>
          <h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
            <Timer className='w-5 h-5' />
            Pending Tasks ({sortedPendingTasks.length})
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {sortedPendingTasks.map((task) => (
              <TaskTimerCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {filterStatus !== 'pending' && completedTasks.length > 0 && (
        <div>
          <h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
            <CheckCircle2 className='w-5 h-5' />
            Completed Tasks ({completedTasks.length})
          </h2>
          <div className='space-y-3'>
            {completedTasks.slice(0, 10).map((task) => (
              <Card key={task.id} className='opacity-70'>
                <CardContent className='p-4'>
                  <div className='flex items-center gap-3'>
                    <Checkbox
                      checked={true}
                      onCheckedChange={() => toggleTaskMutation.mutate(task.id)}
                      disabled={toggleTaskMutation.isPending}
                    />
                    <div className='flex-1'>
                      <h3 className='font-bold line-through'>
                        <span className='font-black'>
                          {task.title.charAt(0)}
                        </span>
                        {task.title.slice(1)}
                      </h3>
                      <div className='flex items-center gap-2 mt-1 text-xs text-muted-foreground'>
                        <Clock className='w-3 h-3' />
                        Completed{' '}
                        {task.completedAt &&
                          format(new Date(task.completedAt), 'MMM d, yyyy')}
                        <Badge variant='outline' className='text-xs ml-2'>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {allTasks.length === 0 && (
        <div className='text-center py-12'>
          <div className='w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4'>
            <Plus className='w-12 h-12 text-muted-foreground' />
          </div>
          <h3 className='text-lg font-medium mb-2'>No tasks yet</h3>
          <p className='text-muted-foreground mb-4'>
            Create your first task to get started with task management
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className='w-4 h-4 mr-2' />
            Create Your First Task
          </Button>
        </div>
      )}

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
