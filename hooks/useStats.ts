'use client';

import { useState, useCallback } from 'react';
import { useUsers } from './useUsers';

export const useStats = () => {
  // Use useUsers to ensure auto-initialization
  const { users, isLoading: usersLoading, error: usersError } = useUsers();

  // Local state for loading and errors
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateDashboardStats = useCallback(() => {
    const totalUsers = users.length;
    const adminUsers = users.filter((u) => u.role === 'admin').length;
    const subadminUsers = users.filter((u) => u.role === 'subadmin').length;
    const prestamistatUsers = users.filter(
      (u) => u.role === 'prestamista'
    ).length;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = users.filter(
      (u) => new Date(u.createdAt) >= thirtyDaysAgo
    ).length;

    return {
      users: {
        total: totalUsers,
        admin: adminUsers,
        subadmin: subadminUsers,
        prestamista: prestamistatUsers,
        recent: recentUsers,
      },
      activity: {
        newUsersThisMonth: recentUsers,
        activeRoles: [
          adminUsers > 0 ? 'admin' : null,
          subadminUsers > 0 ? 'subadmin' : null,
          prestamistatUsers > 0 ? 'prestamista' : null,
        ].filter(Boolean).length,
      },
      growth: {
        userGrowthRate: totalUsers > 0 ? (recentUsers / totalUsers) * 100 : 0,
      },
    };
  }, [users]);

  /**
   * Load and calculate stats
   */
  const loadStats = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Simple calculation - no API calls for now
      calculateDashboardStats();
    } catch (err: any) {
      setError(err.message || 'Failed to calculate stats');
    } finally {
      setIsLoading(false);
    }
  }, [calculateDashboardStats]);

  const refreshStats = useCallback(() => {
    return loadStats();
  }, [loadStats]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const stats = calculateDashboardStats();

  return {
    stats,

    isLoading: isLoading || usersLoading,
    error: error || usersError,

    loadStats,
    refreshStats,
    clearError,
    calculateDashboardStats,

    totalUsers: users.length,
    adminUsers: users.filter((u) => u.role === 'admin').length,
    usersByRole: (role: string) => users.filter((u) => u.role === role),
  };
};
