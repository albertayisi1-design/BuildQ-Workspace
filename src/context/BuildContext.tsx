import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import {
  AuditLog,
  Client,
  User,
  CostBenchmarkResult,
  CostRecord,
  IntelligenceParams,
  IntelligenceQuery,
  IntelligenceResult,
  Project,
  ProjectHistory,
  SiteReport,
  SystemSettings,
  WBSItem,
  ProjectDocument,
  EmailAlert,
  ProjectMilestone,
} from '../types';
import { db } from '../services/db';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';
import { auth } from '../services/firebase';
import {
  saveDocumentToFirestore,
  updateDocumentInFirestore,
  deleteDocumentFromFirestore,
  subscribeToDocuments,
} from '../services/firestoreSync';

export interface BuildContextType {
  projects: Project[];
  clients: Client[];
  users: User[];
  wbsItems: WBSItem[];
  costs: CostRecord[];
  siteReports: SiteReport[];
  projectHistory: ProjectHistory[];
  historicalProjects: ProjectHistory[];
  documents: ProjectDocument[];
  alerts: EmailAlert[];
  milestones: ProjectMilestone[];
  settings: SystemSettings;
  auditLogs: AuditLog[];
  refreshData: () => void;
  // User actions
  createUser: (userData: Omit<User, 'id'>) => User;
  updateUser: (id: string, updates: Partial<User>) => User;
  deleteUser: (id: string) => void;
  // Project actions
  createProject: (projectData: Omit<Project, 'id' | 'created_at'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => Project;
  completeProject: (id: string) => ProjectHistory;
  // Client actions
  createClient: (clientData: Omit<Client, 'id'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => Client;
  deleteClient: (id: string) => void;
  // WBS actions
  createWBSItem: (itemData: Omit<WBSItem, 'id' | 'actual_cost'>) => WBSItem;
  updateWBSItem: (id: string, updates: Partial<WBSItem>) => WBSItem;
  deleteWBSItem: (id: string) => void;
  // Cost actions
  createCost: (costData: Omit<CostRecord, 'id' | 'created_at'>) => CostRecord;
  updateCost: (id: string, updates: Partial<CostRecord>) => CostRecord;
  deleteCost: (id: string) => void;
  // Documents
  createDocument: (docData: Omit<ProjectDocument, 'id' | 'uploaded_at'>) => ProjectDocument;
  updateDocument: (id: string, updates: Partial<ProjectDocument>) => ProjectDocument;
  deleteDocument: (id: string) => void;
  // Critical Path Milestones
  createMilestone: (milestoneData: Omit<ProjectMilestone, 'id' | 'created_at'>) => ProjectMilestone;
  updateMilestone: (id: string, updates: Partial<ProjectMilestone>) => ProjectMilestone;
  deleteMilestone: (id: string) => void;
  // Site reports & Notifications
  createSiteReport: (reportData: Omit<SiteReport, 'id' | 'created_at'>) => SiteReport;
  updateSiteReport: (id: string, updates: Partial<SiteReport>) => SiteReport | null;
  sendSiteReportAlert: (report: SiteReport, flag: 'critical' | 'delay', customNote?: string) => Promise<EmailAlert[]>;
  resendEmailAlert: (alertId: string) => Promise<EmailAlert>;
  sendTestEmailAlert: (email: string, flag: 'critical' | 'delay') => Promise<EmailAlert>;
  sendUserVerificationEmail: (user: User | { id: string; name: string; email: string; username?: string; role: string; department?: string; verification_token?: string }) => Promise<{ alert: EmailAlert; verificationUrl: string; token: string; firebaseResult?: string }>;
  verifyUserAndSetPassword: (tokenOrEmail: string, newPassword: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  deleteAlert: (alertId: string) => void;
  clearAlerts: () => void;
  // Intelligence
  runIntelligence: (params: IntelligenceParams) => CostBenchmarkResult;
  runIntelligenceQuery: (query: IntelligenceQuery) => IntelligenceResult;
  createHistoricalProject: (data: any) => void;
  // Settings
  updateSettings: (updates: Partial<SystemSettings>) => SystemSettings;
  resetToSeedData: () => void;
}

const BuildContext = createContext<BuildContextType | undefined>(undefined);

export const BuildProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, firebaseUser } = useAuth();
  const [version, setVersion] = useState(0);

  const refreshData = useCallback(() => {
    db.recalculateAllProjectMetrics();
    setVersion((v) => v + 1);
  }, []);

  // Real-time Firestore sync for project documents
  // Adheres to Firebase skill: only attaches listener when user is authenticated in Firebase
  useEffect(() => {
    if (!firebaseUser) {
      return;
    }

    const unsub = subscribeToDocuments((remoteDocs) => {
      if (remoteDocs && remoteDocs.length > 0) {
        let hasChanges = false;
        remoteDocs.forEach((rd) => {
          const existing = db.getDocumentById(rd.id);
          if (!existing) {
            db.addDocument(rd, currentUser);
            hasChanges = true;
          }
        });
        if (hasChanges) {
          refreshData();
        }
      }
    });
    return () => {
      if (unsub) unsub();
    };
  }, [currentUser, firebaseUser, refreshData]);

  const projects = useMemo(() => db.getProjects(), [version]);
  const clients = useMemo(() => db.getClients(), [version]);
  const wbsItems = useMemo(() => db.getWBSItems(), [version]);
  const costs = useMemo(() => db.getCosts(), [version]);
  const siteReports = useMemo(() => db.getSiteReports(), [version]);
  const documents = useMemo(() => db.getDocuments(), [version]);
  const alerts = useMemo(() => db.getAlerts(), [version]);
  const milestones = useMemo(() => db.getMilestones(), [version]);
  const projectHistory = useMemo(() => {
    const raw = db.getHistoricalProjects();
    // Ensure aliases are populated for historical view
    return raw.map((h) => ({
      ...h,
      name: h.name || h.project_name,
      type: h.type || h.project_type,
      planned_cost: h.planned_cost || h.contract_value,
      final_actual_cost: h.final_actual_cost || h.final_cost,
      completion_date: h.completion_date || h.completed_date,
      planned_duration_months: h.planned_duration_months || Math.round(h.duration_weeks / 4),
      actual_duration_months: h.actual_duration_months || Math.round(h.duration_weeks / 4),
      delivery_method: h.delivery_method || 'Construction Management',
      lessons_learned:
        h.lessons_learned ||
        'Optimized material delivery schedule and early MEP trade coordination prevented costly field rework.',
    }));
  }, [version]);
  const settings = useMemo(() => db.getSettings(), [version]);
  const auditLogs = useMemo(() => db.getAuditLogs(), [version]);
  const users = useMemo(() => db.getUsers(), [version]);

  const createUser = useCallback(
    (userData: Omit<User, 'id'>) => {
      const u = db.addUser(userData, currentUser);
      refreshData();
      return u;
    },
    [currentUser, refreshData]
  );

  const updateUser = useCallback(
    (id: string, updates: Partial<User>) => {
      const u = db.updateUser(id, updates, currentUser);
      refreshData();
      return u;
    },
    [currentUser, refreshData]
  );

  const deleteUser = useCallback(
    (id: string) => {
      db.deleteUser(id, currentUser);
      refreshData();
    },
    [currentUser, refreshData]
  );

  const createProject = useCallback(
    (projectData: Omit<Project, 'id' | 'created_at'>) => {
      const p = db.addProject(projectData, currentUser);
      refreshData();
      return p;
    },
    [currentUser, refreshData]
  );

  const updateProject = useCallback(
    (id: string, updates: Partial<Project>) => {
      const p = db.updateProject(id, updates, currentUser);
      refreshData();
      return p;
    },
    [currentUser, refreshData]
  );

  const completeProject = useCallback(
    (id: string) => {
      const h = db.completeProject(id, currentUser);
      refreshData();
      return h;
    },
    [currentUser, refreshData]
  );

  const createClient = useCallback(
    (clientData: Omit<Client, 'id'>) => {
      const c = db.addClient(clientData, currentUser);
      refreshData();
      return c;
    },
    [currentUser, refreshData]
  );

  const updateClient = useCallback(
    (id: string, updates: Partial<Client>) => {
      const c = db.updateClient(id, updates, currentUser);
      refreshData();
      return c;
    },
    [currentUser, refreshData]
  );

  const deleteClient = useCallback(
    (id: string) => {
      db.deleteClient(id, currentUser);
      refreshData();
    },
    [currentUser, refreshData]
  );

  const createWBSItem = useCallback(
    (itemData: Omit<WBSItem, 'id' | 'actual_cost'>) => {
      const item = db.addWBSItem(itemData, currentUser);
      refreshData();
      return item;
    },
    [currentUser, refreshData]
  );

  const updateWBSItem = useCallback(
    (id: string, updates: Partial<WBSItem>) => {
      const item = db.updateWBSItem(id, updates, currentUser);
      refreshData();
      return item;
    },
    [currentUser, refreshData]
  );

  const deleteWBSItem = useCallback(
    (id: string) => {
      db.deleteWBSItem(id, currentUser);
      refreshData();
    },
    [currentUser, refreshData]
  );

  const createCost = useCallback(
    (costData: Omit<CostRecord, 'id' | 'created_at'>) => {
      const c = db.addCost(
        {
          ...costData,
          payee: costData.payee || (costData as any).supplier_contractor || 'Contractor',
          reference: costData.reference || 'EXP-001',
        },
        currentUser
      );
      refreshData();
      return c;
    },
    [currentUser, refreshData]
  );

  const updateCost = useCallback(
    (id: string, updates: Partial<CostRecord>) => {
      const c = db.updateCost(id, updates, currentUser);
      refreshData();
      return c;
    },
    [currentUser, refreshData]
  );

  const deleteCost = useCallback(
    (id: string) => {
      db.deleteCost(id, currentUser);
      refreshData();
    },
    [currentUser, refreshData]
  );

  const createDocument = useCallback(
    (docData: Omit<ProjectDocument, 'id' | 'uploaded_at'>) => {
      const d = db.addDocument(docData, currentUser);
      saveDocumentToFirestore(d).catch((err) => {
        console.warn('Firestore doc sync warning (will retry on reconnect):', err);
      });
      refreshData();
      return d;
    },
    [currentUser, refreshData]
  );

  const updateDocument = useCallback(
    (id: string, updates: Partial<ProjectDocument>) => {
      const d = db.updateDocument(id, updates, currentUser);
      updateDocumentInFirestore(id, updates).catch((err) => {
        console.warn('Firestore doc update warning:', err);
      });
      refreshData();
      return d;
    },
    [currentUser, refreshData]
  );

  const deleteDocument = useCallback(
    (id: string) => {
      db.deleteDocument(id, currentUser);
      deleteDocumentFromFirestore(id).catch((err) => {
        console.warn('Firestore doc delete warning:', err);
      });
      refreshData();
    },
    [currentUser, refreshData]
  );

  const createMilestone = useCallback(
    (milestoneData: Omit<ProjectMilestone, 'id' | 'created_at'>) => {
      const m = db.addMilestone(milestoneData, currentUser);
      refreshData();
      return m;
    },
    [currentUser, refreshData]
  );

  const updateMilestone = useCallback(
    (id: string, updates: Partial<ProjectMilestone>) => {
      const m = db.updateMilestone(id, updates, currentUser);
      refreshData();
      return m;
    },
    [currentUser, refreshData]
  );

  const deleteMilestone = useCallback(
    (id: string) => {
      db.deleteMilestone(id, currentUser);
      refreshData();
    },
    [currentUser, refreshData]
  );

  const createSiteReport = useCallback(
    (reportData: Omit<SiteReport, 'id' | 'created_at'>) => {
      const rep = db.addSiteReport(
        {
          ...reportData,
          activities: reportData.activities || (reportData as any).work_completed || 'Site work in progress',
          materials: reportData.materials || (reportData as any).materials_delivered || 'Standard materials',
          workers: reportData.workers || (reportData as any).workers_count || 12,
        },
        currentUser
      );

      // Auto-dispatch email alert if report is flagged as 'critical' or 'delay'
      if (rep.flag === 'critical' || rep.flag === 'delay') {
        const proj = db.getProject(rep.project_id);
        if (proj) {
          notificationService
            .sendSiteReportAlert(rep, proj, rep.flag, rep.flag_reason, currentUser)
            .catch((err) => {
              console.error('Error auto-dispatching site report email alert:', err);
            });
        }
      }

      refreshData();
      return rep;
    },
    [currentUser, refreshData]
  );

  const updateSiteReport = useCallback(
    (id: string, updates: Partial<SiteReport>) => {
      const updated = db.updateSiteReport(id, updates, currentUser);
      refreshData();
      return updated;
    },
    [currentUser, refreshData]
  );

  const sendSiteReportAlert = useCallback(
    async (report: SiteReport, flag: 'critical' | 'delay', customNote?: string) => {
      const proj = db.getProject(report.project_id);
      if (!proj) {
        throw new Error('Associated project not found');
      }
      const createdAlerts = await notificationService.sendSiteReportAlert(
        report,
        proj,
        flag,
        customNote,
        currentUser
      );
      refreshData();
      return createdAlerts;
    },
    [currentUser, refreshData]
  );

  const resendEmailAlert = useCallback(
    async (alertId: string) => {
      const resent = await notificationService.resendAlert(alertId, currentUser);
      refreshData();
      return resent;
    },
    [currentUser, refreshData]
  );

  const sendTestEmailAlert = useCallback(
    async (email: string, flag: 'critical' | 'delay') => {
      const alert = await notificationService.sendTestEmailAlert(email, flag, currentUser);
      refreshData();
      return alert;
    },
    [currentUser, refreshData]
  );

  const sendUserVerificationEmail = useCallback(
    async (
      user:
        | User
        | {
            id: string;
            name: string;
            email: string;
            username?: string;
            role: string;
            department?: string;
            verification_token?: string;
          }
    ) => {
      const res = await notificationService.sendUserVerificationEmail({
        user,
        sender: currentUser,
      });
      refreshData();
      return res;
    },
    [currentUser, refreshData]
  );

  const verifyUserAndSetPassword = useCallback(
    async (tokenOrEmail: string, newPassword: string) => {
      const res = db.verifyEmailAndSetPassword(tokenOrEmail, newPassword, currentUser);
      if (res.success) {
        refreshData();
      }
      return res;
    },
    [currentUser, refreshData]
  );

  const deleteAlert = useCallback(
    (alertId: string) => {
      db.deleteAlert(alertId);
      refreshData();
    },
    [refreshData]
  );

  const clearAlerts = useCallback(() => {
    db.clearAlerts();
    refreshData();
  }, [refreshData]);

  const runIntelligence = useCallback(
    (params: IntelligenceParams) => {
      return db.calculateIntelligence(params);
    },
    []
  );

  const runIntelligenceQuery = useCallback((query: IntelligenceQuery): IntelligenceResult => {
    const rawResult = db.calculateIntelligence({
      project_type: query.project_type,
      building_type: query.building_type,
      location: query.location,
      floor_area: query.floor_area,
      floors: query.floors,
      delivery_method: query.delivery_method,
    });

    const matched = rawResult.matched_projects.map((m) => ({
      project: {
        id: m.history.id,
        name: m.history.project_name || m.history.name || 'Historical Project',
        client_name: m.history.client_name,
        type: m.history.project_type,
        building_type: m.history.building_type,
        location: m.history.location,
        floor_area: m.history.floor_area,
        final_actual_cost: m.history.final_cost,
        cost_per_m2: m.history.cost_per_m2,
        completion_date: m.history.completed_date || `${m.history.completion_year}-12-01`,
        lessons_learned:
          m.history.lessons_learned ||
          'Optimized prefabrication and early trade sign-offs prevented field schedule slip.',
      },
      similarity_score: m.similarity_score,
    }));

    const totalCost = rawResult.preliminary_cost;
    const catBreakdown = [
      { category: 'Labour', percentage: 28, amount: Math.round(totalCost * 0.28) },
      { category: 'Materials', percentage: 38, amount: Math.round(totalCost * 0.38) },
      { category: 'Subcontractors', percentage: 22, amount: Math.round(totalCost * 0.22) },
      { category: 'Equipment', percentage: 8, amount: Math.round(totalCost * 0.08) },
      { category: 'Other & Contingency', percentage: 4, amount: Math.round(totalCost * 0.04) },
    ];

    const risks = [
      'Subcontractor availability and trade rate escalation in GTA urban market',
      'Unforeseen excavation and sub-grade geotechnical conditions',
      'Long lead-time critical equipment delivery for MEP electrical switchgear and HVAC equipment',
    ];

    return {
      query,
      matched_projects: matched,
      benchmarks: {
        avg_cost_per_m2: rawResult.avg_cost_per_m2,
        median_cost_per_m2: rawResult.median_cost_per_m2,
        min_cost_per_m2: rawResult.min_cost_per_m2,
        max_cost_per_m2: rawResult.max_cost_per_m2,
        avg_duration_months: 14,
      },
      preliminary_estimate: {
        estimated_cost: rawResult.preliminary_cost,
        range_min: rawResult.preliminary_range_low,
        range_max: rawResult.preliminary_range_high,
        estimated_duration_months: 14,
        suggested_contingency_percent: 10,
        disclaimer:
          'This estimate is based on historical project benchmarks and is intended for preliminary budgeting purposes only. A detailed quantity takeoff is required for bidding.',
      },
      category_breakdown: catBreakdown,
      risk_factors: risks,
    };
  }, []);

  const createHistoricalProject = useCallback(
    (data: any) => {
      const histItem: ProjectHistory = {
        id: 'hist_' + Date.now(),
        project_id: 'proj_hist_' + Date.now(),
        project_name: data.name,
        name: data.name,
        client_name: data.client_name || 'First Capital Realty',
        project_type: data.type || 'Residential',
        type: data.type || 'Residential',
        building_type: data.building_type || 'Residential',
        location: data.location || 'Toronto, ON',
        floor_area: data.floor_area || 500,
        floors: data.floors || 2,
        contract_value: data.planned_cost || 1000000,
        planned_cost: data.planned_cost || 1000000,
        final_cost: data.final_actual_cost || 1000000,
        final_actual_cost: data.final_actual_cost || 1000000,
        final_cost_variance: (data.planned_cost || 1000000) - (data.final_actual_cost || 1000000),
        completion_year: new Date(data.completion_date || Date.now()).getFullYear(),
        duration_weeks: (data.actual_duration_months || 12) * 4,
        planned_duration_months: data.planned_duration_months || 12,
        actual_duration_months: data.actual_duration_months || 12,
        labour_cost: Math.round((data.final_actual_cost || 1000000) * 0.28),
        material_cost: Math.round((data.final_actual_cost || 1000000) * 0.38),
        subcontractor_cost: Math.round((data.final_actual_cost || 1000000) * 0.22),
        equipment_cost: Math.round((data.final_actual_cost || 1000000) * 0.08),
        other_cost: Math.round((data.final_actual_cost || 1000000) * 0.04),
        profit: 120000,
        margin: 8.5,
        cost_per_m2:
          data.cost_per_m2 ||
          Math.round((data.final_actual_cost || 1000000) / (data.floor_area || 1)),
        contract_value_per_m2: Math.round(
          (data.planned_cost || 1000000) / (data.floor_area || 1)
        ),
        completed_date: data.completion_date || new Date().toISOString().split('T')[0],
        completion_date: data.completion_date || new Date().toISOString().split('T')[0],
        lessons_learned: data.lessons_learned || '',
        delivery_method: data.delivery_method || 'Construction Management',
      };

      db.addHistoricalProject(histItem);
      refreshData();
    },
    [refreshData]
  );

  const updateSettings = useCallback(
    (updates: Partial<SystemSettings>) => {
      const s = db.updateSettings(updates, currentUser);
      refreshData();
      return s;
    },
    [currentUser, refreshData]
  );

  const resetToSeedData = useCallback(() => {
    db.resetToSeed();
    refreshData();
  }, [refreshData]);

  return (
    <BuildContext.Provider
      value={{
        projects,
        clients,
        users,
        wbsItems,
        costs,
        siteReports,
        projectHistory,
        historicalProjects: projectHistory,
        documents,
        alerts,
        milestones,
        settings,
        auditLogs,
        refreshData,
        createUser,
        updateUser,
        deleteUser,
        createProject,
        updateProject,
        completeProject,
        createClient,
        updateClient,
        deleteClient,
        createWBSItem,
        updateWBSItem,
        deleteWBSItem,
        createCost,
        updateCost,
        deleteCost,
        createDocument,
        updateDocument,
        deleteDocument,
        createMilestone,
        updateMilestone,
        deleteMilestone,
        createSiteReport,
        updateSiteReport,
        sendSiteReportAlert,
        resendEmailAlert,
        sendTestEmailAlert,
        sendUserVerificationEmail,
        verifyUserAndSetPassword,
        deleteAlert,
        clearAlerts,
        runIntelligence,
        runIntelligenceQuery,
        createHistoricalProject,
        updateSettings,
        resetToSeedData,
      }}
    >
      {children}
    </BuildContext.Provider>
  );
};

export const useBuild = (): BuildContextType => {
  const context = useContext(BuildContext);
  if (!context) {
    throw new Error('useBuild must be used within a BuildProvider');
  }
  return context;
};
