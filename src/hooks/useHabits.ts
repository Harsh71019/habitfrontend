import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type CreateHabitData, type Habit } from '@/lib/api';

export function useHabits(params?: {
  categoryId?: string;
  type?: 'binary' | 'quantitative';
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['habits', params],
    queryFn: () => api.getHabits(params),
  });
}

export function useHabit(id: string) {
  return useQuery({
    queryKey: ['habit', id],
    queryFn: () => api.getHabit(id),
    enabled: !!id,
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHabitData) => api.createHabit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateHabitData> }) =>
      api.updateHabit(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habit', id] });
      queryClient.invalidateQueries({ queryKey: ['habit-stats'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteHabit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useToggleHabitStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.toggleHabitStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useCompleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      habitId,
      completion,
    }: {
      habitId: string;
      completion: {
        date: string;
        completed: boolean;
        value?: number;
        notes?: string;
      };
    }) => api.completeHabit(habitId, completion),
    onSuccess: (_, { habitId }) => {
      queryClient.invalidateQueries({ queryKey: ['habit-completions', habitId] });
      queryClient.invalidateQueries({ queryKey: ['habit-stats', habitId] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useHabitCompletions(habitId: string, params?: {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['habit-completions', habitId, params],
    queryFn: () => api.getHabitCompletions(habitId, params),
    enabled: !!habitId,
  });
}

export function useHabitStats(habitId: string) {
  return useQuery({
    queryKey: ['habit-stats', habitId],
    queryFn: () => api.getHabitStats(habitId),
    enabled: !!habitId,
  });
}

export function useHabitStreak(habitId: string) {
  return useQuery({
    queryKey: ['habit-streak', habitId],
    queryFn: () => api.getHabitStreak(habitId),
    enabled: !!habitId,
  });
}

export function useAllUserStreaks() {
  return useQuery({
    queryKey: ['user-streaks'],
    queryFn: () => api.getAllUserStreaks(),
  });
}