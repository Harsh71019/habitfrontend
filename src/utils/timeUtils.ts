import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, isPast, isToday } from 'date-fns';

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOverdue: boolean;
  totalMinutes: number;
}

export function calculateTimeRemaining(deadline: string): TimeRemaining {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  
  if (isPast(deadlineDate)) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isOverdue: true,
      totalMinutes: 0
    };
  }

  const totalMinutes = differenceInMinutes(deadlineDate, now);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  const seconds = differenceInSeconds(deadlineDate, now) % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    isOverdue: false,
    totalMinutes
  };
}

export function formatTimeRemaining(timeRemaining: TimeRemaining): string {
  if (timeRemaining.isOverdue) {
    return "Overdue";
  }

  if (timeRemaining.days > 0) {
    if (timeRemaining.days === 1) {
      return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
    }
    return `${timeRemaining.days}d ${timeRemaining.hours}h`;
  }

  if (timeRemaining.hours > 0) {
    return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
  }

  if (timeRemaining.minutes > 0) {
    return `${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
  }

  return `${timeRemaining.seconds}s`;
}

export function getTimeUrgencyColor(timeRemaining: TimeRemaining): string {
  if (timeRemaining.isOverdue) {
    return 'text-red-500';
  }

  if (timeRemaining.totalMinutes <= 60) { // Less than 1 hour
    return 'text-red-500';
  }

  if (timeRemaining.totalMinutes <= 24 * 60) { // Less than 1 day
    return 'text-orange-500';
  }

  if (timeRemaining.totalMinutes <= 3 * 24 * 60) { // Less than 3 days
    return 'text-yellow-600';
  }

  return 'text-green-600';
}

export function getUrgencyBadgeVariant(timeRemaining: TimeRemaining): 'destructive' | 'default' | 'secondary' {
  if (timeRemaining.isOverdue || timeRemaining.totalMinutes <= 60) {
    return 'destructive';
  }

  if (timeRemaining.totalMinutes <= 24 * 60) {
    return 'default';
  }

  return 'secondary';
}