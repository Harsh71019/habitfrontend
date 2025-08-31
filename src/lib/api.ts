const API_BASE_URL = 'http://localhost:3000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

interface PaginationResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    // Safely get token from localStorage
    try {
      this.token = localStorage.getItem('auth_token');
    } catch (error) {
      this.token = null;
    }
  }

  setToken(token: string) {
    this.token = token;
    try {
      localStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Failed to save token to localStorage:', error);
    }
  }

  removeToken() {
    this.token = null;
    try {
      localStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Failed to remove token from localStorage:', error);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    console.log('API Request:', {
      url,
      method: options.method || 'GET',
      hasToken: !!this.token,
      tokenPreview: this.token ? `${this.token.substring(0, 20)}...` : null,
    });

    const response = await fetch(url, config);

    console.log('API Response:', {
      url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    // Handle non-JSON responses
    let data;
    try {
      data = await response.json();
    } catch (error) {
      data = { message: 'Server error' };
    }

    if (!response.ok) {
      console.log('API Error:', { url, status: response.status, data });

      // If it's an authentication error, remove the invalid token
      if (response.status === 401 || response.status === 403) {
        console.log('Removing invalid token due to auth error');
        this.removeToken();
      }
      throw new Error(data.message || 'An error occurred');
    }
    console.log('API Data:', { url, data });
    return data;
  }

  // Auth endpoints
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    timezone?: string;
  }) {
    return this.request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: { email: string; password: string }) {
    return this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser() {
    return this.request<User>('/auth/me');
  }

  async updateUserProfile(userData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    timezone?: string;
  }) {
    return this.request<User>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }) {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  // Category endpoints
  async getCategories(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    return this.request<PaginationResponse<Category>>(`/categories?${searchParams}`);
  }

  async createCategory(category: {
    name: string;
    color?: string;
    icon?: string;
  }) {
    return this.request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateCategory(
    id: string,
    category: { name: string; color?: string; icon?: string }
  ) {
    return this.request<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id: string) {
    return this.request(`/categories/${id}`, { method: 'DELETE' });
  }

  // Habit endpoints
  async getHabits(params?: {
    categoryId?: string;
    type?: 'binary' | 'quantitative';
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.categoryId)
      searchParams.append('categoryId', params.categoryId);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.isActive !== undefined)
      searchParams.append('isActive', params.isActive.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    return this.request<PaginationResponse<Habit>>(`/habits?${searchParams}`);
  }

  async createHabit(habit: CreateHabitData) {
    return this.request<Habit>('/habits', {
      method: 'POST',
      body: JSON.stringify(habit),
    });
  }

  async getHabit(id: string) {
    return this.request<Habit>(`/habits/${id}`);
  }

  async updateHabit(id: string, habit: Partial<CreateHabitData>) {
    return this.request<Habit>(`/habits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(habit),
    });
  }

  async deleteHabit(id: string) {
    return this.request(`/habits/${id}`, { method: 'DELETE' });
  }

  async toggleHabitStatus(id: string) {
    return this.request<Habit>(`/habits/${id}/toggle`, { method: 'PATCH' });
  }

  async completeHabit(
    habitId: string,
    completion: {
      date: string;
      completed: boolean;
      value?: number;
      notes?: string;
    }
  ) {
    return this.request<HabitCompletion>(`/habits/${habitId}/complete`, {
      method: 'POST',
      body: JSON.stringify(completion),
    });
  }

  async getHabitCompletionsByHabit(
    habitId: string,
    params?: {
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    return this.request<PaginationResponse<HabitCompletion>>(
      `/habits/${habitId}/completions?${searchParams}`
    );
  }

  async updateHabitCompletion(
    habitId: string,
    date: string,
    completion: Partial<HabitCompletion>
  ) {
    return this.request<HabitCompletion>(
      `/habits/${habitId}/completions/${date}`,
      {
        method: 'PUT',
        body: JSON.stringify(completion),
      }
    );
  }

  async deleteHabitCompletion(habitId: string, date: string) {
    return this.request(`/habits/${habitId}/completions/${date}`, {
      method: 'DELETE',
    });
  }

  async getHabitStats(habitId: string) {
    return this.request<HabitStats>(`/habits/${habitId}/stats`);
  }

  async getHabitStreak(habitId: string) {
    return this.request<{ currentStreak: number; longestStreak: number }>(
      `/habits/${habitId}/streak`
    );
  }

  async getAllUserStreaks() {
    return this.request<
      Array<{
        habitId: string;
        habitName: string;
        currentStreak: number;
        longestStreak: number;
      }>
    >('/habits/streaks');
  }

  async getHabitCompletions(date: string) {
    return this.request<
      Array<{
        id: string;
        habitId: string;
        habitName: string;
        date: string;
        completed: boolean;
        value?: number;
        notes?: string;
        createdAt: string;
      }>
    >(`/habits/completions/${date}`);
  }

  // Task endpoints
  async getTasks(params?: {
    categoryId?: string;
    completed?: boolean;
    priority?: 'low' | 'medium' | 'high';
    overdue?: boolean;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.categoryId)
      searchParams.append('categoryId', params.categoryId);
    if (params?.completed !== undefined)
      searchParams.append('completed', params.completed.toString());
    if (params?.priority) searchParams.append('priority', params.priority);
    if (params?.overdue !== undefined)
      searchParams.append('overdue', params.overdue.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    return this.request<PaginationResponse<Task>>(`/tasks?${searchParams}`);
  }

  async createTask(task: CreateTaskData) {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async getTask(id: string) {
    return this.request<Task>(`/tasks/${id}`);
  }

  async updateTask(id: string, task: Partial<CreateTaskData>) {
    return this.request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    });
  }

  async deleteTask(id: string) {
    return this.request(`/tasks/${id}`, { method: 'DELETE' });
  }

  async completeTask(id: string) {
    return this.request<Task>(`/tasks/${id}/complete`, { method: 'PATCH' });
  }

  async incompleteTask(id: string) {
    return this.request<Task>(`/tasks/${id}/incomplete`, { method: 'PATCH' });
  }

  async toggleTaskCompletion(id: string) {
    return this.request<Task>(`/tasks/${id}/complete`, { method: 'PATCH' });
  }

  // Statistics endpoints
  async getStats(params?: {
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.categoryId)
      searchParams.append('categoryId', params.categoryId);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);

    return this.request<UserStats>(`/statistics/dashboard?${searchParams}`);
  }

  async getCalendarData(habitId: string, year: number, month: number) {
    return this.request<CalendarData>(
      `/habits/${habitId}/calendar/${year}/${month}`
    );
  }

  // Statistics endpoints
  async getHabitStatistics(params?: {
    startDate?: string;
    endDate?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);

    return this.request<HabitStatistics>(`/statistics/habits?${searchParams}`);
  }

  async getTaskStatistics(params?: {
    priority?: 'low' | 'medium' | 'high';
    completed?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.priority) searchParams.append('priority', params.priority);
    if (params?.completed !== undefined) searchParams.append('completed', params.completed.toString());

    return this.request<TaskStatistics>(`/statistics/tasks?${searchParams}`);
  }

  async getCategoryStatistics() {
    return this.request<CategoryStatistics>('/statistics/categories');
  }

  async getStreakStatistics(params?: {
    minStreak?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.minStreak) searchParams.append('minStreak', params.minStreak.toString());

    return this.request<StreakStatistics>(`/statistics/streaks?${searchParams}`);
  }

  async getTrendStatistics(params?: {
    period?: '7days' | '30days' | '90days' | '1year';
  }) {
    const searchParams = new URLSearchParams();
    if (params?.period) searchParams.append('period', params.period);

    return this.request<TrendStatistics>(`/statistics/trends?${searchParams}`);
  }

  async getProductivityInsights(params?: {
    period?: '7days' | '30days' | '90days' | '1year';
  }) {
    const searchParams = new URLSearchParams();
    if (params?.period) searchParams.append('period', params.period);

    return this.request<ProductivityInsights>(`/statistics/insights?${searchParams}`);
  }

  async getDailyTaskAnalytics() {
    return this.request<DailyTaskAnalytics>('/statistics/daily-tasks');
  }

  async getDailyTaskOverview() {
    return this.request<DailyTaskOverview>('/statistics/daily-tasks/overview');
  }

  // Timing Analytics Methods
  async getTimingAnalytics(params?: {
    days?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.days) searchParams.append('days', params.days.toString());

    return this.request<TimingAnalytics>(`/timing-analytics?${searchParams}`);
  }

  async getLoginPatterns(params?: {
    days?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.days) searchParams.append('days', params.days.toString());

    return this.request<{ 
      loginPatterns: TimingAnalytics['loginPatterns']; 
      summary: Partial<TimingAnalytics['summary']>; 
    }>(`/timing-analytics/login-patterns?${searchParams}`);
  }

  async getHabitTimingPatterns(params?: {
    days?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.days) searchParams.append('days', params.days.toString());

    return this.request<{ 
      habitCompletionPatterns: TimingAnalytics['habitCompletionPatterns']; 
      summary: Partial<TimingAnalytics['summary']>; 
    }>(`/timing-analytics/habit-patterns?${searchParams}`);
  }

  async getPeakPerformanceInsights(params?: {
    days?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.days) searchParams.append('days', params.days.toString());

    return this.request<PeakPerformanceInsights>(`/timing-analytics/peak-insights?${searchParams}`);
  }

  async recordLogin(data?: {
    deviceInfo?: {
      userAgent?: string;
      platform?: string;
      browser?: string;
    };
    timezone?: string;
  }) {
    return this.request<{ message: string }>('/timing-analytics/record-login', {
      method: 'POST',
      body: JSON.stringify(data || {})
    });
  }

  async recordLogout(sessionId?: string) {
    return this.request<{ message: string }>('/timing-analytics/record-logout', {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    });
  }

  // How Long endpoints
  async getCountdownData() {
    return this.request<{
      upcoming: CountdownTask[];
      overdue: CountdownTask[];
      birthdays: CountdownTask[];
      summary: {
        totalUpcoming: number;
        totalOverdue: number;
        totalBirthdays: number;
        nextDeadline: CountdownTask | null;
      };
    }>('/how-long/countdown');
  }

  async getAppUsageStats() {
    return this.request<AppUsageStats>('/how-long/app-usage');
  }

  async getTimeRemainingSummary() {
    return this.request<{
      urgent: number;
      thisWeek: number;
      overdue: number;
    }>('/how-long/summary');
  }

  // Daily Tasks endpoints
  async getDailyTasks() {
    return this.request<DailyTask[]>('/daily-tasks');
  }

  async getArchivedDailyTasks(page: number = 1, limit: number = 20) {
    return this.request<DailyTask[], { pagination: any }>(`/daily-tasks/archived?page=${page}&limit=${limit}`);
  }

  async createDailyTask(data: CreateDailyTaskData) {
    return this.request<DailyTask>('/daily-tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateDailyTask(id: string, data: Partial<CreateDailyTaskData>) {
    return this.request<DailyTask>(`/daily-tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async markDailyTask(id: string, data: { date: string; completed: boolean; notes?: string }) {
    return this.request<DailyTask>(`/daily-tasks/${id}/mark`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async archiveDailyTask(id: string) {
    return this.request<DailyTask>(`/daily-tasks/${id}/archive`, {
      method: 'POST'
    });
  }

  async unarchiveDailyTask(id: string) {
    return this.request<DailyTask>(`/daily-tasks/${id}/unarchive`, {
      method: 'POST'
    });
  }

  async deleteDailyTask(id: string) {
    return this.request<{ message: string }>(`/daily-tasks/${id}`, {
      method: 'DELETE'
    });
  }

  async getDailyTaskStats() {
    return this.request<DailyTaskStats>('/daily-tasks/stats');
  }

  async getDailyTaskCalendar(year?: number, month?: number) {
    const searchParams = new URLSearchParams();
    if (year) searchParams.append('year', year.toString());
    if (month) searchParams.append('month', month.toString());
    
    return this.request<DailyTaskCalendarData[]>(`/daily-tasks/calendar?${searchParams}`);
  }
}

// Type definitions
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  timezone: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  type: 'binary' | 'quantitative';
  target: {
    value: number;
    unit: string;
  };
  schedule: {
    type: 'daily' | 'weekly' | 'specific_days';
    frequency?: number;
    days?: number[];
  };
  categories: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  reminders: {
    enabled: boolean;
    time?: string;
  };
  isActive: boolean;
  createdAt: string;
}

export interface CreateHabitData {
  name: string;
  description?: string;
  icon?: string;
  type: 'binary' | 'quantitative';
  target?: {
    value: number;
    unit: string;
  };
  schedule: {
    type: 'daily' | 'weekly' | 'specific_days';
    frequency?: number;
    days?: number[];
  };
  categories?: string[];
  reminders?: {
    enabled: boolean;
    time?: string;
  };
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  value?: number;
  notes?: string;
  createdAt: string;
}

export interface HabitStats {
  habitId: string;
  habitName: string;
  type: 'binary' | 'quantitative';
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  totalCompletions: number;
  averageValue?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  deadline: string;
  completed: boolean;
  completedAt?: string;
  priority: 'low' | 'medium' | 'high';
  categories: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
  }>;
  isBirthday?: boolean;
  birthdayPerson?: {
    name?: string;
    relationship?: string;
    isOwnBirthday?: boolean;
  };
  recurringBirthday?: {
    enabled?: boolean;
    year?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  deadline: string;
  priority?: 'low' | 'medium' | 'high';
  categories?: string[];
  isBirthday?: boolean;
  birthdayPerson?: {
    name?: string;
    relationship?: string;
    isOwnBirthday?: boolean;
  };
  recurringBirthday?: {
    enabled?: boolean;
    year?: number;
  };
}

export interface UserStats {
  habits: {
    total: number;
    active: number;
    inactive: number;
    completionRate: number;
    streaksSummary: {
      totalStreaks: number;
      longestStreak: number;
      averageStreak: number;
    };
  };
  tasks: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
    byPriority: {
      high: number;
      medium: number;
      low: number;
    };
  };
  categories: {
    total: number;
    mostUsed: {
      name: string;
      habitCount: number;
      taskCount: number;
      total: number;
    };
  };
  recent: {
    lastWeekCompletions: number;
    todayCompletions: number;
    recentlyCompleted: Array<{
      type: 'habit' | 'task';
      name: string;
      completedAt: string;
    }>;
  };
}

export interface CalendarData {
  year: number;
  month: number;
  completions: {
    [date: string]: {
      completed: boolean;
      value?: number;
    };
  };
}

export interface HabitStatistics {
  overview: {
    totalHabits: number;
    activeHabits: number;
    averageCompletionRate: number;
  };
  completionTrends: {
    last7Days: Array<{
      date: string;
      completions: number;
      total: number;
      rate: number;
    }>;
    last30Days: number;
  };
  habitBreakdown: Array<{
    habitId: string;
    name: string;
    type: string;
    completionRate: number;
    currentStreak: number;
    longestStreak: number;
    lastCompleted: string | null;
  }>;
  streaks: {
    summary: {
      totalActiveStreaks: number;
      averageStreak: number;
      longestEver: number;
    };
    top: Array<{
      habitName: string;
      currentStreak: number;
    }>;
  };
}

export interface TaskStatistics {
  overview: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
  breakdown: {
    byPriority: {
      high: { total: number; completed: number };
      medium: { total: number; completed: number };
      low: { total: number; completed: number };
    };
    byStatus: {
      completed: number;
      pending: number;
      overdue: number;
    };
  };
  trends: {
    recentCompletions: Array<{
      taskId: string;
      title: string;
      completedAt: string;
      priority: string;
    }>;
    upcomingDeadlines: Array<{
      taskId: string;
      title: string;
      deadline: string;
      daysUntilDue: number;
    }>;
  };
}

export interface CategoryStatistics {
  overview: {
    totalCategories: number;
    averageItemsPerCategory: number;
  };
  breakdown: Array<{
    categoryId: string;
    name: string;
    color: string;
    icon: string;
    habitCount: number;
    taskCount: number;
    totalItems: number;
    completionStats: {
      habitCompletions: number;
      taskCompletions: number;
      overallCompletionRate: number;
    };
  }>;
}

export interface StreakStatistics {
  summary: {
    totalHabits: number;
    activeStreaks: number;
    longestStreak: number;
    averageStreak: number;
    totalCompletions: number;
  };
  currentStreaks: Array<{
    habitId: string;
    habitName: string;
    currentStreak: number;
    longestStreak: number;
    lastCompletedDate: string | null;
  }>;
  leaderboard: Array<{
    rank: number;
    habitName: string;
    currentStreak: number;
  }>;
  achievements: {
    milestones: Array<{
      type: 'streak' | 'completion';
      achievement: string;
      habitName: string;
      value: number;
      achievedAt: string;
    }>;
  };
}

export interface TrendStatistics {
  habitTrends: {
    daily: Array<{
      date: string;
      completions: number;
      totalHabits: number;
      completionRate: number;
      activeHabits: number;
      dayOfWeek: string;
      isWeekend: boolean;
    }>;
    weekly: Array<{
      week: string;
      totalCompletions: number;
      totalTasks: number;
      avgCompletionRate: number;
      daysActive: number;
      productivity: number;
    }>;
    monthly: Array<{
      month: string;
      totalCompletions: number;
      totalTasks: number;
      avgCompletionRate: number;
      daysActive: number;
      totalDays: number;
      consistency: number;
    }>;
  };
  taskTrends: {
    daily: Array<{
      date: string;
      completed: number;
      created: number;
      overdue: number;
      high: number;
      medium: number;
      low: number;
      productivity: number;
      dayOfWeek: string;
      efficiency: number;
    }>;
    weekly: any[];
    monthly: any[];
  };
  combinedActivity: {
    totalActions: number;
    streakScore: number;
    productivityScore: number;
    avgDailyCompletions: number;
    avgDailyTasks: number;
    peakProductivityDay: string;
    consistencyScore: number;
    totalDaysActive: number;
  };
}

export interface ProductivityInsights {
  timeframe: {
    startDate: string;
    endDate: string;
    period: string;
    totalDays: number;
  };
  daily: Array<{
    date: string;
    habitCompletions: number;
    taskCompletions: number;
    quantitativeValue: number;
    totalActions: number;
    habitRate: number;
    productivity: number;
    dayOfWeek: string;
    isWeekend: boolean;
    momentum: number;
  }>;
  weeklyPatterns: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  performance: {
    avgDailyCompletions: number;
    avgDailyTasks: number;
    bestPerformanceDay: string;
    bestPerformanceScore: number;
    consistencyScore: number;
    totalActiveDays: number;
  };
  categories: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
    habitCount: number;
    taskCount: number;
    habitCompletionRate: number;
    taskCompletionRate: number;
    overallScore: number;
    totalItems: number;
  }>;
  insights: {
    mostProductiveDay: {
      day: string;
      actions: number;
    };
    weekendVsWeekday: {
      weekend: number;
      weekday: number;
    };
  };
}

// Timing Analytics Types
export interface TimingAnalytics {
  loginPatterns: {
    hourlyDistribution: Array<{
      hour: number;
      count: number;
      avgSessionDuration?: number;
    }>;
    dailyDistribution: Array<{
      dayOfWeek: number;
      dayName: string;
      count: number;
      avgSessionDuration?: number;
    }>;
    peakLoginHours: Array<{
      hour: number;
      count: number;
      percentage: number;
    }>;
    weekendVsWeekday: {
      weekend: { count: number; avgSessionDuration?: number };
      weekday: { count: number; avgSessionDuration?: number };
    };
  };
  habitCompletionPatterns: {
    hourlyDistribution: Array<{
      hour: number;
      totalCompletions: number;
      uniqueHabitsCount: number;
      weekendCompletions: number;
      weekdayCompletions: number;
    }>;
    dailyDistribution: Array<{
      dayOfWeek: number;
      dayName: string;
      totalCompletions: number;
      avgCompletionHour: number;
    }>;
    peakCompletionHours: Array<{
      hour: number;
      count: number;
      percentage: number;
    }>;
    weekendVsWeekday: {
      weekend: { count: number; avgHour: number };
      weekday: { count: number; avgHour: number };
    };
  };
  correlationInsights: {
    loginVsCompletionCorrelation: number;
    mostProductiveHoursAfterLogin: Array<{
      hourAfterLogin: number;
      completionRate: number;
    }>;
    sessionDurationVsCompletions: Array<{
      sessionDurationRange: string;
      avgCompletions: number;
    }>;
  };
  summary: {
    totalLogins: number;
    totalCompletions: number;
    avgLoginsPerDay: number;
    avgCompletionsPerDay: number;
    mostActiveHour: number;
    mostActiveDay: string;
    bestPerformanceCorrelation: string;
  };
}

export interface PeakPerformanceInsights {
  peakLoginHour: {
    hour: number;
    count: number;
    percentage: number;
  };
  peakCompletionHour: {
    hour: number;
    count: number;
    percentage: number;
  };
  mostProductiveHoursAfterLogin: Array<{
    hourAfterLogin: number;
    completionRate: number;
  }>;
  sessionDurationVsCompletions: Array<{
    sessionDurationRange: string;
    avgCompletions: number;
  }>;
  weekendVsWeekdayPreference: {
    login: {
      weekend: { count: number; avgSessionDuration?: number };
      weekday: { count: number; avgSessionDuration?: number };
    };
    completion: {
      weekend: { count: number; avgHour: number };
      weekday: { count: number; avgHour: number };
    };
  };
  recommendations: string[];
}

// How Long / Countdown Types
export interface CountdownTask {
  id: string;
  title: string;
  description?: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  isBirthday?: boolean;
  birthdayPerson?: {
    name?: string;
    relationship?: string;
    isOwnBirthday?: boolean;
  };
  categories: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
  }>;
  timeRemaining: {
    days: number;
    hours: number;
    minutes: number;
    totalDays: number;
    totalHours: number;
    totalMinutes: number;
    isOverdue: boolean;
  };
}

export interface AppUsageStats {
  totalLogins: number;
  uniqueLoginDays: number;
  avgSessionDuration: number; // in minutes
  totalHabits: number;
  totalTasks: number;
  totalCompletions: number;
  daysSinceMember: number;
  memberSince: string;
  mostActiveHour: number;
  loginFrequency: string;
  interestingFacts: string[];
}

// Daily Tasks Types
export interface DailyTaskCompletion {
  date: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

export interface DailyTask {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  isActive: boolean;
  archived: boolean;
  archivedAt?: string;
  categories: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
  }>;
  dailyCompletions: DailyTaskCompletion[];
  todayCompletion?: DailyTaskCompletion;
  completionStreak: number;
  totalCompletions: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyTaskData {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  categories?: string[];
}

export interface DailyTaskStats {
  totalActive: number;
  totalArchived: number;
  thisMonthCompletions: number;
  topTasks: Array<{
    _id: string;
    title: string;
    completions: number;
  }>;
}

export interface DailyTaskCalendarData {
  date: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  tasks: Array<{
    taskId: string;
    title: string;
    completed: boolean;
    notes?: string;
  }>;
}

export interface DailyTaskAnalytics {
  overview: {
    totalTasks: number;
    activeTasks: number;
    archivedTasks: number;
    completionRate: number;
  };
  completionTrends: Array<{
    date: string;
    completions: number;
  }>;
  weeklyPatterns: Array<{
    day: string;
    dayOfWeek: number;
    completions: number;
  }>;
  topPerformingTasks: Array<{
    _id: string;
    title: string;
    completions: number;
    priority: string;
  }>;
  recentActivity: Array<{
    _id: string;
    title: string;
    completedAt: string;
    date: string;
  }>;
  summary: {
    last7DaysCompletions: number;
    averageDailyCompletions: number;
    mostProductiveDay: string;
  };
}

export interface DailyTaskOverview {
  totalCreated: number;
  totalActive: number;
  totalArchived: number;
  totalCompleted: number;
  todayCompleted: number;
  thisMonthCompleted: number;
}

export const api = new ApiClient();
export type { ApiResponse, PaginationResponse };
