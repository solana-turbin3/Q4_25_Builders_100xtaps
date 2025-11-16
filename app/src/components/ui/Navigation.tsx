'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Navigation: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { path: '/', icon: '📊', label: 'Chart' },
    { path: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
    { path: '/profile', icon: '👤', label: 'Profile' },
  ];

  return (
    <div className="p-2 bg-black/60 flex justify-around border-t border-purple-500/20">
      {navItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={`flex flex-col items-center p-2 transition ${
            pathname === item.path ? 'text-purple-300' : 'text-gray-500'
          }`}
        >
          <span className="text-lg sm:text-xl">{item.icon}</span>
          <span className="text-[10px] sm:text-xs">{item.label}</span>
        </Link>
      ))}
    </div>
  );
};