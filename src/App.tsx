import React, { useState } from 'react';
import { BakeryProvider } from './context/BakeryContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { PosAndOrders } from './components/pos/PosAndOrders';
import { ProductionManager } from './components/production/ProductionManager';
import { RecipeList } from './components/recipes/RecipeList';
import { ProductCatalog } from './components/products/ProductCatalog';
import { IngredientsList } from './components/inventory/IngredientsList';
import { CustomerList } from './components/crm/CustomerList';
import { WasteTracker } from './components/waste/WasteTracker';
import { FinancialReports } from './components/reports/FinancialReports';
import { SettingsView } from './components/settings/SettingsView';
import { GoogleSheetsManager } from './components/sheets/GoogleSheetsManager';
import { WhatsAppBotManager } from './components/whatsapp/WhatsAppBotManager';
import { NewOrderModal } from './components/pos/NewOrderModal';
import { NewProductionModal } from './components/production/NewProductionModal';
import { CustomerHome } from './components/customer/CustomerHome';
import { ManagementLoginModal } from './components/customer/ManagementLoginModal';

const AppContent: React.FC = () => {
  // View mode: 'customer' (Etalase Konsumen & Profil) vs 'management' (Dashboard Bisnis)
  const [viewMode, setViewMode] = useState<'customer' | 'management'>('customer');
  const [isManagementAuthenticated, setIsManagementAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('PUSAKA_MGMT_AUTH') === 'true';
    } catch {
      return false;
    }
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
  const [isQuickProductionOpen, setIsQuickProductionOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSuccessfulLogin = () => {
    setIsManagementAuthenticated(true);
    try {
      sessionStorage.setItem('PUSAKA_MGMT_AUTH', 'true');
    } catch (e) {
      console.warn('Could not set sessionStorage', e);
    }
    setViewMode('management');
  };

  const handleLogout = () => {
    setIsManagementAuthenticated(false);
    try {
      sessionStorage.removeItem('PUSAKA_MGMT_AUTH');
    } catch (e) {
      console.warn('Could not remove sessionStorage', e);
    }
    setViewMode('customer');
  };

  // 1. If currently in Customer View Mode, render the public Storefront & Profile
  if (viewMode === 'customer') {
    return (
      <>
        <CustomerHome
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onNavigateToDashboard={() => {
            if (isManagementAuthenticated) {
              setViewMode('management');
            } else {
              setIsLoginModalOpen(true);
            }
          }}
          isManagementAuthenticated={isManagementAuthenticated}
        />

        <ManagementLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccessLogin={handleSuccessfulLogin}
        />
      </>
    );
  }

  // 2. Otherwise render the Management Dashboard
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenQuickOrder={() => setIsQuickOrderOpen(true)}
            onOpenQuickProduction={() => setIsQuickProductionOpen(true)}
          />
        );
      case 'pos':
        return <PosAndOrders />;
      case 'production':
        return <ProductionManager />;
      case 'recipes':
        return <RecipeList />;
      case 'products':
        return <ProductCatalog />;
      case 'inventory':
        return <IngredientsList />;
      case 'customers':
        return <CustomerList />;
      case 'whatsapp-bot':
      case 'whatsapp':
        return <WhatsAppBotManager onNavigateToPos={() => setActiveTab('pos')} />;
      case 'waste':
        return <WasteTracker />;
      case 'finance':
        return <FinancialReports />;
      case 'sheets':
      case 'googlesheets':
        return (
          <div className="space-y-6 max-w-5xl">
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Integrasi Cloud Database
                </span>
              </div>
              <h2 className="text-xl font-bold text-stone-900 mt-1">
                Google Sheets Database Management
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Penyimpanan data real-time, sinkronisasi dua arah, backup otomatis, dan ekspor spreadsheet untuk toko bakery Anda.
              </p>
            </div>
            <GoogleSheetsManager />
          </div>
        );
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardOverview
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenQuickOrder={() => setIsQuickOrderOpen(true)}
            onOpenQuickProduction={() => setIsQuickProductionOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col text-stone-900 font-sans antialiased selection:bg-amber-400 selection:text-stone-950">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickOrder={() => setIsQuickOrderOpen(true)}
        onOpenQuickProduction={() => setIsQuickProductionOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
        onViewCustomerStore={() => setViewMode('customer')}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 md:pb-8">
          {renderContent()}
        </main>
      </div>

      {/* Global Quick Action Modals */}
      <NewOrderModal
        isOpen={isQuickOrderOpen}
        onClose={() => setIsQuickOrderOpen(false)}
      />

      <NewProductionModal
        isOpen={isQuickProductionOpen}
        onClose={() => setIsQuickProductionOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <BakeryProvider>
      <AppContent />
    </BakeryProvider>
  );
}

