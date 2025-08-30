import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { api, type CreateHabitData } from '@/lib/api';
import { Loader2 } from 'lucide-react';

const habitSchema = z.object({
  name: z.string().min(1, 'Habit name is required'),
  description: z.string().optional(),
  type: z.enum(['binary', 'quantitative']),
  target: z.object({
    value: z.number().min(1, 'Target value must be positive'),
    unit: z.string().min(1, 'Unit is required'),
  }).optional(),
  schedule: z.object({
    type: z.enum(['daily', 'weekly', 'specific_days']),
    frequency: z.number().min(1).optional(),
    days: z.array(z.number()).optional(),
  }),
  categories: z.array(z.string()).optional(),
  reminders: z.object({
    enabled: z.boolean(),
    time: z.string().optional(),
  }).optional(),
});

type HabitFormData = z.infer<typeof habitSchema>;

interface CreateHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const weekDays = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export function CreateHabitDialog({ open, onOpenChange }: CreateHabitDialogProps) {
  const queryClient = useQueryClient();
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  const form = useForm<HabitFormData>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'binary',
      schedule: {
        type: 'daily',
      },
      reminders: {
        enabled: false,
      },
    },
  });

  const createHabitMutation = useMutation({
    mutationFn: (data: CreateHabitData) => api.createHabit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      onOpenChange(false);
      form.reset();
      setSelectedDays([]);
    },
  });

  const habitType = form.watch('type');
  const scheduleType = form.watch('schedule.type');
  const remindersEnabled = form.watch('reminders.enabled');

  const onSubmit = async (data: HabitFormData) => {
    const submitData: CreateHabitData = {
      ...data,
      schedule: {
        ...data.schedule,
        ...(scheduleType === 'specific_days' && { days: selectedDays }),
      },
    };

    await createHabitMutation.mutateAsync(submitData);
  };

  const handleDayToggle = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Habit</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Habit Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Drink 8 glasses of water" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Optional description of your habit"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Habit Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select habit type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="binary">Yes/No (Complete or Incomplete)</SelectItem>
                      <SelectItem value="quantitative">Measurable (Track with Numbers)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {habitType === 'quantitative' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="target.value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Value</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="8"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target.unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="glasses, minutes, pages" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="schedule.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select schedule" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="specific_days">Specific Days</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {scheduleType === 'weekly' && (
              <FormField
                control={form.control}
                name="schedule.frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Times per Week</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="3"
                        min="1"
                        max="7"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {scheduleType === 'specific_days' && (
              <div>
                <Label>Select Days</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {weekDays.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={selectedDays.includes(day.value)}
                        onCheckedChange={() => handleDayToggle(day.value)}
                      />
                      <Label htmlFor={`day-${day.value}`} className="text-sm">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {categories?.data?.data && categories.data.data.length > 0 && (
              <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categories</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.data.data.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`cat-${category.id}`}
                            checked={field.value?.includes(category.id) || false}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, category.id]);
                              } else {
                                field.onChange(current.filter(id => id !== category.id));
                              }
                            }}
                          />
                          <Label htmlFor={`cat-${category.id}`} className="text-sm">
                            {category.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="reminders.enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Enable Reminders
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {remindersEnabled && (
              <FormField
                control={form.control}
                name="reminders.time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="time"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={createHabitMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createHabitMutation.isPending}>
                {createHabitMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Habit
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}