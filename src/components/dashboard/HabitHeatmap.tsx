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
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from 'date-fns';

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

interface HabitHeatmapProps {
  habit: Habit;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  getHabitStreakData: (habitId: string) => {
    currentStreak: number;
    longestStreak: number;
    completedCount: number;
  };
}

export function HabitHeatmap({ habit, selectedMonth, setSelectedMonth, getHabitStreakData }: HabitHeatmapProps) {
  const today = new Date();
  const selectedDate = new Date(selectedMonth);
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate calendar layout with proper week alignment
  const firstDayOfWeek = monthStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const startFromMonday = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Convert to Monday = 0
  const totalCells = Math.ceil((monthDays.length + startFromMonday) / 7) * 7;

  // Get calendar data for this habit
  const { data: calendarData } = useQuery({
    queryKey: ['calendar', habit.id, selectedDate.getFullYear(), selectedDate.getMonth() + 1],
    queryFn: () => api.getCalendarData(habit.id, selectedDate.getFullYear(), selectedDate.getMonth() + 1),
  });

  return (
    <Card className='h-fit'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <div className='w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center'>
              {(() => {
                const IconComponent = iconMap[habit.icon as IconName] || Target;
                return <IconComponent className='w-3 h-3 text-white' />;
              })()}
            </div>
            {habit.name} Heatmap
          </CardTitle>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className='w-24 h-7 text-xs'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={format(new Date(), 'yyyy-MM')}>
                {format(new Date(), 'MMM yyyy')}
              </SelectItem>
              <SelectItem
                value={format(
                  new Date(
                    new Date().getFullYear(),
                    new Date().getMonth() - 1
                  ),
                  'yyyy-MM'
                )}
              >
                {format(
                  new Date(
                    new Date().getFullYear(),
                    new Date().getMonth() - 1
                  ),
                  'MMM yyyy'
                )}
              </SelectItem>
              <SelectItem
                value={format(
                  new Date(
                    new Date().getFullYear(),
                    new Date().getMonth() - 2
                  ),
                  'yyyy-MM'
                )}
              >
                {format(
                  new Date(
                    new Date().getFullYear(),
                    new Date().getMonth() - 2
                  ),
                  'MMM yyyy'
                )}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='text-xs text-muted-foreground'>
          Streak: {getHabitStreakData(habit.id).currentStreak} Longest:{' '}
          {getHabitStreakData(habit.id).longestStreak} Completed:{' '}
          {getHabitStreakData(habit.id).completedCount}
        </div>
      </CardHeader>
      <CardContent className='pt-0 pb-4'>
        {/* Month Heatmap Grid */}
        <div className='space-y-2'>
          {/* Week day headers */}
          <div className='grid grid-cols-7 gap-1 text-xs text-muted-foreground'>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <div key={i} className='w-5 text-center font-medium'>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid - perfectly aligned */}
          <div className='grid grid-cols-7 gap-1'>
            {Array.from({ length: totalCells }, (_, i) => {
              const dayIndex = i - startFromMonday;

              if (dayIndex < 0 || dayIndex >= monthDays.length) {
                // Empty cell for alignment
                return <div key={i} className='w-5 h-5' />;
              }

              const date = monthDays[dayIndex];
              const dateKey = format(date, 'yyyy-MM-dd');
              const isCompleted = calendarData?.data?.completions?.[dateKey]?.completed || false;
              const isCurrentDay =
                format(date, 'yyyy-MM-dd') ===
                format(today, 'yyyy-MM-dd');

              return (
                <div
                  key={i}
                  className={`w-5 h-5 rounded transition-colors cursor-pointer ${
                    isCompleted
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : isCurrentDay
                      ? 'bg-gray-400 border-2 border-blue-400'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
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