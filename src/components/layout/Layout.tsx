import React from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
}

/**
 * Layout Component
 * Main application shell with optional header
 * Provides consistent layout structure across pages
 */
export const Layout: React.FC<LayoutProps> = ({ children, showHeader = true }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {showHeader && <Header />}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

