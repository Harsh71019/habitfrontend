import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, ChevronLeft, ChevronRight, Target, Edit3, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

export function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingValue, setEditingValue] = useState<number | undefined>(undefined);
  
  const queryClient = useQueryClient();

  const { data: habits } = useQuery({
    queryKey: ['habits'],
    queryFn: () => api.getHabits(),
  });

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['habit-calendar', selectedHabit, currentMonth.getFullYear(), currentMonth.getMonth() + 1],
    queryFn: () => {
      if (!selectedHabit) return Promise.resolve(null);
      return api.getCalendarData(
        selectedHabit,
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1
      );
    },
    enabled: !!selectedHabit,
  });

  const completeHabitMutation = useMutation({
    mutationFn: ({ date, completed, value }: { date: string; completed: boolean; value?: number }) => {
      if (!selectedHabit) throw new Error('No habit selected');
      return api.completeHabit(selectedHabit, {
        date,
        completed,
        value,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['habit-completions'] });
      queryClient.invalidateQueries({ queryKey: ['habit-stats'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getCompletionForDay = (date: Date) => {
    if (!calendarData?.data?.completions) return null;
    const dateKey = format(date, 'yyyy-MM-dd');
    return calendarData.data.completions[dateKey] || null;
  };

  const getDayStatusColor = (date: Date) => {
    const completion = getCompletionForDay(date);
    if (!completion) return 'bg-muted/50 text-muted-foreground hover:bg-muted';
    
    if (completion.completed) {
      return 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30 dark:text-green-300 dark:border-green-400/30';
    } else {
      return 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30 dark:text-red-300 dark:border-red-400/30';
    }
  };

  const previousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const nextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const today = () => setCurrentMonth(new Date());

  const handleToggleCompletion = async (date: Date, completed: boolean) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const selectedHabitData = habits?.data?.find(h => h.id === selectedHabit);
    
    if (selectedHabitData?.type === 'quantitative' && completed) {
      // For quantitative habits, open edit dialog to enter value
      setSelectedDate(date);
      setEditingValue(undefined);
      setShowEditDialog(true);
    } else {
      // For binary habits, toggle directly
      await completeHabitMutation.mutateAsync({
        date: dateStr,
        completed,
      });
    }
  };

  const handleQuantitativeSubmit = async () => {
    if (!editingValue || editingValue <= 0) return;
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    await completeHabitMutation.mutateAsync({
      date: dateStr,
      completed: true,
      value: editingValue,
    });
    
    setShowEditDialog(false);
    setEditingValue(undefined);
  };

  const handleMarkIncomplete = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    await completeHabitMutation.mutateAsync({
      date: dateStr,
      completed: false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Track your habits and view your progress over time
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedHabit || ''} onValueChange={setSelectedHabit}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a habit to view" />
            </SelectTrigger>
            <SelectContent>
              {habits?.data?.map((habit) => (
                <SelectItem key={habit.id} value={habit.id}>
                  {habit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={today} variant="outline" size="sm">
            Today
          </Button>
        </div>
      </div>

      {selectedHabit ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  {format(currentMonth, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button onClick={previousMonth} variant="outline" size="sm">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button onClick={nextMonth} variant="outline" size="sm">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2 animate-spin" />
                    <p className="text-muted-foreground">Loading calendar...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Calendar Header */}
                  <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground mb-2">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>
                  
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Add empty cells for days before month start */}
                    {Array.from({ length: monthStart.getDay() }).map((_, index) => (
                      <div key={index} className="h-12" />
                    ))}
                    
                    {/* Days of the month */}
                    {daysInMonth.map((date) => {
                      const completion = getCompletionForDay(date);
                      const isToday = isSameDay(date, new Date());
                      const isSelected = isSameDay(date, selectedDate);
                      
                      return (
                        <div key={date.toISOString()} className="relative group">
                          <button
                            onClick={() => setSelectedDate(date)}
                            className={`
                              w-full h-12 rounded-lg border transition-all duration-200 hover:shadow-md
                              ${getDayStatusColor(date)}
                              ${isToday ? 'ring-2 ring-blue-400' : ''}
                              ${isSelected ? 'ring-2 ring-purple-400' : ''}
                            `}
                          >
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className="text-sm font-medium">
                                {format(date, 'd')}
                              </span>
                              {completion?.value && (
                                <span className="text-xs opacity-70">
                                  {completion.value}
                                </span>
                              )}
                            </div>
                          </button>
                          
                          {/* Quick action buttons on hover */}
                          <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                            {completion ? (
                              completion.completed ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkIncomplete(date);
                                  }}
                                  disabled={completeHabitMutation.isPending}
                                  className="w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                                  title="Mark as incomplete"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleCompletion(date, true);
                                  }}
                                  disabled={completeHabitMutation.isPending}
                                  className="w-5 h-5 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                                  title="Mark as complete"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              )
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleCompletion(date, true);
                                }}
                                disabled={completeHabitMutation.isPending}
                                className="w-5 h-5 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                                title="Mark as complete"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-6 flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500/20 border border-green-500/30 rounded dark:border-green-400/30" />
                      <span className="text-foreground">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500/20 border border-red-500/30 rounded dark:border-red-400/30" />
                      <span className="text-foreground">Not Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-muted border border-muted-foreground/20 rounded" />
                      <span className="text-foreground">No Data</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Day Details Sidebar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {format(selectedDate, 'MMM d, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const completion = getCompletionForDay(selectedDate);
                const selectedHabitData = habits?.data?.find(h => h.id === selectedHabit);
                
                if (!selectedHabit) {
                  return (
                    <div className="text-center py-6">
                      <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">
                        Select a habit to view details
                      </p>
                    </div>
                  );
                }
                
                if (!completion) {
                  return (
                    <div className="text-center py-6">
                      <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">
                        No data for this day
                      </p>
                      
                      {/* Allow marking completion for days without data */}
                      <div className="flex gap-2 pt-4">
                        <Button 
                          onClick={() => handleToggleCompletion(selectedDate, true)}
                          disabled={completeHabitMutation.isPending}
                          size="sm"
                          className="flex-1"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Mark Complete
                        </Button>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-semibold text-lg mb-2">
                        {selectedHabitData?.name}
                      </h3>
                      
                      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
                        completion.completed 
                          ? 'bg-green-500/20 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                          : 'bg-red-500/20 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                      }`}>
                        {completion.completed ? '✓ Completed' : '✗ Not Completed'}
                      </div>
                    </div>
                    
                    {completion.value && (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Value</p>
                        <Badge variant="outline" className="text-lg px-3 py-1">
                          {completion.value} {selectedHabitData?.target?.unit || ''}
                        </Badge>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      {completion.completed ? (
                        <Button 
                          onClick={() => handleMarkIncomplete(selectedDate)}
                          disabled={completeHabitMutation.isPending}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Mark Incomplete
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleToggleCompletion(selectedDate, true)}
                          disabled={completeHabitMutation.isPending}
                          size="sm"
                          className="flex-1"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Mark Complete
                        </Button>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-2">Habit Type</p>
                        <Badge variant="secondary">
                          {selectedHabitData?.type === 'binary' ? 'Yes/No' : 'Measurable'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })()} 
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Habit to View</h3>
              <p className="text-muted-foreground mb-4">
                Choose a habit from the dropdown above to see its calendar view and track your progress over time.
              </p>
              {!habits?.data?.length && (
                <p className="text-sm text-muted-foreground">
                  You don't have any habits yet. Create your first habit to get started!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quantitative Value Input Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {format(selectedDate, 'MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">
                {habits?.data?.find(h => h.id === selectedHabit)?.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Enter the value for this measurable habit:
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Enter value"
                value={editingValue || ''}
                onChange={(e) => setEditingValue(Number(e.target.value) || undefined)}
                min="0"
                step="0.1"
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground min-w-0">
                {habits?.data?.find(h => h.id === selectedHabit)?.target?.unit || 'units'}
              </span>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => setShowEditDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleQuantitativeSubmit}
                disabled={!editingValue || editingValue <= 0 || completeHabitMutation.isPending}
                className="flex-1"
              >
                {completeHabitMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}