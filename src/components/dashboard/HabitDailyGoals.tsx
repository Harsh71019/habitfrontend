import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Target,
  Droplets,
  Activity,
  Smartphone,
  Dumbbell,
  PersonStanding,
  Heart,
  Brain,
  Book,
  Coffee,
  Moon,
  Sun,
  Music,
  Camera,
  Gamepad2
} from 'lucide-react';
import { api, type Habit } from '@/lib/api';
import { format, subDays } from 'date-fns';

// Icon mapping for dynamic icon rendering
const iconMap = {
  Droplets,
  Activity,
  Smartphone,
  Dumbbell,
  PersonStanding,
  Target,
  Heart,
  Brain,
  Book,
  Coffee,
  Moon,
  Sun,
  Music,
  Camera,
  Gamepad2
} as const;

type IconName = keyof typeof iconMap;

interface HabitDailyGoalsProps {
  habit: Habit;
  getHabitStreakData: (habitId: string) => {
    currentStreak: number;
    longestStreak: number;
    completedCount: number;
  };
}

export function HabitDailyGoals({ habit, getHabitStreakData }: HabitDailyGoalsProps) {
  const today = new Date();

  // Get completion data for the last 14 days
  const { data: completionData } = useQuery({
    queryKey: ['habit-completions-14days', habit.id],
    queryFn: () => {
      const endDate = format(today, 'yyyy-MM-dd');
      const startDate = format(subDays(today, 13), 'yyyy-MM-dd');
      return api.getHabitCompletionsByHabit(habit.id, { startDate, endDate });
    },
  });

  // Create a map of date -> completion for quick lookup
  const completionMap = new Map();
  if (completionData?.data) {
    completionData.data.forEach(completion => {
      // Convert ISO date to YYYY-MM-DD format for matching
      const dateKey = completion.date.split('T')[0];
      completionMap.set(dateKey, completion.completed);
    });
  }

  // Debug log to see what data we're getting
  console.log('Daily Goals Data:', {
    habitId: habit.id,
    habitName: habit.name,
    completionData: completionData?.data,
    completionMapSize: completionMap.size
  });

  return (
    <Card className='h-fit'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2'>
          <div className='w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center'>
            {(() => {
              const IconComponent = iconMap[habit.icon as IconName] || Target;
              return <IconComponent className='w-3 h-3 text-white' />;
            })()}
          </div>
          {habit.name} Daily Goals
        </CardTitle>
        <div className='text-xs text-muted-foreground'>
          Streak: {getHabitStreakData(habit.id).currentStreak} Longest:{' '}
          {getHabitStreakData(habit.id).longestStreak} Completed:{' '}
          {getHabitStreakData(habit.id).completedCount}
        </div>
      </CardHeader>
      <CardContent className='pt-0 pb-4'>
        {/* 14-day completion grid */}
        <div className='space-y-2'>
          {/* Date labels */}
          <div className='flex justify-between text-xs text-muted-foreground'>
            {Array.from({ length: 14 }, (_, i) => {
              const date = subDays(today, 13 - i);
              return (
                <div key={i} className='w-5 text-center'>
                  {format(date, 'd')}
                </div>
              );
            })}
          </div>

          {/* Day labels */}
          <div className='flex justify-between text-xs text-muted-foreground mb-1'>
            {Array.from({ length: 14 }, (_, i) => {
              const date = subDays(today, 13 - i);
              return (
                <div key={i} className='w-5 text-center'>
                  {format(date, 'EEE').charAt(0)}
                </div>
              );
            })}
          </div>

          {/* Completion bars */}
          <div className='flex justify-between items-end h-20'>
            {Array.from({ length: 14 }, (_, i) => {
              const date = subDays(today, 13 - i);
              const dateKey = format(date, 'yyyy-MM-dd');
              const isCompleted = completionMap.get(dateKey) || false;
              
              // Debug first few days
              if (i < 3) {
                console.log(`Day ${i}:`, { dateKey, isCompleted, hasInMap: completionMap.has(dateKey) });
              }
              const isToday = i === 13;

              return (
                <div
                  key={i}
                  className={`w-5 rounded-sm transition-colors ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  style={{
                    height: isCompleted ? '100%' : '16%',
                  }}
                  title={`${format(date, 'MMM d, yyyy')} - ${
                    isCompleted ? 'Completed' : 'Not completed'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}