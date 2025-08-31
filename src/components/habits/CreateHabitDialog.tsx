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
import { 
  Loader2, 
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
  Gamepad2,
  ChevronDown
} from 'lucide-react';

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

const popularIcons: { name: IconName; label: string }[] = [
  { name: 'Droplets', label: 'Water' },
  { name: 'Activity', label: 'Activity' },
  { name: 'PersonStanding', label: 'Exercise' },
  { name: 'Dumbbell', label: 'Workout' },
  { name: 'Book', label: 'Reading' },
  { name: 'Brain', label: 'Learning' },
  { name: 'Heart', label: 'Wellness' },
  { name: 'Coffee', label: 'Morning' },
  { name: 'Moon', label: 'Sleep' },
  { name: 'Sun', label: 'Energy' },
  { name: 'Music', label: 'Creative' },
  { name: 'Camera', label: 'Hobby' },
  { name: 'Smartphone', label: 'Digital' },
  { name: 'Target', label: 'Goal' }
];

const habitSchema = z.object({
  name: z.string().min(1, 'Habit name is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
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

const habitTemplates = [
  {
    category: 'HEALTHY HABITS',
    icon: 'Heart',
    habits: [
      {
        name: 'Drink water',
        description: 'Stay hydrated throughout the day',
        icon: 'Droplets',
        type: 'quantitative' as const,
        target: { value: 8, unit: 'glasses' },
        schedule: { type: 'daily' as const }
      },
      {
        name: 'Eat vegetables',
        description: 'Include vegetables in your meals',
        icon: 'Activity',
        type: 'quantitative' as const,
        target: { value: 5, unit: 'servings' },
        schedule: { type: 'daily' as const }
      },
      {
        name: 'Brush teeth',
        description: 'Maintain good oral hygiene',
        icon: 'Heart',
        type: 'binary' as const,
        schedule: { type: 'daily' as const }
      }
    ]
  },
  {
    category: 'DIGITAL HABITS',
    icon: 'Smartphone',
    habits: [
      {
        name: 'Reduce social media',
        description: 'Limit social media usage',
        icon: 'Smartphone',
        type: 'quantitative' as const,
        target: { value: 30, unit: 'minutes' },
        schedule: { type: 'daily' as const }
      },
      {
        name: 'Reduce alcohol',
        description: 'Limit alcohol consumption',
        icon: 'Activity',
        type: 'binary' as const,
        schedule: { type: 'daily' as const }
      },
      {
        name: 'Eat fewer sweets',
        description: 'Reduce sugar intake',
        icon: 'Target',
        type: 'binary' as const,
        schedule: { type: 'daily' as const }
      }
    ]
  },
  {
    category: 'FITNESS',
    icon: 'Dumbbell',
    habits: [
      {
        name: 'Take a walk',
        description: 'Daily walk for exercise',
        icon: 'PersonStanding',
        type: 'quantitative' as const,
        target: { value: 30, unit: 'minutes' },
        schedule: { type: 'daily' as const }
      },
      {
        name: 'Go to the gym',
        description: 'Regular gym workout',
        icon: 'Dumbbell',
        type: 'binary' as const,
        schedule: { type: 'weekly' as const, frequency: 3 }
      },
      {
        name: 'Track weight',
        description: 'Monitor weight progress',
        icon: 'Activity',
        type: 'quantitative' as const,
        target: { value: 1, unit: 'measurement' },
        schedule: { type: 'weekly' as const, frequency: 1 }
      }
    ]
  }
];

export function CreateHabitDialog({ open, onOpenChange }: CreateHabitDialogProps) {
  const queryClient = useQueryClient();
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showIconPicker, setShowIconPicker] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  const form = useForm<HabitFormData>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: 'Target',
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

  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    
    if (templateKey === 'custom') {
      // Reset form for custom habit
      form.reset({
        name: '',
        description: '',
        icon: 'Target',
        type: 'binary',
        schedule: { type: 'daily' },
        reminders: { enabled: false },
      });
      setSelectedDays([]);
      return;
    }

    // Find the selected template
    const template = habitTemplates
      .flatMap(cat => cat.habits)
      .find((_, index) => `${index}` === templateKey);
    
    if (template) {
      form.reset({
        name: template.name,
        description: template.description,
        icon: template.icon || 'Target',
        type: template.type,
        target: template.target,
        schedule: template.schedule,
        reminders: { enabled: false },
      });
      
      if (template.schedule.type === 'specific_days' && template.schedule.days) {
        setSelectedDays(template.schedule.days);
      } else {
        setSelectedDays([]);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Habit</DialogTitle>
        </DialogHeader>

        {/* Habit Template Selector */}
        <div className="space-y-3">
          <Label>Choose a habit template or create custom</Label>
          <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a habit template" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="custom">
                <div className="flex items-center gap-2">
                  <span>➕</span>
                  <span>Create a custom habit</span>
                </div>
              </SelectItem>
              
              {habitTemplates.map((category, categoryIndex) => (
                <div key={category.category}>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {category.category}
                  </div>
                  {category.habits.map((habit, habitIndex) => {
                    const templateKey = `${categoryIndex * 10 + habitIndex}`;
                    const IconComponent = iconMap[habit.icon as IconName] || Target;
                    return (
                      <SelectItem key={templateKey} value={templateKey}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4" />
                          <span>{habit.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

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
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setShowIconPicker(!showIconPicker)}
                      >
                        {(() => {
                          const IconComponent = iconMap[field.value as IconName] || Target;
                          return <IconComponent className="w-4 h-4 mr-2" />;
                        })()}
                        <span>Choose an icon</span>
                        <ChevronDown className="w-4 h-4 ml-auto" />
                      </Button>
                      {showIconPicker && (
                        <div className="absolute z-50 mt-2 w-full bg-popover border rounded-md shadow-lg p-3">
                          <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
                            {popularIcons.map((iconInfo) => {
                              const IconComponent = iconMap[iconInfo.name];
                              return (
                                <Button
                                  key={iconInfo.name}
                                  type="button"
                                  variant={field.value === iconInfo.name ? "default" : "outline"}
                                  size="sm"
                                  className="h-10 w-10 p-0"
                                  onClick={() => {
                                    field.onChange(iconInfo.name);
                                    setShowIconPicker(false);
                                  }}
                                  title={iconInfo.label}
                                >
                                  <IconComponent className="w-4 h-4" />
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
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