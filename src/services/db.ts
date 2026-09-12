import {
  AuditLog,
  Client,
  CostBenchmarkResult,
  CostCategory,
  CostRecord,
  IntelligenceParams,
  Project,
  ProjectHistory,
  SimilarProjectMatch,
  SiteReport,
  SystemSettings,
  User,
  UserRole,
  CorporateRole,
  WBSItem,
  ProjectDocument,
  EmailAlert,
} from '../types';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_CLIENTS,
  INITIAL_COSTS,
  INITIAL_PROJECT_HISTORY,
  INITIAL_PROJECTS,
  INITIAL_SETTINGS,
  INITIAL_SITE_REPORTS,
  INITIAL_USERS,
  INITIAL_WBS_ITEMS,
  INITIAL_DOCUMENTS,
  INITIAL_ALERTS,
} from './seedData';

const STORAGE_PREFIX = 'buildiq_db_';

class RelationalDatabaseService {
  private users: User[] = [];
  private clients: Client[] = [];
  private projects: Project[] = [];
  private wbsItems: WBSItem[] = [];
  private costs: CostRecord[] = [];
  private siteReports: SiteReport[] = [];
  private projectHistory: ProjectHistory[] = [];
  private documents: ProjectDocument[] = [];
  private alerts: EmailAlert[] = [];
  private settings: SystemSettings = INITIAL_SETTINGS;
  private auditLogs: AuditLog[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const storedUsers = localStorage.getItem(STORAGE_PREFIX + 'users');
      if (storedUsers) {
        const parsed: User[] = JSON.parse(storedUsers);
        // Clean out legacy executive user if previously cached
        const sanitized = parsed.filter((u) => u.id !== 'usr_exec' && u.role !== ('executive' as any));
        // Ensure all users have a username and valid corporate role (admin, pm, engineer, finance)
        sanitized.forEach((u) => {
          const matchInit = INITIAL_USERS.find((iu) => iu.id === u.id);
          if (!u.username) {
            u.username = matchInit?.username || (u.email ? u.email.split('@')[0] : u.id);
          }
          // Normalize legacy roles to the four authorized corporate roles
          if ((u.role as string) === 'project_manager') {
            u.role = 'pm';
          } else if ((u.role as string) === 'engineers' || (u.role as string) === 'site_supervisor' || (u.role as string) === 'safety_officer') {
            u.role = 'engineer';
          } else if ((u.role as string) === 'cost_estimator') {
            u.role = 'finance';
          } else if (!['admin', 'pm', 'engineer', 'finance'].includes(u.role)) {
            u.role = 'pm';
          }
        });
        // Ensure new seed users exist in the list
        INITIAL_USERS.forEach((initUser) => {
          if (!sanitized.some((u) => u.id === initUser.id)) {
            sanitized.push(initUser);
          }
        });
        this.users = sanitized;
      } else {
        this.users = [...INITIAL_USERS];
      }

      const storedClients = localStorage.getItem(STORAGE_PREFIX + 'clients');
      this.clients = storedClients ? JSON.parse(storedClients) : INITIAL_CLIENTS;

      const storedProjects = localStorage.getItem(STORAGE_PREFIX + 'projects');
      if (storedProjects) {
        const parsed: Project[] = JSON.parse(storedProjects);
        // Clean out legacy demo completed projects (proj_hist_2 through proj_hist_6) so demo projects are cleanly 5
        const removedLegacyIds = new Set(['proj_hist_2', 'proj_hist_3', 'proj_hist_4', 'proj_hist_5', 'proj_hist_6']);
        const filteredProjects = parsed.filter((p) => !removedLegacyIds.has(p.id));
        // Ensure the 5 canonical demo projects exist
        INITIAL_PROJECTS.forEach((initProj) => {
          if (!filteredProjects.some((p) => p.id === initProj.id)) {
            filteredProjects.push(initProj);
          }
        });
        this.projects = filteredProjects;
      } else {
        this.projects = [...INITIAL_PROJECTS];
      }

      const storedWBS = localStorage.getItem(STORAGE_PREFIX + 'wbs_items');
      this.wbsItems = storedWBS ? JSON.parse(storedWBS) : INITIAL_WBS_ITEMS;

      const storedCosts = localStorage.getItem(STORAGE_PREFIX + 'costs');
      this.costs = storedCosts ? JSON.parse(storedCosts) : INITIAL_COSTS;

      const storedReports = localStorage.getItem(STORAGE_PREFIX + 'site_reports');
      this.siteReports = storedReports ? JSON.parse(storedReports) : INITIAL_SITE_REPORTS;

      const storedHistory = localStorage.getItem(STORAGE_PREFIX + 'project_history');
      if (storedHistory) {
        const parsedHist: ProjectHistory[] = JSON.parse(storedHistory);
        // Clean out legacy extra archive records, maintaining canonical 5 archive projects
        const sanitizedHist = parsedHist.filter((h) => h.id !== 'hist_6' && h.project_name !== 'Oakridge Estate Villas');
        INITIAL_PROJECT_HISTORY.forEach((initHist) => {
          if (!sanitizedHist.some((h) => h.id === initHist.id || h.project_id === initHist.project_id)) {
            sanitizedHist.push(initHist);
          }
        });
        this.projectHistory = sanitizedHist.slice(0, 5);
      } else {
        this.projectHistory = [...INITIAL_PROJECT_HISTORY];
      }

      const storedDocuments = localStorage.getItem(STORAGE_PREFIX + 'documents');
      this.documents = storedDocuments ? JSON.parse(storedDocuments) : INITIAL_DOCUMENTS;

      const storedAlerts = localStorage.getItem(STORAGE_PREFIX + 'alerts');
      this.alerts = storedAlerts ? JSON.parse(storedAlerts) : INITIAL_ALERTS;

      const storedSettings = localStorage.getItem(STORAGE_PREFIX + 'settings');
      this.settings = storedSettings ? JSON.parse(storedSettings) : INITIAL_SETTINGS;

      const storedAudit = localStorage.getItem(STORAGE_PREFIX + 'audit_logs');
      this.auditLogs = storedAudit ? JSON.parse(storedAudit) : INITIAL_AUDIT_LOGS;

      this.recalculateAllProjectMetrics();
    } catch (err) {
      console.warn('Error reading from localStorage, using seed data:', err);
      this.resetToSeed();
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + 'users', JSON.stringify(this.users));
      localStorage.setItem(STORAGE_PREFIX + 'clients', JSON.stringify(this.clients));
      localStorage.setItem(STORAGE_PREFIX + 'projects', JSON.stringify(this.projects));
      localStorage.setItem(STORAGE_PREFIX + 'wbs_items', JSON.stringify(this.wbsItems));
      localStorage.setItem(STORAGE_PREFIX + 'costs', JSON.stringify(this.costs));
      localStorage.setItem(STORAGE_PREFIX + 'site_reports', JSON.stringify(this.siteReports));
      localStorage.setItem(STORAGE_PREFIX + 'project_history', JSON.stringify(this.projectHistory));
      localStorage.setItem(STORAGE_PREFIX + 'documents', JSON.stringify(this.documents));
      localStorage.setItem(STORAGE_PREFIX + 'alerts', JSON.stringify(this.alerts));
      localStorage.setItem(STORAGE_PREFIX + 'settings', JSON.stringify(this.settings));
      localStorage.setItem(STORAGE_PREFIX + 'audit_logs', JSON.stringify(this.auditLogs));
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }
  }

  public resetToSeed(): void {
    this.users = [...INITIAL_USERS];
    this.clients = [...INITIAL_CLIENTS];
    this.projects = [...INITIAL_PROJECTS];
    this.wbsItems = [...INITIAL_WBS_ITEMS];
    this.costs = [...INITIAL_COSTS];
    this.siteReports = [...INITIAL_SITE_REPORTS];
    this.projectHistory = [...INITIAL_PROJECT_HISTORY];
    this.documents = [...INITIAL_DOCUMENTS];
    this.alerts = [...INITIAL_ALERTS];
    this.settings = { ...INITIAL_SETTINGS };
    this.auditLogs = [...INITIAL_AUDIT_LOGS];

    this.recalculateAllProjectMetrics();
    this.saveToStorage();
  }

  public addAuditLog(
    user: User | null,
    action: string,
    entity: AuditLog['entity'],
    entityId: string,
    details: string
  ): void {
    const log: AuditLog = {
      id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: user?.id || 'sys',
      user_name: user?.name || 'System / Automated',
      action,
      entity,
      entity_id: entityId,
      details,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    // Keep max 200 logs
    if (this.auditLogs.length > 200) {
      this.auditLogs = this.auditLogs.slice(0, 200);
    }
    this.saveToStorage();
  }

  // --- AUTOMATIC RE-CALCULATION CASCADE ---
  // Cost Record -> WBS Actual Cost -> Project Actual Cost -> Variance -> Profitability -> Dashboard
  public recalculateAllProjectMetrics(): void {
    // 1. Recalculate WBS item actual costs from Cost records
    for (const wbs of this.wbsItems) {
      if (!wbs.is_phase) {
        const itemCosts = this.costs.filter((c) => c.wbs_id === wbs.id);
        wbs.actual_cost = itemCosts.reduce((sum, c) => sum + c.amount, 0);
      }
    }

    // 2. Roll up Phase actual costs and planned costs from children
    const phases = this.wbsItems.filter((w) => w.is_phase);
    for (const phase of phases) {
      const children = this.wbsItems.filter((w) => w.parent_id === phase.id);
      if (children.length > 0) {
        phase.actual_cost = children.reduce((sum, c) => sum + c.actual_cost, 0);
        phase.planned_cost = children.reduce((sum, c) => sum + c.planned_cost, 0);
        const avgProgress = children.reduce((sum, c) => sum + c.progress, 0) / children.length;
        phase.progress = Math.round(avgProgress);
        if (phase.progress === 100) {
          phase.status = 'Completed';
        } else if (phase.progress > 0) {
          phase.status = 'In Progress';
        }
      }
    }

    // 3. Roll up Project actual costs and progress from WBS / costs
    for (const proj of this.projects) {
      const projCosts = this.costs.filter((c) => c.project_id === proj.id);
      const totalActualCost = projCosts.reduce((sum, c) => sum + c.amount, 0);

      // If there are historical projects whose costs are already baked into history, use history or recorded costs
      if (proj.status === 'Completed' && totalActualCost === 0) {
        const hist = this.projectHistory.find((h) => h.project_id === proj.id);
        proj.actual_cost = hist ? hist.final_cost : proj.approved_budget;
      } else {
        proj.actual_cost = totalActualCost;
      }

      // Calculate progress from non-phase WBS items if available
      const projActivities = this.wbsItems.filter((w) => w.project_id === proj.id && !w.is_phase);
      if (projActivities.length > 0 && proj.status !== 'Completed' && proj.status !== 'Planning') {
        const totalProgressWeight = projActivities.reduce((sum, a) => sum + (a.planned_cost || 1), 0);
        if (totalProgressWeight > 0) {
          const weightedProgress = projActivities.reduce(
            (sum, a) => sum + a.progress * (a.planned_cost || 1),
            0
          );
          proj.progress = Math.round(weightedProgress / totalProgressWeight);
        } else {
          proj.progress = Math.round(
            projActivities.reduce((sum, a) => sum + a.progress, 0) / projActivities.length
          );
        }
      } else if (proj.status === 'Completed') {
        proj.progress = 100;
      }
    }
  }

  // --- USERS ---
  public getUsers(): User[] {
    return [...this.users];
  }

  public addUser(userData: Omit<User, 'id'>, currentUser: User | null): User {
    const cleanUsername = (
      userData.username ||
      userData.email.split('@')[0] ||
      `user_${Date.now().toString().slice(-4)}`
    )
      .trim()
      .toLowerCase();

    // Check for duplicate username or email
    const duplicate = this.users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === cleanUsername) ||
        u.email.toLowerCase() === userData.email.trim().toLowerCase()
    );
    if (duplicate) {
      if (duplicate.username?.toLowerCase() === cleanUsername) {
        throw new Error(`Username "@${cleanUsername}" is already taken.`);
      } else {
        throw new Error(`User with email "${userData.email}" already exists.`);
      }
    }

    // Enforce that only authorized corporate roles (admin, pm, engineer, finance) can be assigned
    const allowedCorporateRoles: UserRole[] = ['admin', 'pm', 'engineer', 'finance'];
    let assignedRole = userData.role;
    if ((assignedRole as string) === 'project_manager') assignedRole = 'pm';
    if ((assignedRole as string) === 'engineers') assignedRole = 'engineer';
    if (!allowedCorporateRoles.includes(assignedRole)) {
      throw new Error(`Invalid role. Only "admin", "pm", "engineer", or "finance" can be assigned to corporate users.`);
    }

    const newUser: User = {
      ...userData,
      role: assignedRole,
      id: 'usr_' + Date.now(),
      username: cleanUsername,
      email: userData.email.trim().toLowerCase(),
      created_at: new Date().toISOString(),
      created_by: currentUser?.name || 'System Administrator',
      status: userData.status || 'active',
    };
    this.users.push(newUser);
    this.addAuditLog(
      currentUser,
      'User Account Created',
      'user',
      newUser.id,
      `Administrator provisioned new user account: ${newUser.name} (@${newUser.username}) with role: ${newUser.role}`
    );
    this.saveToStorage();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>, currentUser: User | null): User {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw new Error(`User with ID ${id} not found`);
    }

    if (updates.role) {
      const allowedCorporateRoles: UserRole[] = ['admin', 'pm', 'engineer', 'finance'];
      let assignedRole = updates.role;
      if ((assignedRole as string) === 'project_manager') assignedRole = 'pm';
      if ((assignedRole as string) === 'engineers') assignedRole = 'engineer';
      if (!allowedCorporateRoles.includes(assignedRole)) {
        throw new Error(`Invalid role. Only "admin", "pm", "engineer", or "finance" can be assigned to corporate users.`);
      }
      updates.role = assignedRole;
    }

    const oldRole = this.users[idx].role;
    const oldStatus = this.users[idx].status;

    this.users[idx] = {
      ...this.users[idx],
      ...updates,
    };

    let logMessage = `Updated user account: ${this.users[idx].name}`;
    if (updates.role && updates.role !== oldRole) {
      logMessage += ` (Role changed from ${oldRole} to ${updates.role})`;
    }
    if (updates.status && updates.status !== oldStatus) {
      logMessage += ` (Status changed from ${oldStatus} to ${updates.status})`;
    }

    this.addAuditLog(currentUser, 'User Account Updated', 'user', id, logMessage);
    this.saveToStorage();
    return this.users[idx];
  }

  public deleteUser(id: string, currentUser: User | null): void {
    const userToDelete = this.users.find((u) => u.id === id);
    if (!userToDelete) return;
    this.users = this.users.filter((u) => u.id !== id);
    this.addAuditLog(
      currentUser,
      'User Account Removed',
      'user',
      id,
      `Decommissioned user account: ${userToDelete.name} (${userToDelete.email})`
    );
    this.saveToStorage();
  }

  // --- CLIENTS ---
  public getClients(): Client[] {
    return [...this.clients];
  }

  public addClient(client: Omit<Client, 'id'>, user: User | null): Client {
    const newClient: Client = {
      ...client,
      id: 'cli_' + Date.now(),
      created_at: new Date().toISOString(),
      created_by: user?.name || 'System Administrator',
    };
    this.clients.push(newClient);
    this.addAuditLog(
      user,
      'Client Organization Created',
      'client',
      newClient.id,
      `Administrator onboarded new client organization: ${newClient.name} (Contact: ${newClient.contact})`
    );
    this.saveToStorage();
    return newClient;
  }

  public updateClient(id: string, updates: Partial<Client>, user: User | null): Client {
    const idx = this.clients.findIndex((c) => c.id === id);
    if (idx === -1) {
      throw new Error(`Client with ID ${id} not found`);
    }
    this.clients[idx] = {
      ...this.clients[idx],
      ...updates,
    };
    this.addAuditLog(
      user,
      'Client Organization Updated',
      'client',
      id,
      `Updated profile for client: ${this.clients[idx].name}`
    );
    this.saveToStorage();
    return this.clients[idx];
  }

  public deleteClient(id: string, user: User | null): void {
    const client = this.clients.find((c) => c.id === id);
    if (!client) return;
    this.clients = this.clients.filter((c) => c.id !== id);
    this.addAuditLog(
      user,
      'Client Organization Removed',
      'client',
      id,
      `Removed client record: ${client.name}`
    );
    this.saveToStorage();
  }

  // --- PROJECTS ---
  public getProjects(): Project[] {
    return [...this.projects];
  }

  public getProject(id: string): Project | undefined {
    return this.projects.find((p) => p.id === id);
  }

  public addProject(projectData: Omit<Project, 'id' | 'created_at'>, user: User | null): Project {
    const newProject: Project = {
      ...projectData,
      id: 'proj_' + Date.now(),
      created_at: new Date().toISOString(),
      actual_cost: 0,
      forecast_remaining: projectData.approved_budget,
      progress: projectData.status === 'Completed' ? 100 : (projectData.progress || 0),
    };

    this.projects.unshift(newProject);

    // Bootstrap standard WBS structure for rapid operational demonstration
    this.bootstrapStandardWBS(newProject.id, newProject.approved_budget);

    this.addAuditLog(
      user,
      'Project Created',
      'project',
      newProject.id,
      `Created project ${newProject.project_number} (${newProject.name}) - Budget: C$${newProject.approved_budget.toLocaleString()}`
    );

    this.recalculateAllProjectMetrics();
    this.saveToStorage();
    return newProject;
  }

  private bootstrapStandardWBS(projectId: string, totalBudget: number): void {
    const phases = [
      { code: '01', name: '01 — Preliminaries', desc: 'Mobilization & site setup', pct: 0.08 },
      { code: '02', name: '02 — Foundation', desc: 'Excavation & concrete footings', pct: 0.22 },
      { code: '03', name: '03 — Structure', desc: 'Columns, framing & slabs', pct: 0.30 },
      { code: '04', name: '04 — Blockwork', desc: 'Masonry & external walls', pct: 0.18 },
      { code: '05', name: '05 — Finishing', desc: 'Plastering, flooring & paint', pct: 0.22 },
    ];

    const today = new Date();
    phases.forEach((p, idx) => {
      const phaseId = `wbs_${projectId}_p${idx + 1}`;
      const plannedPhaseCost = Math.round(totalBudget * p.pct);

      const startDate = new Date(today);
      startDate.setDate(today.getDate() + idx * 30);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 28);

      const phaseItem: WBSItem = {
        id: phaseId,
        project_id: projectId,
        parent_id: null,
        is_phase: true,
        phase_code: p.code,
        wbs_code: p.code,
        name: p.name,
        description: p.desc,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        planned_cost: plannedPhaseCost,
        actual_cost: 0,
        progress: 0,
        status: 'Not Started',
      };
      this.wbsItems.push(phaseItem);

      // Add 2 child activities
      const act1: WBSItem = {
        id: `wbs_${projectId}_p${idx + 1}_a1`,
        project_id: projectId,
        parent_id: phaseId,
        is_phase: false,
        wbs_code: `${p.code}.01`,
        name: `${p.name.split('—')[1]?.trim() || p.name} - Stage 1`,
        description: `Primary execution for ${p.name}`,
        start_date: startDate.toISOString().split('T')[0],
        end_date: new Date(startDate.getTime() + 14 * 86400000).toISOString().split('T')[0],
        planned_cost: Math.round(plannedPhaseCost * 0.5),
        actual_cost: 0,
        progress: 0,
        status: 'Not Started',
      };

      const act2: WBSItem = {
        id: `wbs_${projectId}_p${idx + 1}_a2`,
        project_id: projectId,
        parent_id: phaseId,
        is_phase: false,
        wbs_code: `${p.code}.02`,
        name: `${p.name.split('—')[1]?.trim() || p.name} - Stage 2`,
        description: `Inspection & completion for ${p.name}`,
        start_date: new Date(startDate.getTime() + 15 * 86400000).toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        planned_cost: Math.round(plannedPhaseCost * 0.5),
        actual_cost: 0,
        progress: 0,
        status: 'Not Started',
      };

      this.wbsItems.push(act1, act2);
    });
  }

  public updateProject(id: string, updates: Partial<Project>, user: User | null): Project {
    const idx = this.projects.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Project not found');

    const prev = this.projects[idx];
    const updated = { ...prev, ...updates };

    // Check if status changed to Completed
    if (updates.status === 'Completed' && prev.status !== 'Completed') {
      this.projects[idx] = updated;
      this.completeProject(id, user);
      return this.projects[idx];
    }

    this.projects[idx] = updated;
    this.addAuditLog(user, 'Project Updated', 'project', id, `Updated project ${updated.name}`);
    this.recalculateAllProjectMetrics();
    this.saveToStorage();
    return updated;
  }

  // --- COMPLETE PROJECT & ARCHIVE TO HISTORICAL DATABASE ---
  public completeProject(projectId: string, user: User | null): ProjectHistory {
    const proj = this.projects.find((p) => p.id === projectId);
    if (!proj) throw new Error('Project not found');

    proj.status = 'Completed';
    proj.progress = 100;
    if (!proj.actual_completion) {
      proj.actual_completion = new Date().toISOString().split('T')[0];
    }
    proj.forecast_remaining = 0;

    // Get cost breakdowns
    const projCosts = this.costs.filter((c) => c.project_id === projectId);
    const labourCost = projCosts
      .filter((c) => c.category === 'Labour')
      .reduce((sum, c) => sum + c.amount, 0);
    const materialCost = projCosts
      .filter((c) => c.category === 'Materials')
      .reduce((sum, c) => sum + c.amount, 0);
    const subCost = projCosts
      .filter((c) => c.category === 'Subcontractor')
      .reduce((sum, c) => sum + c.amount, 0);
    const eqCost = projCosts
      .filter((c) => c.category === 'Equipment')
      .reduce((sum, c) => sum + c.amount, 0);
    const otherCost = projCosts
      .filter((c) => c.category === 'Other')
      .reduce((sum, c) => sum + c.amount, 0);

    const recordedTotal = projCosts.reduce((sum, c) => sum + c.amount, 0);
    const finalCost = recordedTotal > 0 ? recordedTotal : proj.actual_cost || proj.approved_budget;
    const finalProfit = proj.contract_value - finalCost;
    const finalMargin = (finalProfit / proj.contract_value) * 100;

    // Calculate duration in weeks
    const start = new Date(proj.start_date);
    const end = new Date(proj.actual_completion);
    const diffMs = Math.max(0, end.getTime() - start.getTime());
    const durationWeeks = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24 * 7))) || 32;

    const floorArea = proj.floor_area || 500;
    const costPerM2 = finalCost / floorArea;
    const contractPerM2 = proj.contract_value / floorArea;

    const client = this.clients.find((c) => c.id === proj.client_id);

    // Check if already in history, if so update, else add
    const existingHistIdx = this.projectHistory.findIndex((h) => h.project_id === projectId);

    const historyRecord: ProjectHistory = {
      id: existingHistIdx >= 0 ? this.projectHistory[existingHistIdx].id : 'hist_' + Date.now(),
      project_id: projectId,
      project_name: proj.name,
      client_name: client ? client.name : 'Client',
      project_type: proj.type,
      building_type: proj.building_type,
      location: proj.location,
      floor_area: floorArea,
      floors: proj.floors,
      contract_value: proj.contract_value,
      final_cost: finalCost,
      completion_year: new Date(proj.actual_completion).getFullYear(),
      duration_weeks: durationWeeks,
      labour_cost: labourCost,
      material_cost: materialCost,
      subcontractor_cost: subCost,
      equipment_cost: eqCost,
      other_cost: otherCost,
      profit: finalProfit,
      margin: Number(finalMargin.toFixed(2)),
      cost_per_m2: Number(costPerM2.toFixed(2)),
      contract_value_per_m2: Number(contractPerM2.toFixed(2)),
      completed_date: proj.actual_completion,
    };

    if (existingHistIdx >= 0) {
      this.projectHistory[existingHistIdx] = historyRecord;
    } else {
      this.projectHistory.unshift(historyRecord);
    }

    this.addAuditLog(
      user,
      'Project Completed & Archived',
      'history',
      historyRecord.id,
      `Project ${proj.name} marked Completed. Archived historical record with Final Cost C$${finalCost.toLocaleString()} (C$${Math.round(costPerM2).toLocaleString()}/m²)`
    );

    this.recalculateAllProjectMetrics();
    this.saveToStorage();
    return historyRecord;
  }

  // --- WBS ITEMS ---
  public getWBSItems(projectId?: string): WBSItem[] {
    if (projectId) {
      return this.wbsItems.filter((w) => w.project_id === projectId);
    }
    return [...this.wbsItems];
  }

  public addWBSItem(itemData: Omit<WBSItem, 'id' | 'actual_cost'>, user: User | null): WBSItem {
    const newItem: WBSItem = {
      ...itemData,
      id: 'wbs_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      actual_cost: 0,
    };
    this.wbsItems.push(newItem);
    this.addAuditLog(
      user,
      'WBS Activity Added',
      'wbs',
      newItem.id,
      `Added ${newItem.wbs_code} - ${newItem.name} (Planned: C$${newItem.planned_cost.toLocaleString()})`
    );
    this.recalculateAllProjectMetrics();
    this.saveToStorage();
    return newItem;
  }

  public updateWBSItem(id: string, updates: Partial<WBSItem>, user: User | null): WBSItem {
    const idx = this.wbsItems.findIndex((w) => w.id === id);
    if (idx === -1) throw new Error('WBS item not found');

    const updated = { ...this.wbsItems[idx], ...updates };
    if (updated.progress === 100) {
      updated.status = 'Completed';
    } else if (updated.progress > 0 && updated.status === 'Not Started') {
      updated.status = 'In Progress';
    }

    this.wbsItems[idx] = updated;
    this.addAuditLog(
      user,
      'WBS Activity Updated',
      'wbs',
      id,
      `Updated ${updated.wbs_code} - ${updated.name}: Progress ${updated.progress}%`
    );
    this.recalculateAllProjectMetrics();
    this.saveToStorage();
    return updated;
  }

  public deleteWBSItem(id: string, user: User | null): void {
    const item = this.wbsItems.find((w) => w.id === id);
    if (!item) return;

    // Delete item and any children if phase
    this.wbsItems = this.wbsItems.filter((w) => w.id !== id && w.parent_id !== id);
    this.addAuditLog(user, 'WBS Activity Deleted', 'wbs', id, `Removed WBS item ${item.wbs_code}`);
    this.recalculateAllProjectMetrics();
    this.saveToStorage();
  }

  // --- COSTS ---
  public getCosts(projectId?: string): CostRecord[] {
    if (projectId) {
      return this.costs.filter((c) => c.project_id === projectId);
    }
    return [...this.costs];
  }

  public addCost(costData: Omit<CostRecord, 'id' | 'created_at'>, user: User | null): CostRecord {
    const newCost: CostRecord = {
      ...costData,
      id: 'cost_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString(),
    };
    this.costs.unshift(newCost);

    const proj = this.projects.find((p) => p.id === newCost.project_id);
    const wbs = this.wbsItems.find((w) => w.id === newCost.wbs_id);

    this.addAuditLog(
      user,
      'Cost Added',
      'cost',
      newCost.id,
      `Recorded C$${newCost.amount.toLocaleString()} for ${newCost.category} (${newCost.description}) on project ${proj?.name || newCost.project_id} [WBS: ${wbs?.wbs_code || 'N/A'}]`
    );

    // Automatic cascade calculation
    this.recalculateAllProjectMetrics();
    this.saveToStorage();
    return newCost;
  }

  public updateCost(id: string, updates: Partial<CostRecord>, user: User | null): CostRecord {
    const idx = this.costs.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Cost record not found');

    const updated = { ...this.costs[idx], ...updates };
    this.costs[idx] = updated;

    this.addAuditLog(
      user,
      'Cost Edited',
      'cost',
      id,
      `Updated cost record ${id} to C$${updated.amount.toLocaleString()}`
    );

    this.recalculateAllProjectMetrics();
    this.saveToStorage();
    return updated;
  }

  public deleteCost(id: string, user: User | null): void {
    const cost = this.costs.find((c) => c.id === id);
    if (!cost) return;

    this.costs = this.costs.filter((c) => c.id !== id);
    this.addAuditLog(
      user,
      'Cost Deleted',
      'cost',
      id,
      `Deleted cost record of C$${cost.amount.toLocaleString()} (${cost.description})`
    );

    this.recalculateAllProjectMetrics();
    this.saveToStorage();
  }

  // --- SITE REPORTS ---
  public getSiteReports(projectId?: string): SiteReport[] {
    if (projectId) {
      return this.siteReports.filter((r) => r.project_id === projectId);
    }
    return [...this.siteReports];
  }

  public addSiteReport(
    reportData: Omit<SiteReport, 'id' | 'created_at'>,
    user: User | null
  ): SiteReport {
    const newReport: SiteReport = {
      ...reportData,
      id: 'sr_' + Date.now(),
      created_at: new Date().toISOString(),
    };
    this.siteReports.unshift(newReport);

    // Update project progress if reported
    if (reportData.progress !== undefined) {
      const proj = this.projects.find((p) => p.id === reportData.project_id);
      if (proj && proj.status === 'Active') {
        proj.progress = Math.max(proj.progress || 0, reportData.progress);
      }
    }

    this.addAuditLog(
      user,
      'Site Report Created',
      'site_report',
      newReport.id,
      `Submitted site report for date ${newReport.date} by ${newReport.supervisor} (${newReport.workers} workers, progress: ${newReport.progress}%)`
    );

    this.recalculateAllProjectMetrics();
    this.saveToStorage();
    return newReport;
  }

  public updateSiteReport(
    id: string,
    updates: Partial<SiteReport>,
    user: User | null
  ): SiteReport | null {
    const idx = this.siteReports.findIndex((r) => r.id === id);
    if (idx === -1) return null;

    const existing = this.siteReports[idx];
    const updated: SiteReport = {
      ...existing,
      ...updates,
    };
    this.siteReports[idx] = updated;

    if (updates.progress !== undefined) {
      const proj = this.projects.find((p) => p.id === updated.project_id);
      if (proj && proj.status === 'Active') {
        proj.progress = Math.max(proj.progress || 0, updates.progress);
      }
    }

    if (updates.flag && updates.flag !== existing.flag) {
      this.addAuditLog(
        user,
        `Site Report Flagged: ${updates.flag.toUpperCase()}`,
        'site_report',
        id,
        `Updated site report flag from "${existing.flag || 'normal'}" to "${updates.flag}" by ${user?.name || 'System'}`
      );
    }

    this.recalculateAllProjectMetrics();
    this.saveToStorage();
    return updated;
  }

  // --- NOTIFICATION & EMAIL ALERTS ---
  public getAlerts(projectId?: string): EmailAlert[] {
    if (projectId) {
      return this.alerts.filter((a) => a.project_id === projectId);
    }
    return [...this.alerts];
  }

  public addAlert(alert: EmailAlert): void {
    // Unshift so most recent is first
    this.alerts = [alert, ...this.alerts.filter((a) => a.id !== alert.id)];
    this.saveToStorage();
  }

  public deleteAlert(alertId: string): void {
    this.alerts = this.alerts.filter((a) => a.id !== alertId);
    this.saveToStorage();
  }

  public clearAlerts(): void {
    this.alerts = [];
    this.saveToStorage();
  }

  // --- HISTORICAL PROJECTS ---
  public getHistoricalProjects(): ProjectHistory[] {
    return [...this.projectHistory];
  }

  public getHistoricalProject(id: string): ProjectHistory | undefined {
    return this.projectHistory.find((h) => h.id === id || h.project_id === id);
  }

  public addHistoricalProject(record: ProjectHistory): ProjectHistory {
    this.projectHistory.unshift(record);
    this.saveToStorage();
    return record;
  }

  // --- PROJECT INTELLIGENCE & BENCHMARK ENGINE ---
  // Sections 17, 18, 19, 20, 21
  public calculateIntelligence(params: IntelligenceParams): CostBenchmarkResult {
    const history = this.getHistoricalProjects();

    // 1. Calculate similarity for each historical project using defined weights:
    // 1. Project Type (35%)
    // 2. Building Type (25%)
    // 3. Floor Area proximity (25%)
    // 4. Location (15%)
    const matches: SimilarProjectMatch[] = history.map((hist) => {
      let score = 0;
      const reasons: string[] = [];

      // Project Type matching (35 points)
      if (hist.project_type.toLowerCase() === params.project_type.toLowerCase()) {
        score += 35;
        reasons.push(`Exact Project Type match: ${hist.project_type} (+35%)`);
      } else {
        reasons.push(`Different Type: ${hist.project_type} vs ${params.project_type}`);
      }

      // Building Type matching (25 points)
      const histBldg = (hist.building_type || '').toLowerCase();
      const targetBldg = (params.building_type || '').toLowerCase();
      if (histBldg === targetBldg) {
        score += 25;
        reasons.push(`Exact Building Type: ${hist.building_type} (+25%)`);
      } else if (
        histBldg.includes(targetBldg) ||
        targetBldg.includes(histBldg) ||
        (histBldg.includes('apartment') && targetBldg.includes('residential'))
      ) {
        score += 18;
        reasons.push(`Close Building Typology: ${hist.building_type} (+18%)`);
      } else {
        reasons.push(`Different Building Type: ${hist.building_type}`);
      }

      // Floor Area proximity (25 points)
      const targetArea = params.floor_area > 0 ? params.floor_area : 500;
      const areaRatio = Math.abs(hist.floor_area - targetArea) / targetArea;
      // Area similarity: within 10% = full 25 pts, within 30% = 18 pts, within 50% = 10 pts, else scaled
      const areaScore = Math.max(0, Math.round(25 * Math.max(0, 1 - areaRatio * 1.5)));
      score += areaScore;
      const areaDiffPct = Math.round(areaRatio * 100);
      reasons.push(`Floor area ${hist.floor_area} m² (${areaDiffPct}% variance from ${targetArea} m²) (+${areaScore}%)`);

      // Location matching (15 points)
      const histCity = hist.location.toLowerCase();
      const targetCity = params.location.toLowerCase();
      if (targetCity && (histCity.includes(targetCity) || targetCity.includes(histCity.split(',')[0]))) {
        score += 15;
        reasons.push(`Same Location: ${hist.location} (+15%)`);
      } else if (histCity.includes('on') && targetCity.includes('on')) {
        score += 8;
        reasons.push(`Same Geographic Region (Ontario) (+8%)`);
      } else {
        score += 3;
        reasons.push(`Alternative geographic market`);
      }

      // Floor count nuance (bonus 2% cap at 100)
      if (Math.abs(hist.floors - params.floors) <= 1) {
        score = Math.min(100, score + 3);
      }

      return {
        history: hist,
        similarity_score: Math.min(100, Math.max(10, Math.round(score))),
        reasons,
      };
    });

    // Sort by highest similarity
    matches.sort((a, b) => b.similarity_score - a.similarity_score);

    // Pick top relevant projects (e.g. similarity >= 60% or top 3)
    let topRelevant = matches.filter((m) => m.similarity_score >= 50);
    if (topRelevant.length < 2) {
      topRelevant = matches.slice(0, 3);
    }

    // Cost Benchmark statistics across the top relevant historical projects
    const costPerM2List = topRelevant.map((m) => m.history.cost_per_m2).sort((a, b) => a - b);
    const sumCostM2 = costPerM2List.reduce((sum, val) => sum + val, 0);
    const avgCostM2 = Math.round(sumCostM2 / costPerM2List.length);

    // Median
    const mid = Math.floor(costPerM2List.length / 2);
    const medianCostM2 =
      costPerM2List.length % 2 !== 0
        ? Math.round(costPerM2List[mid])
        : Math.round((costPerM2List[mid - 1] + costPerM2List[mid]) / 2);

    const minCostM2 = Math.round(Math.min(...costPerM2List));
    const maxCostM2 = Math.round(Math.max(...costPerM2List));

    // Preliminary estimate calculation: Area * Benchmark cost/m²
    const targetArea = params.floor_area > 0 ? params.floor_area : 600;
    const preliminaryCost = Math.round(targetArea * avgCostM2);

    // Indicative range
    const preliminaryRangeLow = Math.round(targetArea * minCostM2);
    const preliminaryRangeHigh = Math.round(targetArea * maxCostM2);

    // Rule-based insights generated directly from actual database calculations (Section 21)
    const insights: string[] = [];

    // Insight 1: Average Cost/m²
    insights.push(
      `Similar completed projects averaged C$${avgCostM2.toLocaleString()}/m² across ${topRelevant.length} comparable builds.`
    );

    // Insight 2: Size comparison
    const avgHistArea =
      topRelevant.reduce((sum, m) => sum + m.history.floor_area, 0) / topRelevant.length;
    const sizeDiffPct = Math.round(((targetArea - avgHistArea) / avgHistArea) * 100);
    if (Math.abs(sizeDiffPct) >= 3) {
      const direction = sizeDiffPct > 0 ? 'larger' : 'smaller';
      insights.push(
        `Your proposed project is approximately ${Math.abs(sizeDiffPct)}% ${direction} than the average comparable project (${Math.round(avgHistArea)} m² vs ${targetArea} m²).`
      );
    } else {
      insights.push(
        `Your proposed project floor area (${targetArea} m²) closely matches the historical comparable average (${Math.round(avgHistArea)} m²).`
      );
    }

    // Insight 3: Material / Labour cost proportion breakdown from historical database
    const totalHistoricalCost = topRelevant.reduce((sum, m) => sum + m.history.final_cost, 0);
    const totalMaterialCost = topRelevant.reduce((sum, m) => sum + m.history.material_cost, 0);
    const totalLabourCost = topRelevant.reduce((sum, m) => sum + m.history.labour_cost, 0);

    if (totalHistoricalCost > 0) {
      const matPct = Math.round((totalMaterialCost / totalHistoricalCost) * 100);
      const labPct = Math.round((totalLabourCost / totalHistoricalCost) * 100);
      insights.push(
        `Material costs represented approximately ${matPct}% of total cost across comparable projects, while direct labour accounted for ${labPct}%.`
      );
    }

    // Insight 4: Project duration
    const avgDuration = Math.round(
      topRelevant.reduce((sum, m) => sum + m.history.duration_weeks, 0) / topRelevant.length
    );
    const minYear = Math.min(...topRelevant.map((m) => m.history.completion_year));
    const maxYear = Math.max(...topRelevant.map((m) => m.history.completion_year));
    insights.push(
      `Comparable projects completed between ${minYear} and ${maxYear} had an average duration of ${avgDuration} weeks.`
    );

    return {
      params,
      matched_projects: matches,
      avg_cost_per_m2: avgCostM2,
      median_cost_per_m2: medianCostM2,
      min_cost_per_m2: minCostM2,
      max_cost_per_m2: maxCostM2,
      preliminary_cost: preliminaryCost,
      preliminary_range_low: preliminaryRangeLow,
      preliminary_range_high: preliminaryRangeHigh,
      insights,
      generated_at: new Date().toISOString(),
    };
  }

  // --- SETTINGS & AUDIT LOGS ---
  public getSettings(): SystemSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<SystemSettings>, user: User | null): SystemSettings {
    this.settings = { ...this.settings, ...newSettings, updated_at: new Date().toISOString() };
    this.addAuditLog(user, 'Settings Updated', 'settings', this.settings.id, 'Updated system configuration parameters');
    this.saveToStorage();
    return { ...this.settings };
  }

  // --- Project Documents CRUD ---
  public getDocuments(projectId?: string): ProjectDocument[] {
    if (projectId) {
      return this.documents.filter((d) => d.project_id === projectId);
    }
    return [...this.documents];
  }

  public getDocumentById(id: string): ProjectDocument | undefined {
    return this.documents.find((d) => d.id === id);
  }

  public addDocument(
    docData: Omit<ProjectDocument, 'id' | 'uploaded_at'>,
    user?: User | null
  ): ProjectDocument {
    const newDoc: ProjectDocument = {
      ...docData,
      id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      uploaded_at: new Date().toISOString(),
      uploaded_by: docData.uploaded_by || user?.name || 'Project Manager',
    };
    this.documents.unshift(newDoc);
    this.saveToStorage();
    this.addAuditLog(
      user || null,
      'Document Attached',
      'project',
      newDoc.project_id,
      `Attached "${newDoc.title}" (${newDoc.category} - ${newDoc.file_name})`
    );
    return newDoc;
  }

  public updateDocument(
    id: string,
    updates: Partial<ProjectDocument>,
    user?: User | null
  ): ProjectDocument {
    const index = this.documents.findIndex((d) => d.id === id);
    if (index === -1) throw new Error(`Document not found: ${id}`);
    this.documents[index] = { ...this.documents[index], ...updates };
    this.saveToStorage();
    this.addAuditLog(
      user || null,
      'Document Updated',
      'project',
      this.documents[index].project_id,
      `Updated metadata for document "${this.documents[index].title}"`
    );
    return { ...this.documents[index] };
  }

  public deleteDocument(id: string, user?: User | null): void {
    const doc = this.documents.find((d) => d.id === id);
    this.documents = this.documents.filter((d) => d.id !== id);
    if (doc) {
      this.addAuditLog(
        user || null,
        'Document Deleted',
        'project',
        doc.project_id,
        `Removed document "${doc.title}" (${doc.file_name})`
      );
    }
    this.saveToStorage();
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }
}

export const db = new RelationalDatabaseService();
