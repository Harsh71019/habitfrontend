import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  Target, 
  Calendar,
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
  Gamepad2,
  MoreVertical,
  Trash2,
  Archive,
  Undo,
  X
} from 'lucide-react';
import { api, type Habit } from '@/lib/api';
import { useHabits } from '@/hooks/useHabits';
import { HabitCard } from '@/components/habits/HabitCard';
import { CreateHabitDialog } from '@/components/habits/CreateHabitDialog';
import { EditHabitDialog } from '@/components/habits/EditHabitDialog';
import { CreateCategoryDialog } from '@/components/categories/CreateCategoryDialog';

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

export function HabitsPage() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<
    'all' | 'binary' | 'quantitative'
  >('all');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const { data: habits, isLoading } = useHabits({
    type: filterType === 'all' ? undefined : filterType,
    isActive: filterStatus === 'all' ? undefined : filterStatus === 'active',
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  const today = new Date().toISOString().split('T')[0];

  // Get today's completions for all habits
  const { data: allCompletions } = useQuery({
    queryKey: ['all-habit-completions', today],
    queryFn: async () => {
      if (!habits?.data) return [];
      const completions = await Promise.all(
        habits.data.map(habit => 
          api.getHabitCompletionsByHabit(habit.id, { startDate: today, endDate: today })
        )
      );
      return completions.map((comp, index) => ({
        habitId: habits.data[index].id,
        completion: comp.data?.[0]
      }));
    },
    enabled: !!habits?.data
  });

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#059669', '#047857', '#fbbf24', '#f59e0b'],
    });
  };

  const isHabitCompletedToday = (habitId: string) => {
    const completion = allCompletions?.find(c => c.habitId === habitId);
    return completion?.completion?.completed || false;
  };

  const filteredHabits =
    habits?.data?.filter(
      (habit) => {
        const matchesSearch = habit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          habit.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = !selectedCategoryId || 
          habit.categories.some(cat => cat.id === selectedCategoryId);
        
        return matchesSearch && matchesCategory;
      }
    ) || [];

  // Group habits by schedule type and completion status
  const dailyHabits = filteredHabits.filter(h => 
    h.schedule.type === 'daily' && h.isActive && !isHabitCompletedToday(h.id)
  );
  const weeklyHabits = filteredHabits.filter(h => 
    h.schedule.type === 'weekly' && h.isActive && !isHabitCompletedToday(h.id)
  );
  const completedHabits = filteredHabits.filter(h => 
    h.isActive && isHabitCompletedToday(h.id)
  );
  const archivedHabits = filteredHabits.filter(h => !h.isActive);

  const completeHabitMutation = useMutation({
    mutationFn: ({ habitId, completed }: { habitId: string; completed: boolean }) => 
      api.completeHabit(habitId, {
        date: today,
        completed
      }),
    onMutate: async ({ habitId, completed }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['all-habit-completions', today] });
      
      // Snapshot previous value
      const previousCompletions = queryClient.getQueryData(['all-habit-completions', today]);
      
      // Optimistically update completion status
      queryClient.setQueryData(['all-habit-completions', today], (old: any) => {
        if (!old) return old;
        
        const updatedCompletions = old.map((item: any) => {
          if (item.habitId === habitId) {
            return {
              ...item,
              completion: {
                ...item.completion,
                completed
              }
            };
          }
          return item;
        });
        
        // If no existing completion found, add new one
        if (!old.find((item: any) => item.habitId === habitId)) {
          updatedCompletions.push({
            habitId,
            completion: { completed, date: today }
          });
        }
        
        return updatedCompletions;
      });
      
      // Trigger confetti immediately for completed habits
      if (completed) {
        triggerConfetti();
      }
      
      return { previousCompletions };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCompletions) {
        queryClient.setQueryData(['all-habit-completions', today], context.previousCompletions);
      }
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['all-habit-completions', today] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }
  });

  const deleteHabitMutation = useMutation({
    mutationFn: (habitId: string) => api.deleteHabit(habitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }
  });

  const toggleHabitMutation = useMutation({
    mutationFn: (habitId: string) => api.toggleHabitStatus(habitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }
  });

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowEditDialog(true);
  };

  const handleCompleteHabit = (habitId: string, completed: boolean = true) => {
    completeHabitMutation.mutate({ habitId, completed });
  };

  const handleDeleteHabit = (habitId: string) => {
    deleteHabitMutation.mutate(habitId);
  };

  const handleArchiveHabit = (habitId: string) => {
    toggleHabitMutation.mutate(habitId);
  };

  // Render compact habit card
  const renderCompactHabitCard = (habit: Habit, isCompleted: boolean = false) => (
    <div
      key={habit.id}
      className="flex items-center justify-between p-4 bg-card rounded-lg border hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          {(() => {
            const IconComponent = iconMap[habit.icon as IconName] || Target;
            return <IconComponent className="w-5 h-5 text-muted-foreground" />;
          })()}
        </div>
        <div>
          <h3 className="font-semibold">{habit.name}</h3>
          <p className="text-sm text-muted-foreground">
            Goal: {habit.type === 'quantitative' && habit.target 
              ? `${habit.target.value} ${habit.target.unit}` 
              : habit.schedule.type === 'weekly' 
                ? `${habit.schedule.frequency || 1} times/week`
                : 'Complete daily'
            }
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isCompleted ? (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-3 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300"
            onClick={() => handleCompleteHabit(habit.id, false)}
            disabled={completeHabitMutation.isPending}
          >
            <Undo className="w-3 h-3 mr-1" />
            Undo
          </Button>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-3"
            onClick={() => handleCompleteHabit(habit.id, true)}
            disabled={completeHabitMutation.isPending}
          >
            Complete
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditHabit(habit)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleArchiveHabit(habit.id)}>
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDeleteHabit(habit.id)}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-3xl font-bold'>My Habits</h1>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className='h-48 bg-muted animate-pulse rounded-lg'
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>My Habits</h1>
          <p className='text-muted-foreground mt-1'>
            Manage and track your daily habits
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className='w-4 h-4 mr-2' />
          New Habit
        </Button>
      </div>

      {/* Search and Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          <Input
            placeholder='Search habits...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10'
          />
        </div>

        <div className='flex gap-2'>
          <Select
            value={filterType}
            onValueChange={(value: any) => setFilterType(value)}
          >
            <SelectTrigger className='w-[140px]'>
              <Filter className='w-4 h-4 mr-2 text-gray-600' />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Types</SelectItem>
              <SelectItem value='binary'>Yes/No</SelectItem>
              <SelectItem value='quantitative'>Measurable</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterStatus}
            onValueChange={(value: any) => setFilterStatus(value)}
          >
            <SelectTrigger className='w-[120px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Status</SelectItem>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='inactive'>Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>


      {/* Category Pills */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Selected Category Filter Display */}
          {selectedCategoryId && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtered by:</span>
              {(() => {
                const selectedCategory = categories?.data?.find(c => c.id === selectedCategoryId);
                return selectedCategory ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 rounded-full text-white border border-white/20"
                    style={{
                      backgroundColor: selectedCategory.color
                    }}
                  >
                    <span className="mr-1">{selectedCategory.name}</span>
                    <X 
                      className="w-3 h-3 cursor-pointer hover:bg-white/20 rounded-full p-0.5" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategoryId(null);
                      }}
                    />
                  </Button>
                ) : null;
              })()}
            </div>
          )}

          {/* All Categories Button */}
          <Button
            variant={selectedCategoryId === null ? "default" : "outline"}
            size="sm"
            className="h-7 px-3 rounded-full"
            onClick={() => setSelectedCategoryId(null)}
          >
            All
          </Button>
          
          {/* Category Pills */}
          {categories?.data?.map((category) => (
            <Button
              key={category.id}
              variant="outline"
              size="sm"
              className="h-7 px-3 rounded-full text-white border border-white/20"
              style={{
                backgroundColor: category.color,
                opacity: selectedCategoryId === category.id ? 0.5 : 1
              }}
              onClick={() => setSelectedCategoryId(category.id)}
              disabled={selectedCategoryId === category.id}
            >
              {category.name}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0 rounded-full"
          onClick={() => setShowCreateCategoryDialog(true)}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* Habits organized by type */}
      {filteredHabits.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Daily Habits */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Daily Goals</h2>
              <span className="text-sm text-muted-foreground">({dailyHabits.length})</span>
            </div>
            <div className="space-y-3">
              {dailyHabits.map(habit => renderCompactHabitCard(habit, false))}
              {dailyHabits.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No daily habits yet</p>
              )}
            </div>
          </div>

          {/* Weekly Habits */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Target className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-semibold">Weekly Goals</h2>
              <span className="text-sm text-muted-foreground">({weeklyHabits.length})</span>
            </div>
            <div className="space-y-3">
              {weeklyHabits.map(habit => renderCompactHabitCard(habit, false))}
              {weeklyHabits.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No weekly habits yet</p>
              )}
            </div>
          </div>

          {/* Completed Habits */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold">Completed Today</h2>
              <span className="text-sm text-muted-foreground">({completedHabits.length})</span>
            </div>
            <div className="space-y-3">
              {completedHabits.map(habit => renderCompactHabitCard(habit, true))}
              {archivedHabits.map(habit => renderCompactHabitCard(habit, false))}
              {completedHabits.length === 0 && archivedHabits.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No completed habits</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className='text-center py-12'>
          <div className='w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4'>
            <Plus className='w-12 h-12 text-muted-foreground' />
          </div>
          <h3 className='text-lg font-medium mb-2'>
            {searchTerm || filterType !== 'all' || filterStatus !== 'all'
              ? 'No habits found'
              : 'No habits yet'}
          </h3>
          <p className='text-muted-foreground mb-4'>
            {searchTerm || filterType !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Start building better habits by creating your first one'}
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className='w-4 h-4 mr-2' />
            Create Your First Habit
          </Button>
        </div>
      )}

      {/* Create Habit Dialog */}
      <CreateHabitDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {/* Edit Habit Dialog */}
      <EditHabitDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        habit={editingHabit}
      />

      {/* Create Category Dialog */}
      <CreateCategoryDialog
        open={showCreateCategoryDialog}
        onOpenChange={setShowCreateCategoryDialog}
      />
    </div>
  );
}
