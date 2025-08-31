import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { MoreVertical, Edit, Trash2, Target, Clock, Power, PowerOff, CheckCircle2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { api, type Habit } from '@/lib/api';
import { format, isToday } from 'date-fns';

interface HabitCardProps {
  habit: Habit;
  onEdit?: (habit: Habit) => void;
}

export function HabitCard({ habit, onEdit }: HabitCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [quantitativeValue, setQuantitativeValue] = useState<number | undefined>();
  const [justCompleted, setJustCompleted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const triggerConfetti = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x, y },
        colors: ['#10b981', '#059669', '#047857', '#fbbf24', '#f59e0b'],
        ticks: 200,
      });
    }
  };

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: completions } = useQuery({
    queryKey: ['habit-completions', habit.id],
    queryFn: () => api.getHabitCompletions(habit.id, {
      startDate: today,
      endDate: today,
    }),
  });

  const { data: stats } = useQuery({
    queryKey: ['habit-stats', habit.id],
    queryFn: () => api.getHabitStats(habit.id),
  });

  const todayCompletion = completions?.data?.[0];
  const isCompleted = todayCompletion?.completed || false;

  console.log('HabitCard debug:', {
    habitName: habit.name,
    todayCompletion,
    isCompleted,
    completionsData: completions?.data
  });

  const completeHabitMutation = useMutation({
    mutationFn: ({ completed, value }: { completed: boolean; value?: number }) =>
      api.completeHabit(habit.id, {
        date: today,
        completed,
        value,
      }),
    onSuccess: (data, variables) => {
      console.log('Habit completion mutation succeeded');
      
      // Trigger confetti if habit was just completed
      if (variables.completed && !isCompleted) {
        setJustCompleted(true);
        triggerConfetti();
        
        // Reset the celebration state after animation
        setTimeout(() => setJustCompleted(false), 2000);
      }
      
      queryClient.invalidateQueries({ queryKey: ['habit-completions', habit.id] });
      queryClient.invalidateQueries({ queryKey: ['habit-stats', habit.id] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setIsCompleting(false);
      setQuantitativeValue(undefined);
    },
    onError: (error) => {
      console.error('Habit completion mutation failed:', error);
    },
  });

  const deleteHabitMutation = useMutation({
    mutationFn: () => api.deleteHabit(habit.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const toggleHabitStatusMutation = useMutation({
    mutationFn: () => api.toggleHabitStatus(habit.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const handleToggleCompletion = async (completed: boolean) => {
    console.log('Toggle completion clicked:', { completed, isCompleted, habitName: habit.name });
    
    if (habit.type === 'quantitative' && completed && !isCompleted) {
      setIsCompleting(true);
      return;
    }

    try {
      await completeHabitMutation.mutateAsync({ completed });
      console.log('Completion toggled successfully');
    } catch (error) {
      console.error('Error toggling completion:', error);
    }
  };

  const handleQuantitativeSubmit = async () => {
    if (quantitativeValue && quantitativeValue > 0) {
      await completeHabitMutation.mutateAsync({
        completed: true,
        value: quantitativeValue,
      });
    }
  };

  const getScheduleText = () => {
    switch (habit.schedule.type) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return `${habit.schedule.frequency}x per week`;
      case 'specific_days':
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return habit.schedule.days?.map(d => dayNames[d]).join(', ') || 'Custom';
      default:
        return 'Custom';
    }
  };

  return (
    <Card 
      ref={cardRef}
      className={`relative transition-all duration-500 hover:shadow-lg hover:-translate-y-1 bg-card dark:bg-card border-border dark:border-border ${
        justCompleted ? 'ring-4 ring-green-400 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 animate-pulse' :
        isCompleted ? 'ring-2 ring-green-200 bg-green-50/50 dark:bg-green-950/20 border-green-300 dark:border-green-700' : 
        'hover:bg-accent/50 dark:hover:bg-accent/50'
      } ${!habit.isActive ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg text-foreground">{habit.name}</h3>
              {!habit.isActive && (
                <Badge variant="secondary" className="text-xs">
                  Inactive
                </Badge>
              )}
              {habit.type === 'quantitative' && (
                <Badge variant="outline" className="text-xs">
                  {habit.target?.value} {habit.target?.unit}
                </Badge>
              )}
            </div>
            
            {habit.description && (
              <p className="text-sm text-muted-foreground mb-2">{habit.description}</p>
            )}

            <div className="flex flex-wrap gap-1 mb-2">
              {habit.categories.map((category) => (
                <Badge key={category.id} variant="secondary" className="text-xs">
                  {category.name}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3 text-blue-500" />
                {getScheduleText()}
              </div>
              {habit.reminders.enabled && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-orange-500" />
                  {habit.reminders.time}
                </div>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(habit)}>
                <Edit className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => toggleHabitStatusMutation.mutate()}
                disabled={toggleHabitStatusMutation.isPending}
              >
                {habit.isActive ? (
                  <>
                    <PowerOff className="w-4 h-4 mr-2 text-orange-600 dark:text-orange-400" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => deleteHabitMutation.mutate()}
                className="text-red-600 dark:text-red-400"
                disabled={deleteHabitMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2 text-red-600 dark:text-red-400" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Celebration Overlay */}
        {justCompleted && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500/10 rounded-lg backdrop-blur-sm z-10">
            <div className="text-center">
              <Sparkles className="w-8 h-8 text-green-500 mx-auto mb-2 animate-bounce" />
              <p className="text-green-600 font-semibold text-sm">Great job! 🎉</p>
            </div>
          </div>
        )}

        {!isCompleting ? (
          <div className="space-y-4">
            {/* Progress Section */}
            {stats?.data && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {stats.data.currentStreak}
                    </div>
                    <div className="text-xs text-muted-foreground">day streak</div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {Math.round(stats.data.completionRate * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">complete</div>
                  </div>
                </div>
                
                {todayCompletion?.value && (
                  <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/30">
                    {todayCompletion.value} {habit.target?.unit}
                  </Badge>
                )}
              </div>
            )}

            {/* Completion Action */}
            <div className="flex items-center justify-center">
              {isCompleted ? (
                <Button
                  variant="outline"
                  onClick={() => handleToggleCompletion(false)}
                  disabled={completeHabitMutation.isPending || !habit.isActive}
                  className="w-full flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  ✨ Completed Today!
                </Button>
              ) : (
                <Button
                  onClick={() => handleToggleCompletion(true)}
                  disabled={completeHabitMutation.isPending || !habit.isActive}
                  className="w-full flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
                >
                  {completeHabitMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4" />
                      Mark Complete
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <Target className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <h4 className="font-medium text-blue-700 dark:text-blue-300">
                Enter your {habit.target?.unit || 'value'}
              </h4>
              <p className="text-xs text-muted-foreground">
                Target: {habit.target?.value} {habit.target?.unit}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder={`Enter ${habit.target?.unit || 'value'}`}
                value={quantitativeValue || ''}
                onChange={(e) => setQuantitativeValue(Number(e.target.value) || undefined)}
                min="0"
                step="0.1"
                className="flex-1 text-center text-lg font-medium"
                autoFocus
              />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400 min-w-0">{habit.target?.unit}</span>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleQuantitativeSubmit}
                disabled={!quantitativeValue || quantitativeValue <= 0 || completeHabitMutation.isPending}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
              >
                {completeHabitMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Complete
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsCompleting(false)}
                disabled={completeHabitMutation.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}