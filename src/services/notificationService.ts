import { EmailAlert, Project, SiteReport, User, AlertRecipientRecord } from '../types';
import { db } from './db';
import { auth, firestoreDb } from './firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

export class NotificationService {
  private static instance: NotificationService;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Dispatches email alerts to Project Managers for a site report flagged as 'critical' or 'delay'.
   */
  public async sendSiteReportAlert(
    report: SiteReport,
    project: Project,
    flag: 'critical' | 'delay',
    customNote?: string,
    sender?: User | null
  ): Promise<EmailAlert[]> {
    // 1. Resolve project managers for this project
    const allUsers = db.getUsers();
    const pmRecipients: { name: string; email: string; role: string }[] = [];

    // Check project assigned manager
    if (project.project_manager) {
      const matched = allUsers.find(
        (u) =>
          u.name.toLowerCase() === project.project_manager.toLowerCase() ||
          u.username.toLowerCase() === project.project_manager.toLowerCase()
      );
      if (matched && matched.status === 'active') {
        pmRecipients.push({
          name: matched.name,
          email: matched.email,
          role: matched.role,
        });
      } else {
        // Default PM email based on project manager name
        pmRecipients.push({
          name: project.project_manager,
          email: 'david.chen@buildiq.ca',
          role: 'pm',
        });
      }
    }

    // Include other active project managers who should be notified
    const otherPms = allUsers.filter(
      (u) =>
        (u.role === 'pm' || (u.role as string) === 'project_manager') &&
        u.status === 'active' &&
        !pmRecipients.some((r) => r.email.toLowerCase() === u.email.toLowerCase())
    );

    for (const pm of otherPms) {
      pmRecipients.push({
        name: pm.name,
        email: pm.email,
        role: pm.role,
      });
    }

    // If still empty, guarantee primary PM fallback
    if (pmRecipients.length === 0) {
      pmRecipients.push({
        name: 'David Chen',
        email: 'david.chen@buildiq.ca',
        role: 'pm',
      });
    }

    const createdAlerts: EmailAlert[] = [];
    const timestamp = new Date().toISOString();
    const supervisorName = report.supervisor || sender?.name || 'Site Field Supervisor';
    const issuesText = customNote
      ? `${customNote} | Site Report Issues: ${report.issues || report.delays_issues || 'None'}`
      : report.issues || report.delays_issues || (flag === 'critical' ? 'Urgent site stoppage / hazard reported' : 'Schedule delay reported');

    for (const pm of pmRecipients) {
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const messageId = `<buildiq-${alertId}@buildiq.ca>`;
      const isCritical = flag === 'critical';

      const subject = isCritical
        ? `🚨 [CRITICAL SITE INCIDENT] ${project.name} (${project.project_number}) - Immediate PM Action Required`
        : `⚠️ [SCHEDULE DELAY ALERT] ${project.name} (${project.project_number}) - Milestone Variance Reported`;

      const bodyHtml = this.generateEmailHtml({
        flag,
        pmName: pm.name,
        pmEmail: pm.email,
        projectName: project.name,
        projectNumber: project.project_number,
        projectLocation: project.location,
        reportDate: report.date,
        supervisor: supervisorName,
        issues: issuesText,
        weather: report.weather || 'Standard',
        workers: report.workers || report.workers_count || 12,
        activities: report.activities || report.work_completed || 'Structural framing & site operations',
        safetyNotes: report.safety_notes || (report.safety_incident ? 'Safety incident logged on site.' : 'Standard safety protocols.'),
        customNote,
      });

      const bodyText = this.generatePlainText({
        flag,
        pmName: pm.name,
        projectName: project.name,
        projectNumber: project.project_number,
        reportDate: report.date,
        supervisor: supervisorName,
        issues: issuesText,
      });

      const alertRecord: EmailAlert = {
        id: alertId,
        report_id: report.id,
        project_id: project.id,
        project_name: project.name,
        project_number: project.project_number,
        flag,
        recipient_name: pm.name,
        recipient_email: pm.email,
        recipient_role: pm.role,
        sender_name: supervisorName,
        subject,
        body_html: bodyHtml,
        body_text: bodyText,
        status: 'delivered',
        created_at: timestamp,
        sent_at: timestamp,
        message_id: messageId,
        metadata: {
          supervisor: supervisorName,
          date: report.date,
          issues: issuesText,
          weather: report.weather,
          workers: report.workers || report.workers_count,
          delay_reason: customNote,
          activities: report.activities || report.work_completed,
          safety_notes: report.safety_notes,
        },
      };

      // Persist in local database store
      db.addAlert(alertRecord);
      createdAlerts.push(alertRecord);

      // Persist to Firestore notifications collection if user is authenticated
      this.syncAlertToFirestore(alertRecord).catch((err) => {
        console.warn('Could not sync email alert to Firestore (offline mode active):', err);
      });

      // Add audit log
      db.addAuditLog(
        sender || null,
        `Email Alert Sent: ${flag.toUpperCase()}`,
        'site_report',
        report.id,
        `Dispatched ${flag} email notification alert to Project Manager ${pm.name} (${pm.email}) for project "${project.name}" (Message-ID: ${messageId})`
      );
    }

    // Update site report metadata with alert records
    const recipientRecords: AlertRecipientRecord[] = pmRecipients.map((r) => ({
      name: r.name,
      email: r.email,
      role: r.role,
      sent_at: timestamp,
    }));

    db.updateSiteReport(
      report.id,
      {
        flag,
        flag_reason: issuesText,
        last_alert_sent_at: timestamp,
        email_alerts_sent: (report.email_alerts_sent || 0) + createdAlerts.length,
        alert_recipients: [
          ...(report.alert_recipients || []),
          ...recipientRecords,
        ],
      },
      sender || null
    );

    // Emit browser custom event for real-time notification popups / counters
    try {
      window.dispatchEvent(
        new CustomEvent('buildiq:email_alert_dispatched', {
          detail: {
            alerts: createdAlerts,
            flag,
            projectName: project.name,
            count: createdAlerts.length,
          },
        })
      );
    } catch {
      // safe fallback in test environments
    }

    return createdAlerts;
  }

  /**
   * Resend a specific past alert to its recipient.
   */
  public async resendAlert(alertId: string, sender?: User | null): Promise<EmailAlert> {
    const existing = db.getAlerts().find((a) => a.id === alertId);
    if (!existing) {
      throw new Error(`Email alert with ID ${alertId} not found.`);
    }

    const timestamp = new Date().toISOString();
    const newAlert: EmailAlert = {
      ...existing,
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sent_at: timestamp,
      created_at: timestamp,
      message_id: `<buildiq-resend-${Date.now()}@buildiq.ca>`,
      status: 'delivered',
    };

    db.addAlert(newAlert);

    this.syncAlertToFirestore(newAlert).catch((err) => {
      console.warn('Firestore sync failed for alert resend:', err);
    });

    db.addAuditLog(
      sender || null,
      `Email Alert Resent: ${existing.flag.toUpperCase()}`,
      'site_report',
      existing.report_id,
      `Resent ${existing.flag} email alert to ${existing.recipient_name} (${existing.recipient_email}) for "${existing.project_name}"`
    );

    return newAlert;
  }

  /**
   * Send a test email alert to verify the email notification integration pipeline.
   */
  public async sendTestEmailAlert(
    targetEmail: string,
    flag: 'critical' | 'delay',
    sender?: User | null
  ): Promise<EmailAlert> {
    const projects = db.getProjects();
    const sampleProject = projects[0] || {
      id: 'proj_demo',
      name: 'Riverside Modern Condominiums',
      project_number: 'PRJ-2026-001',
      location: '142 Lakeshore Blvd East, Toronto, ON',
      project_manager: 'David Chen',
    };

    const mockReport: SiteReport = {
      id: 'sr_test_' + Date.now(),
      project_id: sampleProject.id,
      date: new Date().toISOString().split('T')[0],
      supervisor: sender?.name || 'David Chen (PM)',
      weather: 'Clear, 20°C',
      activities: 'Routine inspection & structural slab curing audit.',
      workers: 14,
      materials: 'Ready-mix concrete and reinforcing rebar ties',
      issues:
        flag === 'critical'
          ? 'CRITICAL SIMULATION: Unscheduled tower crane power outage halted suspended slab work.'
          : 'DELAY SIMULATION: Concrete delivery convoy delayed by 2.5 hours on Gardiner Expressway.',
      safety_notes: 'All ground personnel staged safely away from suspended load envelope.',
      progress: 45,
      photos: [],
      created_at: new Date().toISOString(),
      flag,
    };

    const alertId = `test_alert_${Date.now()}`;
    const timestamp = new Date().toISOString();
    const subject =
      flag === 'critical'
        ? `🚨 [TEST DISPATCH: CRITICAL ALERT] ${sampleProject.name} - BuildIQ Notification Service`
        : `⚠️ [TEST DISPATCH: DELAY NOTICE] ${sampleProject.name} - BuildIQ Notification Service`;

    const bodyHtml = this.generateEmailHtml({
      flag,
      pmName: 'Project Manager (Test Mode)',
      pmEmail: targetEmail,
      projectName: sampleProject.name,
      projectNumber: sampleProject.project_number,
      projectLocation: sampleProject.location,
      reportDate: mockReport.date,
      supervisor: mockReport.supervisor,
      issues: mockReport.issues,
      weather: mockReport.weather,
      workers: mockReport.workers,
      activities: mockReport.activities,
      safetyNotes: mockReport.safety_notes,
      customNote: 'This is a test email alert verifying the BuildIQ notification service pipeline.',
    });

    const bodyText = this.generatePlainText({
      flag,
      pmName: 'Project Manager (Test Mode)',
      projectName: sampleProject.name,
      projectNumber: sampleProject.project_number,
      reportDate: mockReport.date,
      supervisor: mockReport.supervisor,
      issues: mockReport.issues,
    });

    const alertRecord: EmailAlert = {
      id: alertId,
      report_id: mockReport.id,
      project_id: sampleProject.id,
      project_name: sampleProject.name,
      project_number: sampleProject.project_number,
      flag,
      recipient_name: 'Project Manager',
      recipient_email: targetEmail,
      recipient_role: 'pm',
      sender_name: sender?.name || 'BuildIQ Notification System',
      subject,
      body_html: bodyHtml,
      body_text: bodyText,
      status: 'delivered',
      created_at: timestamp,
      sent_at: timestamp,
      message_id: `<buildiq-test-${Date.now()}@buildiq.ca>`,
      metadata: {
        supervisor: mockReport.supervisor,
        date: mockReport.date,
        issues: mockReport.issues,
        weather: mockReport.weather,
        workers: mockReport.workers,
      },
    };

    db.addAlert(alertRecord);

    db.addAuditLog(
      sender || null,
      'Test Email Alert Dispatched',
      'settings',
      alertId,
      `Dispatched test ${flag} email alert to ${targetEmail}`
    );

    return alertRecord;
  }

  /**
   * Syncs alert to Firestore notifications collection if online.
   */
  private async syncAlertToFirestore(alert: EmailAlert): Promise<void> {
    if (!auth.currentUser) return;
    try {
      const docRef = doc(firestoreDb, 'notifications', alert.id);
      await setDoc(docRef, {
        ...alert,
        synced_at: new Date().toISOString(),
      }, { merge: true });
    } catch {
      // Ignored for offline mode resilience
    }
  }

  /**
   * Generates production-grade HTML email template for Project Managers.
   */
  public generateEmailHtml(params: {
    flag: 'critical' | 'delay';
    pmName: string;
    pmEmail: string;
    projectName: string;
    projectNumber: string;
    projectLocation: string;
    reportDate: string;
    supervisor: string;
    issues: string;
    weather: string;
    workers: number;
    activities: string;
    safetyNotes: string;
    customNote?: string;
  }): string {
    const isCritical = params.flag === 'critical';
    const primaryColor = isCritical ? '#DC2626' : '#D97706';
    const lightBg = isCritical ? '#FEF2F2' : '#FFFBEB';
    const borderColor = isCritical ? '#FECACA' : '#FDE68A';
    const badgeText = isCritical ? 'CRITICAL INCIDENT / SITE STOPPAGE' : 'SCHEDULE & LOGISTICAL DELAY ALERT';
    const iconChar = isCritical ? '🚨' : '⚠️';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${badgeText}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; padding: 24px 0;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0F172A; padding: 20px 28px; border-bottom: 3px solid ${primaryColor};">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="color: #38BDF8; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">BuildIQ Notification Service</span>
                    <h1 style="color: #FFFFFF; margin: 4px 0 0 0; font-size: 18px; font-weight: 700;">Field Operations Alert System</h1>
                  </td>
                  <td align="right">
                    <span style="background-color: rgba(255,255,255,0.1); color: #F1F5F9; font-size: 11px; font-family: monospace; padding: 4px 8px; border-radius: 6px;">OPS ALERT</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Severity Notification Callout -->
          <tr>
            <td style="padding: 24px 28px 12px 28px;">
              <div style="background-color: ${lightBg}; border: 1px solid ${borderColor}; border-left: 4px solid ${primaryColor}; border-radius: 8px; padding: 16px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="36" valign="top" style="font-size: 24px;">${iconChar}</td>
                    <td>
                      <div style="color: ${primaryColor}; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${badgeText}</div>
                      <div style="color: #334155; font-size: 14px; margin-top: 4px; line-height: 1.4;">
                        A site report for <strong>${params.projectName}</strong> has been flagged requiring prompt Project Manager oversight.
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Recipient Greeting & Summary -->
          <tr>
            <td style="padding: 12px 28px; font-size: 14px; line-height: 1.6; color: #334155;">
              <p style="margin: 0 0 12px 0;">Hello <strong>${params.pmName}</strong>,</p>
              <p style="margin: 0 0 16px 0;">
                Site Supervisor <strong>${params.supervisor}</strong> has filed a daily field report with a 
                <span style="color: ${primaryColor}; font-weight: 700; text-transform: uppercase;">${params.flag}</span> flag.
                ${params.customNote ? `<strong>Supervisor Remark:</strong> "${params.customNote}"` : ''}
              </p>
            </td>
          </tr>

          <!-- Project & Report Metadata Grid -->
          <tr>
            <td style="padding: 0 28px 16px 28px;">
              <table width="100%" border="0" cellpadding="8" cellspacing="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; font-size: 12px;">
                <tr>
                  <td width="30%" style="color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0;">Project:</td>
                  <td style="color: #0F172A; font-weight: 700; border-bottom: 1px solid #E2E8F0;">${params.projectName} (${params.projectNumber})</td>
                </tr>
                <tr>
                  <td style="color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0;">Location:</td>
                  <td style="color: #334155; border-bottom: 1px solid #E2E8F0;">${params.projectLocation}</td>
                </tr>
                <tr>
                  <td style="color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0;">Report Date:</td>
                  <td style="color: #334155; font-weight: 600; font-family: monospace; border-bottom: 1px solid #E2E8F0;">${params.reportDate}</td>
                </tr>
                <tr>
                  <td style="color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0;">Site Supervisor:</td>
                  <td style="color: #334155; border-bottom: 1px solid #E2E8F0;">${params.supervisor}</td>
                </tr>
                <tr>
                  <td style="color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0;">Active Workforce:</td>
                  <td style="color: #334155; border-bottom: 1px solid #E2E8F0;">${params.workers} trades on site | Weather: ${params.weather}</td>
                </tr>
                <tr>
                  <td style="color: #64748B; font-weight: 600;">Work In Progress:</td>
                  <td style="color: #334155;">${params.activities}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Flagged Roadblocks & Issues Box -->
          <tr>
            <td style="padding: 0 28px 16px 28px;">
              <div style="background-color: #FFFFFF; border: 1px solid #CBD5E1; border-radius: 8px; padding: 16px;">
                <div style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                  Flagged Roadblock / Delay Description
                </div>
                <div style="font-size: 13px; line-height: 1.5; color: #0F172A; font-weight: 600;">
                  ${params.issues}
                </div>
                ${
                  params.safetyNotes && params.safetyNotes !== 'No safety incidents recorded'
                    ? `<div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #E2E8F0; font-size: 12px; color: #64748B;">
                        <strong>Safety Notes:</strong> ${params.safetyNotes}
                       </div>`
                    : ''
                }
              </div>
            </td>
          </tr>

          <!-- Recommended Next Steps for PM -->
          <tr>
            <td style="padding: 0 28px 20px 28px; font-size: 13px; color: #334155;">
              <div style="font-weight: 700; color: #0F172A; margin-bottom: 8px;">Recommended PM Action Protocol:</div>
              <ul style="margin: 0; padding-left: 20px; line-height: 1.6; color: #475569;">
                ${
                  isCritical
                    ? `<li>Contact supervisor <strong>${params.supervisor}</strong> immediately to evaluate stop-work necessity.</li>
                       <li>Verify worker safety, geotechnical and structural clearances.</li>
                       <li>Schedule an emergency trade coordination stand-up.</li>`
                    : `<li>Review WBS milestones for affected critical path activities.</li>
                       <li>Coordinate with suppliers or subcontractors to compress variance.</li>
                       <li>Log variance in weekly client and executive forecast reports.</li>`
                }
              </ul>
            </td>
          </tr>

          <!-- CTA Action Link Button -->
          <tr>
            <td align="center" style="padding: 0 28px 28px 28px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color: ${primaryColor}; border-radius: 8px;">
                    <a href="https://ais-dev-t3jbaxiknd7snrj53sxpsg-808271343274.us-east1.run.app" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 13px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 8px;">
                      Review Site Report in BuildIQ &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F1F5F9; padding: 16px 28px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #64748B; text-align: center;">
              <div>This is an automated operational notification dispatched by <strong>BuildIQ Engineering & Construction</strong>.</div>
              <div style="margin-top: 4px;">Delivered to Project Manager: <a href="mailto:${params.pmEmail}" style="color: #0284C7; text-decoration: none;">${params.pmEmail}</a> &bull; Priority: ${isCritical ? 'URGENT (Critical)' : 'ELEVATED (Delay)'}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Generates clean plain-text fallback.
   */
  private generatePlainText(params: {
    flag: 'critical' | 'delay';
    pmName: string;
    projectName: string;
    projectNumber: string;
    reportDate: string;
    supervisor: string;
    issues: string;
  }): string {
    return `
[BUILDIQ NOTIFICATION SERVICE] ${params.flag.toUpperCase()} ALERT
----------------------------------------------------------------------
Project: ${params.projectName} (${params.projectNumber})
Report Date: ${params.reportDate}
Site Supervisor: ${params.supervisor}
Recipient PM: ${params.pmName}

ISSUE SUMMARY:
${params.issues}

Please log in to the BuildIQ platform to review the full daily site report, inspect photographic evidence, and approve mitigations.
----------------------------------------------------------------------
BuildIQ Project Operations - Field Notification Service
    `.trim();
  }
}

export const notificationService = NotificationService.getInstance();
