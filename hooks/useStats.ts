'use client';

import { useState, useCallback, useMemo } from 'react';
import { useUsers } from './useUsers';
import { useClients } from './useClients';
import { useLoans } from './useLoans';
import { StatsUtils, type DashboardStats, type ClientsStats, type LoansStats } from '@/lib/stats-utils';

export const useStats = () => {
  // Use hooks to ensure auto-initialization
  const { users, isLoading: usersLoading, error: usersError } = useUsers();
  const { clients, isLoading: clientsLoading, error: clientsError } = useClients();
  const { loans, isLoading: loansLoading, error: loansError } = useLoans();

  // Local state for loading and errors
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate dashboard stats using real data
  const dashboardStats: DashboardStats = useMemo(() => {
    return StatsUtils.calculateDashboardStats(clients, loans);
  }, [clients, loans]);

  // Calculate detailed client stats
  const clientsStats: ClientsStats = useMemo(() => {
    return StatsUtils.calculateClientStats(clients);
  }, [clients]);

  // Calculate detailed loan stats  
  const loansStats: LoansStats = useMemo(() => {
    return StatsUtils.calculateLoanStats(loans);
  }, [loans]);

  // Legacy user stats (for compatibility)
  const userStats = useMemo(() => {
    const totalUsers = users.length;
    const adminUsers = users.filter((u) => u.role === 'admin').length;
    const subadminUsers = users.filter((u) => u.role === 'subadmin').length;
    const prestamistatUsers = users.filter(
      (u) => u.role === 'prestamista' || u.role === 'manager'
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
  const refreshStats = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Stats are automatically recalculated via useMemo when data changes
    } catch (err: any) {
      setError(err.message || 'Failed to refresh stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Combined loading state from all data sources
  const combinedLoading = isLoading || usersLoading || clientsLoading || loansLoading;

  // Combined error state from all data sources
  const combinedError = error || usersError || clientsError || loansError;

  return {
    // New comprehensive stats
    dashboardStats,
    clientsStats,
    loansStats,

    // Legacy stats (for backward compatibility)
    stats: userStats,

    // Loading and error states
    isLoading: combinedLoading,
    error: combinedError,

    // Actions
    refreshStats,
    clearError,

    // Legacy compatibility methods
    totalUsers: users.length,
    adminUsers: users.filter((u) => u.role === 'admin').length,
    usersByRole: (role: string) => users.filter((u) => u.role === role),

    // Utility functions
    formatCurrency: StatsUtils.formatCurrency,
    formatPercentage: StatsUtils.formatPercentage,
  };
};
