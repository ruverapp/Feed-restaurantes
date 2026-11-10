import React, { useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { PushNotificationToast } from './components/common/PushNotificationToast';
import { RouteSwitcherPill } from './components/common/RouteSwitcherPill';
import { CustomerView } from './components/customer/CustomerView';
import { WaiterView } from './components/waiter/WaiterView';
import { CashierView } from './components/cashier/CashierView';
import { MerchantAdminView } from './components/admin/MerchantAdminView';
import { SuperAdminView } from './components/superadmin/SuperAdminView';
import { AppViewMode } from './types';

function parseRouteFromUrl(): AppViewMode {
  if (typeof window === 'undefined') return 'customer';
  const pathname = window.location.pathname.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);
  const viewParam = searchParams.get('view')?.toLowerCase();

  if (pathname.includes('/garcom') || pathname.includes('/kds') || viewParam === 'garcom' || viewParam === 'waiter') {
    return 'waiter';
  }
  if (pathname.includes('/caixa') || viewParam === 'caixa' || viewParam === 'cashier') {
    return 'cashier';
  }
  if (pathname.includes('/lojista') || pathname.includes('/admin') || viewParam === 'lojista' || viewParam === 'admin') {
    return 'merchant_admin';
  }
  if (pathname.includes('/superadmin') || pathname.includes('/super-admin') || viewParam === 'superadmin') {
    return 'super_admin';
  }
  return 'customer';
}

const AppContent: React.FC = () => {
  const { activeViewMode, setActiveViewMode } = useStore();

  // Route sync on mount & popstate
  useEffect(() => {
    const initialRoute = parseRouteFromUrl();
    if (initialRoute !== 'customer') {
      setActiveViewMode(initialRoute);
    }

    const handlePopState = () => {
      setActiveViewMode(parseRouteFromUrl());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setActiveViewMode]);

  return (
    <div className="h-screen max-h-screen bg-neutral-50 text-neutral-900 flex flex-col overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Real-time Push Notification Floating Banner */}
      <PushNotificationToast />

      {/* Main View Display */}
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto bg-neutral-50">
        {activeViewMode === 'customer' && <CustomerView />}
        {activeViewMode === 'waiter' && <WaiterView />}
        {activeViewMode === 'cashier' && <CashierView />}
        {activeViewMode === 'merchant_admin' && <MerchantAdminView />}
        {activeViewMode === 'super_admin' && <SuperAdminView />}
      </div>

      {/* Discrete Floating Route Switcher for testing/demo across roles */}
      <RouteSwitcherPill />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
