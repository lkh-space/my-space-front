import React from 'react';
import { Outlet } from 'react-router-dom';
import { SideNavBar } from './SideNavBar';
import { Header } from '../header';
import { BottomNavBar } from './BottomNavBar';
import { ErrorBoundary } from '../../shared/components/error/ErrorBoundary';
import './layout.css';

export const ShellLayout: React.FC = () => {
  return (
    <div className="shell-container">
      {/* 1. Left Sidebar (Desktop 240px, Tablet 64px, Mobile Hidden) */}
      <SideNavBar />

      {/* 2. Main Content Canvas */}
      <div className="main-canvas-area">
        <Header />
        <main className="workspace-content bg-grid-dots">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* 3. Mobile Fixed Bottom Navigation Bar (< 768px only) */}
      <BottomNavBar />
    </div>
  );
};
