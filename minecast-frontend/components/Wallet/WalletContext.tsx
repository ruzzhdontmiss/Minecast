"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WalletContextType {
  isOpen: boolean;
  openWallet: () => void;
  closeWallet: () => void;
  toggleWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openWallet = () => setIsOpen(true);
  const closeWallet = () => setIsOpen(false);
  const toggleWallet = () => setIsOpen(prev => !prev);

  return (
    <WalletContext.Provider value={{ isOpen, openWallet, closeWallet, toggleWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

