import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Gift, Target, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { format, addDays } from 'date-fns';

interface CreateCountdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCountdownDialog({ open, onOpenChange }: CreateCountdownDialogProps) {
  const [activeTab, setActiveTab] = useState<'task' | 'birthday'>('task');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  
  // Birthday specific fields
  const [birthdayName, setBirthdayName] = useState('');
  const [birthdayRelationship, setBirthdayRelationship] = useState('');
  const [isOwnBirthday, setIsOwnBirthday] = useState(false);
  const [birthdayDate, setBirthdayDate] = useState('');
  const [recurringEnabled, setRecurringEnabled] = useState(true);

  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: (taskData: any) => api.createTask(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countdown-data'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      handleClose();
    },
  });

  const createBirthdayMutation = useMutation({
    mutationFn: (birthdayData: any) => {
      // Create as a regular task with birthday flags
      return api.createTask({
        title: birthdayData.isOwnBirthday ? 'My Birthday 🎂' : `${birthdayData.name}'s Birthday 🎂`,
        description: `Birthday reminder for ${birthdayData.isOwnBirthday ? 'yourself' : birthdayData.name}${birthdayData.relationship ? ` (${birthdayData.relationship})` : ''}`,
        deadline: birthdayData.deadline,
        priority: 'medium',
        isBirthday: true,
        birthdayPerson: {
          name: birthdayData.isOwnBirthday ? 'You' : birthdayData.name,
          relationship: birthdayData.isOwnBirthday ? 'Self' : birthdayData.relationship,
          isOwnBirthday: birthdayData.isOwnBirthday || false
        },
        recurringBirthday: {
          enabled: birthdayData.recurringEnabled || false,
          year: new Date(birthdayData.deadline).getFullYear()
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countdown-data'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      handleClose();
    },
  });

  const handleClose = () => {
    setTaskTitle('');
    setTaskDescription('');
    setTaskDeadline('');
    setTaskPriority('medium');
    setBirthdayName('');
    setBirthdayRelationship('');
    setIsOwnBirthday(false);
    setBirthdayDate('');
    setRecurringEnabled(true);
    setActiveTab('task');
    onOpenChange(false);
  };

  const handleCreateTask = () => {
    if (!taskTitle.trim() || !taskDeadline) return;

    createTaskMutation.mutate({
      title: taskTitle.trim(),
      description: taskDescription.trim() || undefined,
      deadline: taskDeadline,
      priority: taskPriority,
    });
  };

  const handleCreateBirthday = () => {
    if (!birthdayName.trim() || !birthdayDate) return;

    createBirthdayMutation.mutate({
      name: birthdayName.trim(),
      relationship: birthdayRelationship.trim() || undefined,
      isOwnBirthday,
      deadline: birthdayDate,
      recurringEnabled,
      year: new Date(birthdayDate).getFullYear()
    });
  };

  // Quick date presets
  const getQuickDate = (days: number) => {
    const date = addDays(new Date(), days);
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };

  const relationships = [
    'Family', 'Friend', 'Colleague', 'Partner', 'Parent', 
    'Sibling', 'Child', 'Relative', 'Neighbor', 'Other'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Add New Countdown
          </DialogTitle>
          <DialogDescription>
            Create a task deadline or birthday reminder to track
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="task" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Task
            </TabsTrigger>
            <TabsTrigger value="birthday" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Birthday
            </TabsTrigger>
          </TabsList>

          <TabsContent value="task" className="space-y-4">
            <div>
              <label className="text-sm font-medium">Task Title</label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Enter task title..."
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Add task description..."
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Deadline</label>
              <Input
                type="datetime-local"
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
                className="mt-1"
                min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
              />
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTaskDeadline(getQuickDate(1))}
                >
                  Tomorrow
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTaskDeadline(getQuickDate(7))}
                >
                  1 Week
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTaskDeadline(getQuickDate(30))}
                >
                  1 Month
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Priority</label>
              <Select value={taskPriority} onValueChange={(value: any) => setTaskPriority(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <Badge variant="secondary" className="mr-2">Low</Badge>
                    Low Priority
                  </SelectItem>
                  <SelectItem value="medium">
                    <Badge variant="default" className="mr-2">Medium</Badge>
                    Medium Priority
                  </SelectItem>
                  <SelectItem value="high">
                    <Badge variant="destructive" className="mr-2">High</Badge>
                    High Priority
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="birthday" className="space-y-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Is this your birthday?</label>
              <Button
                size="sm"
                variant={isOwnBirthday ? "default" : "outline"}
                onClick={() => setIsOwnBirthday(!isOwnBirthday)}
              >
                {isOwnBirthday ? "My Birthday" : "Someone Else's"}
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium">
                {isOwnBirthday ? "Your Name" : "Person's Name"}
              </label>
              <Input
                value={birthdayName}
                onChange={(e) => setBirthdayName(e.target.value)}
                placeholder={isOwnBirthday ? "Your name..." : "Person's name..."}
                className="mt-1"
              />
            </div>

            {!isOwnBirthday && (
              <div>
                <label className="text-sm font-medium">Relationship</label>
                <Select value={birthdayRelationship} onValueChange={setBirthdayRelationship}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select relationship..." />
                  </SelectTrigger>
                  <SelectContent>
                    {relationships.map((rel) => (
                      <SelectItem key={rel} value={rel.toLowerCase()}>
                        {rel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Birthday Date</label>
              <Input
                type="date"
                value={birthdayDate}
                onChange={(e) => setBirthdayDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Recurring yearly?</label>
              <Button
                size="sm"
                variant={recurringEnabled ? "default" : "outline"}
                onClick={() => setRecurringEnabled(!recurringEnabled)}
              >
                {recurringEnabled ? "Yes" : "No"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {activeTab === 'task' ? (
            <Button 
              onClick={handleCreateTask}
              disabled={!taskTitle.trim() || !taskDeadline || createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          ) : (
            <Button 
              onClick={handleCreateBirthday}
              disabled={!birthdayName.trim() || !birthdayDate || createBirthdayMutation.isPending}
            >
              {createBirthdayMutation.isPending ? 'Creating...' : 'Create Birthday'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}