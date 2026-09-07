import React, { createContext, useContext, useState } from 'react';
import VendaModal from '../components/VendaModal';

const VendaModalContext = createContext();

export function VendaModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialData, setInitialData] = useState(null);

  const openVendaModal = (data = null) => {
    setInitialData(data);
    setIsOpen(true);
  };

  const closeVendaModal = () => {
    setIsOpen(false);
    setInitialData(null);
  };

  return (
    <VendaModalContext.Provider value={{ isOpen, openVendaModal, closeVendaModal }}>
      {children}
      <VendaModal isOpen={isOpen} onClose={closeVendaModal} initialData={initialData} />
    </VendaModalContext.Provider>
  );
}

export function useVendaModal() {
  const context = useContext(VendaModalContext);
  if (!context) {
    throw new Error('useVendaModal deve ser usado dentro de um VendaModalProvider');
  }
  return context;
}
