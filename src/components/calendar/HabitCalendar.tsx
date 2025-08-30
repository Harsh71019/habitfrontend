import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api, type CalendarData } from '@/lib/api';
import { format, isSameMonth, startOfMonth, endOfMonth } from 'date-fns';
import { CheckCircle, Circle, Target } from 'lucide-react';

export function HabitCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDayDetails, setShowDayDetails] = useState(false);
  const queryClient = useQueryClient();

  const currentMonth = startOfMonth(selectedDate);
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;

  // For now, disable calendar data until we have a proper overview calendar endpoint
  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['calendar', year, month],
    queryFn: () => Promise.resolve({ data: {} }),
    enabled: false, // Disable until backend has overview calendar endpoint
  });

  const { data: habits } = useQuery({
    queryKey: ['habits'],
    queryFn: () => api.getHabits(),
  });

  const completeHabitMutation = useMutation({
    mutationFn: ({ habitId, date, completed }: { habitId: string; date: string; completed: boolean }) =>
      api.completeHabit(habitId, { date, completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedDateData = calendarData?.data?.[selectedDateKey];

  const getDayData = (date: Date) => {
    if (!isSameMonth(date, currentMonth)) return null;
    const dateKey = format(date, 'yyyy-MM-dd');
    return calendarData?.data?.[dateKey];
  };

  const getDayCompletionStatus = (date: Date) => {
    const dayData = getDayData(date);
    if (!dayData || dayData.habits.length === 0) return 'none';
    
    const completedCount = dayData.habits.filter(h => h.completed).length;
    const totalCount = dayData.habits.length;
    
    if (completedCount === totalCount) return 'complete';
    if (completedCount > 0) return 'partial';
    return 'incomplete';
  };

  const handleHabitToggle = async (habitId: string, completed: boolean) => {
    await completeHabitMutation.mutateAsync({
      habitId,
      date: selectedDateKey,
      completed,
    });
  };

  const renderDay = (date: Date) => {
    const status = getDayCompletionStatus(date);
    const dayData = getDayData(date);
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span className={`text-sm ${
          !isSameMonth(date, currentMonth) ? 'text-gray-400' : 'text-gray-900'
        }`}>
          {format(date, 'd')}
        </span>
        
        {dayData && dayData.habits.length > 0 && (
          <div className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full ${
            status === 'complete' ? 'bg-green-500' :
            status === 'partial' ? 'bg-yellow-500' :
            status === 'incomplete' ? 'bg-red-300' : 'bg-gray-300'
          }`} />
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Target className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
          <p className="text-gray-500">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Habit Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date);
                  setShowDayDetails(true);
                }
              }}
              className="rounded-md border"
              components={{
                DayContent: ({ date }) => renderDay(date),
              }}
            />
            
            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span>All complete</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span>Partially complete</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-300 rounded-full" />
                <span>Incomplete</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Day Summary */}
        <Card>
          <CardHeader>
            <CardTitle>
              {format(selectedDate, 'MMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateData ? (
              <div className="space-y-4">
                {selectedDateData.habits.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Habits</h4>
                    <div className="space-y-2">
                      {selectedDateData.habits.map((habit) => (
                        <div key={habit.habitId} className="flex items-center gap-2 p-2 border rounded">
                          <Checkbox
                            checked={habit.completed}
                            onCheckedChange={(checked) => 
                              handleHabitToggle(habit.habitId, Boolean(checked))
                            }
                            disabled={completeHabitMutation.isPending}
                          />
                          <span className="flex-1 text-sm">{habit.habitName}</span>
                          {habit.value && (
                            <Badge variant="outline" className="text-xs">
                              {habit.value}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDateData.tasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Tasks</h4>
                    <div className="space-y-2">
                      {selectedDateData.tasks.map((task) => (
                        <div key={task.taskId} className="flex items-center gap-2 p-2 border rounded">
                          {task.completed ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="flex-1 text-sm">{task.taskTitle}</span>
                          {task.isDeadline && (
                            <Badge variant="destructive" className="text-xs">
                              Due
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDateData.habits.length === 0 && selectedDateData.tasks.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No habits or tasks for this day
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No data for selected date
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Day Details Modal */}
      <Dialog open={showDayDetails} onOpenChange={setShowDayDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedDateData ? (
              <>
                {selectedDateData.habits.map((habit) => (
                  <div key={habit.habitId} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={habit.completed}
                      onCheckedChange={(checked) => 
                        handleHabitToggle(habit.habitId, Boolean(checked))
                      }
                      disabled={completeHabitMutation.isPending}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{habit.habitName}</p>
                      {habit.value && (
                        <p className="text-sm text-gray-600">Value: {habit.value}</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {selectedDateData.habits.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No habits for this day
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No data available
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}