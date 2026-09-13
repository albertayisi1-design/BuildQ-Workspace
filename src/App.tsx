import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BuildProvider, useBuild } from './context/BuildContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { DemoGuideModal } from './components/common/DemoGuideModal';
import { AndroidAppModal } from './components/common/AndroidAppModal';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { ProjectsList } from './components/projects/ProjectsList';
import { ProjectOverview } from './components/projects/ProjectOverview';
import { WBSView } from './components/wbs/WBSView';
import { CostsView } from './components/costs/CostsView';
import { SiteReportsView } from './components/site_reports/SiteReportsView';
import { HistoricalProjectsView } from './components/historical/HistoricalProjectsView';
import { ProjectIntelligenceView } from './components/intelligence/ProjectIntelligenceView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { LoginView } from './components/auth/LoginView';
import { VerifyAndSetPasswordView } from './components/auth/VerifyAndSetPasswordView';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { Menu } from 'lucide-react';

function AppContent() {
  const { canAccess, currentUser, isAuthenticated } = useAuth();
  const { projects } = useBuild();

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState<boolean>(false);
  const [openCostModal, setOpenCostModal] = useState<boolean>(false);
  const [openSiteReportModal, setOpenSiteReportModal] = useState<boolean>(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState<boolean>(false);

  // Check for email verification / password setup parameter
  const [isVerifying, setIsVerifying] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('action') === 'verify_and_set_password' || !!params.get('token');
    }
    return false;
  });
  const [verifyToken, setVerifyToken] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || '';
    }
    return '';
  });
  const [verifyEmail, setVerifyEmail] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('email') || '';
    }
    return '';
  });

  // If user opens verification link or requests credential setup
  if (isVerifying) {
    return (
      <VerifyAndSetPasswordView
        initialToken={verifyToken}
        initialEmail={verifyEmail}
        onComplete={() => setIsVerifying(false)}
        onCancel={() => setIsVerifying(false)}
      />
    );
  }

  // If not authenticated, render Login Screen
  if (!isAuthenticated || !currentUser) {
    return (
      <LoginView
        onOpenVerify={(tok, em) => {
          if (tok) setVerifyToken(tok);
          if (em) setVerifyEmail(em);
          setIsVerifying(true);
        }}
      />
    );
  }

  // Navigate with optional project context
  const handleNavigate = (tab: string, projectId?: string) => {
    setCurrentTab(tab);
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  };

  // Open Cost modal directly for a project
  const handleOpenAddCost = (projId: string) => {
    setSelectedProjectId(projId);
    setCurrentTab('costs');
    setOpenCostModal(true);
  };

  // Open Site Report modal directly for a project
  const handleOpenAddSiteReport = (projId: string) => {
    setSelectedProjectId(projId);
    setCurrentTab('site_reports');
    setOpenSiteReportModal(true);
  };

  // Quick Run Scenario Steps 1-13 (Section 34)
  const handleQuickRunScenarioStep = (stepNumber: number) => {
    const demoProject = projects.find((p) => p.name.includes('Riverside') || p.floor_area === 600) || projects[0];

    switch (stepNumber) {
      case 1:
      case 2:
        setCurrentTab('projects');
        if (demoProject) setSelectedProjectId(demoProject.id);
        break;
      case 3:
        setCurrentTab('wbs');
        if (demoProject) setSelectedProjectId(demoProject.id);
        break;
      case 4:
        setCurrentTab('costs');
        if (demoProject) setSelectedProjectId(demoProject.id);
        break;
      case 5:
        setCurrentTab('site_reports');
        if (demoProject) setSelectedProjectId(demoProject.id);
        break;
      case 6:
        setCurrentTab('wbs');
        if (demoProject) setSelectedProjectId(demoProject.id);
        break;
      case 7:
        setCurrentTab('projects');
        if (demoProject) setSelectedProjectId(demoProject.id);
        break;
      case 8:
        setCurrentTab('historical');
        break;
      case 9:
      case 10:
      case 11:
      case 12:
        setCurrentTab('intelligence');
        break;
      case 13:
        setCurrentTab('reports');
        break;
      default:
        setCurrentTab('dashboard');
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden antialiased">
      {/* Main Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          // reset selected project if clicking 'projects' directly
          if (tab === 'projects' && currentTab === 'projects') {
            setSelectedProjectId(null);
          }
        }}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenAndroidApp={() => setIsAndroidModalOpen(true)}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navigation Bar */}
        <Header
          onOpenDemoGuide={() => setIsDemoGuideOpen(true)}
          onOpenAndroidApp={() => setIsAndroidModalOpen(true)}
          onNavigate={handleNavigate}
          currentTab={currentTab}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenNewProject={() => {
            setSelectedProjectId(null);
            setCurrentTab('projects');
          }}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8 pb-22 lg:pb-8 bg-[#F8FAFC] min-w-0">
          {/* Module 1: Dashboard */}
          {currentTab === 'dashboard' && (
            <ExecutiveDashboard
              onSelectProject={(id) => {
                setSelectedProjectId(id);
                setCurrentTab('projects');
              }}
              onNavigate={handleNavigate}
            />
          )}

          {/* Module 2: Projects & Project Overview */}
          {currentTab === 'projects' && (
            <>
              {selectedProjectId ? (
                <ProjectOverview
                  projectId={selectedProjectId}
                  onBack={() => setSelectedProjectId(null)}
                  onNavigateToTab={handleNavigate}
                  onOpenAddCost={handleOpenAddCost}
                  onOpenAddSiteReport={handleOpenAddSiteReport}
                />
              ) : (
                <ProjectsList
                  onSelectProject={(id) => setSelectedProjectId(id)}
                />
              )}
            </>
          )}

          {/* Module 3: WBS & Activities */}
          {currentTab === 'wbs' && (
            <WBSView
              selectedProjectId={selectedProjectId || undefined}
              onNavigateToCost={(projId) => handleOpenAddCost(projId)}
              onNavigate={handleNavigate}
            />
          )}

          {/* Module 4: Cost Tracking */}
          {currentTab === 'costs' && (
            <CostsView
              initialProjectId={selectedProjectId || undefined}
              isAddModalOpenInitially={openCostModal}
            />
          )}

          {/* Module 5: Site Reports */}
          {currentTab === 'site_reports' && (
            <SiteReportsView
              initialProjectId={selectedProjectId || undefined}
              isAddModalOpenInitially={openSiteReportModal}
            />
          )}

          {/* Module 6: Archive Projects */}
          {currentTab === 'historical' && (
            <HistoricalProjectsView
              onNavigateToIntelligenceWithFilter={() => setCurrentTab('intelligence')}
            />
          )}

          {/* Module 7: Project Intelligence Engine (Core Differentiator) */}
          {currentTab === 'intelligence' && (
            <ProjectIntelligenceView
              onNavigateToReportsWithData={() => setCurrentTab('reports')}
            />
          )}

          {/* Module 8: Reports */}
          {currentTab === 'reports' && (
            <ReportsView initialReportType="project" />
          )}

          {/* Module 9: Settings */}
          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Cell phones & mobile tablets) */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'projects' && currentTab === 'projects') {
            setSelectedProjectId(null);
          }
        }}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Android Installation Modal */}
      <AndroidAppModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />

      {/* Interactive 13-step Demonstration Scenario Modal (Section 34) */}
      <DemoGuideModal
        isOpen={isDemoGuideOpen}
        onClose={() => setIsDemoGuideOpen(false)}
        onNavigate={handleNavigate}
        onQuickRunScenarioStep={handleQuickRunScenarioStep}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BuildProvider>
        <AppContent />
      </BuildProvider>
    </AuthProvider>
  );
}
