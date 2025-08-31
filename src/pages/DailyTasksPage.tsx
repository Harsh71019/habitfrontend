import { useState, KeyboardEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Archive, Trash2, RotateCcw, Clock } from 'lucide-react';
import { api, type DailyTask, type CreateDailyTaskData } from '@/lib/api';
import { format } from 'date-fns';

export function DailyTasksPage() {
  const [newTaskInput, setNewTaskInput] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const queryClient = useQueryClient();

  // Fetch active daily tasks
  const { data: activeTasks, isLoading: activeLoading } = useQuery({
    queryKey: ['daily-tasks'],
    queryFn: () => api.getDailyTasks(),
    staleTime: 0,
  });

  // Fetch archived daily tasks
  const { data: archivedTasks, isLoading: archivedLoading } = useQuery({
    queryKey: ['daily-tasks-archived'],
    queryFn: () => api.getArchivedDailyTasks(),
    enabled: showArchived,
  });

  // Fetch daily task stats
  const { data: stats } = useQuery({
    queryKey: ['daily-task-stats'],
    queryFn: () => api.getDailyTaskStats(),
    staleTime: 0,
  });

  // Create daily task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data: CreateDailyTaskData) => api.createDailyTask(data),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['daily-tasks'] });
      queryClient.removeQueries({ queryKey: ['daily-task-stats'] });
      queryClient.refetchQueries({ queryKey: ['daily-tasks'] });
      queryClient.refetchQueries({ queryKey: ['daily-task-stats'] });
      setNewTaskInput('');
    },
  });

  // Mark task completion mutation
  const markTaskMutation = useMutation({
    mutationFn: ({
      taskId,
      completed,
    }: {
      taskId: string;
      completed: boolean;
    }) =>
      api.markDailyTask(taskId, {
        date: format(new Date(), 'yyyy-MM-dd'),
        completed,
      }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['daily-tasks'] });
      queryClient.removeQueries({ queryKey: ['daily-task-stats'] });
      queryClient.refetchQueries({ queryKey: ['daily-tasks'] });
      queryClient.refetchQueries({ queryKey: ['daily-task-stats'] });
    },
  });

  // Archive task mutation
  const archiveTaskMutation = useMutation({
    mutationFn: (taskId: string) => api.archiveDailyTask(taskId),
    onSuccess: () => {
      // Clear all related queries and force immediate refetch
      queryClient.removeQueries({ queryKey: ['daily-tasks'] });
      queryClient.removeQueries({ queryKey: ['daily-tasks-archived'] });
      queryClient.removeQueries({ queryKey: ['daily-task-stats'] });

      // Immediately refetch fresh data
      queryClient.refetchQueries({ queryKey: ['daily-tasks'] });
      queryClient.refetchQueries({ queryKey: ['daily-task-stats'] });
    },
  });

  // Unarchive task mutation
  const unarchiveTaskMutation = useMutation({
    mutationFn: (taskId: string) => api.unarchiveDailyTask(taskId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['daily-tasks'] });
      queryClient.removeQueries({ queryKey: ['daily-tasks-archived'] });
      queryClient.removeQueries({ queryKey: ['daily-task-stats'] });

      queryClient.refetchQueries({ queryKey: ['daily-tasks'] });
      queryClient.refetchQueries({ queryKey: ['daily-task-stats'] });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => api.deleteDailyTask(taskId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['daily-tasks'] });
      queryClient.removeQueries({ queryKey: ['daily-tasks-archived'] });
      queryClient.removeQueries({ queryKey: ['daily-task-stats'] });

      queryClient.refetchQueries({ queryKey: ['daily-tasks'] });
      queryClient.refetchQueries({ queryKey: ['daily-task-stats'] });
    },
  });

  const handleCreateTask = () => {
    if (!newTaskInput.trim()) return;

    createTaskMutation.mutate({
      title: newTaskInput.trim(),
      priority: 'medium',
    });
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCreateTask();
    }
  };

  const handleToggleTask = (taskId: string, currentlyCompleted: boolean) => {
    markTaskMutation.mutate({
      taskId,
      completed: !currentlyCompleted,
    });
  };

  const renderTaskItem = (task: DailyTask, isArchived: boolean = false) => {
    const todayCompleted = task.todayCompletion?.completed || false;

    return (
      <div
        key={task.id}
        className={`group flex items-center gap-3 py-2 px-3 hover:bg-muted/50 rounded-md transition-colors ${
          todayCompleted && !isArchived ? 'bg-muted/30' : ''
        }`}
      >
        <Checkbox
          checked={todayCompleted}
          onCheckedChange={() => handleToggleTask(task.id, todayCompleted)}
          disabled={markTaskMutation.isPending || isArchived}
          className='shrink-0'
        />

        <div className='flex-1 min-w-0'>
          <span
            className={`text-sm ${
              todayCompleted && !isArchived
                ? 'line-through text-muted-foreground'
                : 'text-foreground'
            }`}
          >
            {task.title}
          </span>
          {task.description && (
            <div className='text-xs text-muted-foreground mt-1'>
              {task.description}
            </div>
          )}
        </div>

        <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0'>
          {!isArchived && (
            <Button
              size='sm'
              variant='ghost'
              onClick={() => archiveTaskMutation.mutate(task.id)}
              disabled={archiveTaskMutation.isPending}
              className='h-6 w-6 p-0'
            >
              <Archive className='w-3 h-3' />
            </Button>
          )}

          {isArchived && (
            <>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => unarchiveTaskMutation.mutate(task.id)}
                disabled={unarchiveTaskMutation.isPending}
                className='h-6 w-6 p-0'
              >
                <RotateCcw className='w-3 h-3' />
              </Button>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => deleteTaskMutation.mutate(task.id)}
                disabled={deleteTaskMutation.isPending}
                className='h-6 w-6 p-0 text-red-500 hover:text-red-600'
              >
                <Trash2 className='w-3 h-3' />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  if (activeLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  const activeTasksData = activeTasks?.data || [];
  const archivedTasksData = archivedTasks?.data || [];

  // Separate completed and incomplete tasks for today
  const incompleteTasks = activeTasksData.filter(
    (task) => !task.todayCompletion?.completed
  );
  const completedTasks = activeTasksData.filter(
    (task) => task.todayCompletion?.completed
  );

  return (
    <div className='w-full py-6 px-6'>
      {/* Header */}
      <div className='flex items-center gap-3 mb-6'>
        <Clock className='w-6 h-6' />
        <div>
          <h1 className='text-2xl font-bold'>Today</h1>
          <p className='text-sm text-muted-foreground'>
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className='ml-auto flex items-center gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setShowArchived(!showArchived)}
            className='text-muted-foreground'
          >
            <Archive className='w-4 h-4 mr-2' />
            {showArchived ? 'Hide' : 'Show'} Archived
          </Button>
        </div>
      </div>

      {/* Quick Add Input */}
      <div className='mb-6'>
        <Input
          value={newTaskInput}
          onChange={(e) => setNewTaskInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder='Add task to "Inbox"'
          className='w-full text-sm bg-background border-muted-foreground/20'
          disabled={createTaskMutation.isPending}
        />
      </div>

      {/* Today Section */}
      <div className='space-y-4'>
        {/* Incomplete Tasks */}
        {incompleteTasks.length > 0 && (
          <div>
            <div className='flex items-center gap-2 mb-3'>
              <h2 className='text-sm font-medium text-muted-foreground'>
                Today
              </h2>
              <span className='text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full'>
                {incompleteTasks.length}
              </span>
            </div>
            <div className='space-y-1'>
              {incompleteTasks.map((task) => renderTaskItem(task))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            {incompleteTasks.length > 0 && (
              <div className='border-t border-border my-4'></div>
            )}
            <div className='flex items-center gap-2 mb-3'>
              <h2 className='text-sm font-medium text-muted-foreground'>
                Completed
              </h2>
              <span className='text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-full'>
                {completedTasks.length}
              </span>
            </div>
            <div className='space-y-1'>
              {completedTasks.map((task) => renderTaskItem(task))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {activeTasksData.length === 0 && (
          <div className='text-center py-12 text-muted-foreground'>
            <Clock className='w-12 h-12 mx-auto mb-4 opacity-50' />
            <p className='text-sm'>No tasks for today</p>
            <p className='text-xs mt-1'>Type above to add your first task</p>
          </div>
        )}

        {/* Archived Tasks */}
        {showArchived && archivedTasksData.length > 0 && (
          <div>
            <div className='border-t border-border my-4'></div>
            <div className='flex items-center gap-2 mb-3'>
              <h2 className='text-sm font-medium text-muted-foreground'>
                Archived
              </h2>
              <span className='text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full'>
                {archivedTasksData.length}
              </span>
            </div>
            <div className='space-y-1'>
              {archivedTasksData.map((task) => renderTaskItem(task, true))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
