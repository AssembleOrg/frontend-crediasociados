import { create } from 'zustand';

interface WalletRecord {
  userId: string;
  balance: number;
  currency: string;
  availableForLoan: number;
  lockedAmount: number;
  lastUpdated: number;
}

interface WalletsState {
  wallets: Map<string, WalletRecord>;
  currentUserWallet: WalletRecord | null;

  // Actions
  setCurrentUserWallet: (
    wallet: Omit<WalletRecord, 'userId' | 'lastUpdated'> | null
  ) => void;
  updateWalletBalance: (userId: string, newBalance: number) => void;
  invalidateWallet: (userId: string) => void;
  invalidateAll: () => void;
  getWallet: (userId: string) => WalletRecord | undefined;
}

export const useWalletsStore = create<WalletsState>((set, get) => ({
  wallets: new Map(),
  currentUserWallet: null,

  setCurrentUserWallet: (
    wallet: Omit<WalletRecord, 'userId' | 'lastUpdated'> | null
  ) => {
    set((state) => ({
      currentUserWallet: wallet
        ? {
            ...wallet,
            userId: 'current',
            lastUpdated: Date.now(),
          }
        : null,
    }));
  },

  updateWalletBalance: (userId: string, newBalance: number) => {
    set((state) => {
      const newWallets = new Map(state.wallets);
      const existing = newWallets.get(userId);

      if (existing) {
        newWallets.set(userId, {
          ...existing,
          balance: newBalance,
          availableForLoan: newBalance,
          lastUpdated: Date.now(),
        });
      } else {
        newWallets.set(userId, {
          userId,
          balance: newBalance,
          currency: 'ARS',
          availableForLoan: newBalance,
          lockedAmount: 0,
          lastUpdated: Date.now(),
        });
      }

      return { wallets: newWallets };
    });
  },

  invalidateWallet: (userId: string) => {
    set((state) => {
      const newWallets = new Map(state.wallets);
      newWallets.delete(userId);
      return { wallets: newWallets };
    });
  },

  invalidateAll: () => {
    set({
      wallets: new Map(),
      currentUserWallet: null,
    });
  },

  getWallet: (userId: string) => {
    return get().wallets.get(userId);
  },
}));
