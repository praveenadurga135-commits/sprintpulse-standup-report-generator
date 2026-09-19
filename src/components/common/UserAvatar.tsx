import React, { useState } from 'react';

interface UserAvatarProps {
  user?: { name: string; avatar?: string } | null;
  name?: string | null;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  name, 
  avatarUrl, 
  size = 'md', 
  className = '' 
}) => {
  const [imgError, setImgError] = useState(false);

  const effectiveName = user?.name || name || '';
  const effectiveAvatar = user?.avatar || avatarUrl || '';

  const initial = effectiveName.trim().length > 0 ? effectiveName.trim().charAt(0).toUpperCase() : '?';

  // Deterministic background color based on user name
  const colors = [
    'bg-indigo-600',
    'bg-blue-600',
    'bg-emerald-600',
    'bg-purple-600',
    'bg-rose-600',
    'bg-amber-600',
    'bg-teal-600',
    'bg-cyan-600',
  ];
  
  const charCodeSum = effectiveName
    ? effectiveName.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)
    : 0;
  const bgColor = colors[charCodeSum % colors.length];

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-20 h-20 text-3xl',
  };

  if (effectiveAvatar && effectiveAvatar.trim().length > 0 && !imgError) {
    return (
      <img
        src={effectiveAvatar}
        alt={effectiveName || 'User'}
        onError={() => setImgError(true)}
        className={`${sizeClasses[size]} rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full ${bgColor} text-white font-bold flex items-center justify-center flex-shrink-0 shadow-sm select-none uppercase ${className}`}
      title={effectiveName}
    >
      {initial}
    </div>
  );
};
