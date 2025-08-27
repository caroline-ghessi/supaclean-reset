import React from 'react';

interface StatusCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

export function StatusCard({ title, value, change, icon, color }: StatusCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    orange: 'bg-primary/10 text-primary',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
        </div>
        <span className={`text-sm font-medium ${
          change.startsWith('+') 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-red-600 dark:text-red-400'
        }`}>
          {change}
        </span>
      </div>
      <h3 className="text-2xl font-bold text-foreground">{value}</h3>
      <p className="text-sm text-muted-foreground mt-1">{title}</p>
    </div>
  );
}