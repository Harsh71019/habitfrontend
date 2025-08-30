import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Aurora from '@/components/ui/Aurora';
import { useTheme } from '@/contexts/ThemeContext';

export function AuthPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { actualTheme } = useTheme();

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-30">
        <ThemeToggle />
      </div>
      
      {/* Aurora Background */}
      <div className="absolute inset-0 z-0">
        <Aurora
          colorStops={
            actualTheme === 'dark' 
              ? ["#1e1b4b", "#7c3aed", "#ec4899"]
              : ["#3A29FF", "#FF94B4", "#FF3232"]
          }
          blend={0.7}
          amplitude={1.2}
          speed={0.3}
        />
      </div>
      
      {/* Overlay for better readability */}
      <div className={`absolute inset-0 z-10 ${
        actualTheme === 'dark' ? 'bg-black/40' : 'bg-black/20'
      }`} />
      
      {/* Content */}
      <div className="w-full max-w-md relative z-20">
        {isLoginMode ? (
          <LoginForm onSwitchToRegister={() => setIsLoginMode(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setIsLoginMode(true)} />
        )}
      </div>
    </div>
  );
}