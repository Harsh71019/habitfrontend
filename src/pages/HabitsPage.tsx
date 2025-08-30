import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Filter } from 'lucide-react';
import { api, type Habit } from '@/lib/api';
import { useHabits } from '@/hooks/useHabits';
import { HabitCard } from '@/components/habits/HabitCard';
import { CreateHabitDialog } from '@/components/habits/CreateHabitDialog';
import { EditHabitDialog } from '@/components/habits/EditHabitDialog';

export function HabitsPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<
    'all' | 'binary' | 'quantitative'
  >('all');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'active' | 'inactive'
  >('all');

  const { data: habits, isLoading } = useHabits({
    type: filterType === 'all' ? undefined : filterType,
    isActive: filterStatus === 'all' ? undefined : filterStatus === 'active',
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  const filteredHabits =
    habits?.data?.filter(
      (habit) =>
        habit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        habit.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowEditDialog(true);
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-3xl font-bold text-gray-900'>My Habits</h1>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className='h-48 bg-gray-200 animate-pulse rounded-lg'
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

      {/* Stats Summary */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='bg-blue-50 p-4 rounded-lg'>
          <div className='text-2xl font-bold text-blue-700'>
            {filteredHabits.length}
          </div>
          <div className='text-sm text-blue-600'>Total Habits</div>
        </div>
        <div className='bg-green-50 p-4 rounded-lg'>
          <div className='text-2xl font-bold text-green-700'>
            {filteredHabits.filter((h) => h.isActive).length}
          </div>
          <div className='text-sm text-green-600'>Active Habits</div>
        </div>
        <div className='bg-purple-50 p-4 rounded-lg'>
          <div className='text-2xl font-bold text-purple-700'>
            {categories?.data?.length || 0}
          </div>
          <div className='text-sm text-purple-600'>Categories</div>
        </div>
      </div>

      {/* Habits Grid */}
      {filteredHabits.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {filteredHabits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onEdit={handleEditHabit} />
          ))}
        </div>
      ) : (
        <div className='text-center py-12'>
          <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Plus className='w-12 h-12 text-gray-400' />
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            {searchTerm || filterType !== 'all' || filterStatus !== 'all'
              ? 'No habits found'
              : 'No habits yet'}
          </h3>
          <p className='text-gray-600 mb-4'>
            {searchTerm || filterType !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Start building better habits by creating your first one'}
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className='w-12 h-12 text-muted-foreground' />
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
    </div>
  );
}
