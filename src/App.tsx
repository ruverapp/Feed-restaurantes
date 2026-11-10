import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { HeaderNavigation } from './components/common/HeaderNavigation';
import { PushNotificationToast } from './components/common/PushNotificationToast';
import { CustomerView } from './components/customer/CustomerView';
import { WaiterView } from './components/waiter/WaiterView';
import { MerchantAdminView } from './components/admin/MerchantAdminView';
import { SuperAdminView } from './components/superadmin/SuperAdminView';

const AppContent: React.FC = () => {
  const { activeViewMode } = useStore();

  return (
    <div className="h-screen max-h-screen bg-neutral-50 text-neutral-900 flex flex-col overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Real-time Push Notification Floating Banner */}
      <PushNotificationToast />

      {/* SaaS Mode Switcher Header */}
      <HeaderNavigation />

      {/* Main View Display */}
      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto bg-neutral-50">
        {activeViewMode === 'customer' && <CustomerView />}
        {activeViewMode === 'waiter' && <WaiterView />}
        {activeViewMode === 'merchant_admin' && <MerchantAdminView />}
        {activeViewMode === 'super_admin' && <SuperAdminView />}
      </div>
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
