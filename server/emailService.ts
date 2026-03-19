const ADMIN_EMAILS = ["raulv9471@gmail.com", "evillarreal@acsi-quality.com", "team@corecompliancehub.com"];
const FROM_EMAIL = "noreply@corecompliancehub.com";
const FROM_NAME = "Core Compliance Hub";
const MAILERSEND_API_URL = "https://api.mailersend.com/v1/email";

function brandedHtml(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display:inline-block;background:#ea6c19;color:#ffffff;font-weight:700;font-size:13px;letter-spacing:1px;padding:4px 10px;border-radius:4px;">CCHUB</span>
                    <span style="color:#ffffff;font-size:15px;font-weight:600;margin-left:10px;">Core Compliance Hub</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                Core Compliance Hub &nbsp;|&nbsp; Occupational Health &amp; Safety Compliance Platform<br />
                This is an automated notification. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  options?: { cc?: string[] }
): Promise<boolean> {
  const apiKey = process.env.MAILERSEND_API_KEY;
  if (!apiKey) {
    console.warn("[EmailService] MAILERSEND_API_KEY not set — emails will not be sent");
    return false;
  }

  const recipients = Array.isArray(to) ? to : [to];
  const validRecipients = recipients.filter(e => e && e.includes("@"));
  if (validRecipients.length === 0) {
    console.warn("[EmailService] No valid recipients for email:", subject);
    return false;
  }

  const body: Record<string, any> = {
    from: { email: FROM_EMAIL, name: FROM_NAME },
    to: validRecipients.map(email => ({ email })),
    subject,
    html,
  };

  if (options?.cc && options.cc.length > 0) {
    body.cc = options.cc.map(email => ({ email }));
  }

  try {
    const res = await fetch(MAILERSEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "(no body)");
      console.error(`[EmailService] MailerSend error ${res.status}:`, detail);
      return false;
    }

    console.log(`[EmailService] Sent "${subject}" to ${validRecipients.join(", ")}`);
    return true;
  } catch (err: any) {
    console.error("[EmailService] Failed to send email:", err?.message || err);
    return false;
  }
}

export const CCHUB_ADMIN_EMAILS = ADMIN_EMAILS;

// ── Email Templates ────────────────────────────────────────────────────────────

export function buildIncidentNotificationEmail(data: {
  companyName: string;
  employeeName: string;
  incidentDate: string;
  incidentType: string;
  location: string;
  description: string;
  isRecordable: boolean | null;
}): string {
  const recordableBadge = data.isRecordable
    ? `<span style="background:#dc2626;color:#fff;padding:3px 10px;border-radius:4px;font-size:12px;font-weight:700;">OSHA RECORDABLE</span>`
    : data.isRecordable === false
    ? `<span style="background:#16a34a;color:#fff;padding:3px 10px;border-radius:4px;font-size:12px;font-weight:700;">NOT RECORDABLE</span>`
    : `<span style="background:#d97706;color:#fff;padding:3px 10px;border-radius:4px;font-size:12px;font-weight:700;">RECORDABILITY PENDING</span>`;

  const body = `
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">Workplace Incident Reported</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;">A new workplace incident has been logged in Core Compliance Hub. Immediate action may be required.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;color:#475569;font-size:13px;width:160px;vertical-align:top;"><strong>Company:</strong></td>
            <td style="padding:6px 0;color:#0f172a;font-size:13px;">${data.companyName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#475569;font-size:13px;vertical-align:top;"><strong>Employee:</strong></td>
            <td style="padding:6px 0;color:#0f172a;font-size:13px;">${data.employeeName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#475569;font-size:13px;vertical-align:top;"><strong>Incident Date:</strong></td>
            <td style="padding:6px 0;color:#0f172a;font-size:13px;">${data.incidentDate}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#475569;font-size:13px;vertical-align:top;"><strong>Incident Type:</strong></td>
            <td style="padding:6px 0;color:#0f172a;font-size:13px;">${data.incidentType}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#475569;font-size:13px;vertical-align:top;"><strong>Location:</strong></td>
            <td style="padding:6px 0;color:#0f172a;font-size:13px;">${data.location || "Not specified"}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#475569;font-size:13px;vertical-align:top;"><strong>OSHA Status:</strong></td>
            <td style="padding:6px 0;">${recordableBadge}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    ${data.description ? `
    <div style="background:#fffbeb;border-left:4px solid #d97706;padding:12px 16px;border-radius:4px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#92400e;"><strong>Incident Description:</strong></p>
      <p style="margin:6px 0 0;font-size:13px;color:#78350f;">${data.description}</p>
    </div>` : ""}

    <p style="margin:0 0 16px;font-size:13px;color:#475569;">
      <strong>Next Steps:</strong> Log in to Core Compliance Hub to review this incident, complete the OSHA 300 log entry, and initiate a Corrective Action Plan (CAPA) if required.
    </p>

    <a href="https://cchub.app/incidents" style="display:inline-block;background:#ea6c19;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;font-size:14px;">View Incident in Dashboard →</a>
  `;

  return brandedHtml("Workplace Incident Reported", body);
}

function row(label: string, value: string | null | undefined, highlight = false): string {
  if (!value) return '';
  return `<tr>
    <td style="padding:5px 0;color:#475569;font-size:12px;width:200px;vertical-align:top;"><strong>${label}</strong></td>
    <td style="padding:5px 0;color:${highlight ? '#dc2626' : '#0f172a'};font-size:12px;">${value}</td>
  </tr>`;
}

function section(title: string, rows: string): string {
  const content = rows.trim();
  if (!content) return '';
  return `
  <p style="margin:18px 0 6px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;">${title}</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:4px;">
    <tr><td style="padding:12px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0">${content}</table>
    </td></tr>
  </table>`;
}

export function buildFROIAdjusterEmail(data: {
  companyName: string;
  inc: Record<string, any>;
  incidentDate: string;
}): string {
  const inc = data.inc;
  const recordableBadge = inc.isRecordable
    ? `<span style="background:#dc2626;color:#fff;padding:2px 10px;border-radius:4px;font-size:11px;font-weight:700;">OSHA RECORDABLE</span>`
    : `<span style="background:#64748b;color:#fff;padding:2px 10px;border-radius:4px;font-size:11px;font-weight:700;">NON-RECORDABLE / PENDING</span>`;

  const body = `
    <h2 style="margin:0 0 4px;color:#0f172a;font-size:20px;">Workers' Compensation — First Report of Injury</h2>
    <p style="margin:0 0 4px;color:#64748b;font-size:13px;">Submitted by <strong>${data.companyName}</strong> via Core Compliance Hub</p>
    <p style="margin:0 0 16px;">${recordableBadge}</p>

    ${section("I. Employee Data", [
      row("Employee Name", inc.employeeName),
      row("SSN (Last 4)", inc.employeeSsnLast4 ? `XXX-XX-${inc.employeeSsnLast4}` : null),
      row("Date of Birth", inc.employeeDob),
      row("Sex", inc.employeeSex ? inc.employeeSex.charAt(0).toUpperCase() + inc.employeeSex.slice(1) : null),
      row("Phone", inc.employeePhone),
      row("Home Address", inc.employeeAddress),
      row("Number of Dependents", inc.employeeDependents?.toString()),
      row("Tax Filing Status", inc.employeeTaxStatus?.replace(/_/g, ' ')),
    ].join(''))}

    ${section("II. Employment & Wage Data", [
      row("Job Title", inc.jobTitle),
      row("Department", inc.department),
      row("Date of Hire", inc.employeeHireDate),
      row("Total Gross Weekly Wage", inc.grossWeeklyWage),
      row("Number of Weeks Used", inc.weeksWorked?.toString()),
      row("Fringe Benefits Value", inc.fringeBenefitsValue),
      row("Volunteer", inc.isVolunteer ? "Yes" : null),
      row("Vocationally Handicapped", inc.isVocationallyHandicapped ? "Yes" : null),
      row("Date Employer Notified", inc.dateEmployerNotified),
    ].join(''))}

    ${section("III. Employer / Carrier / TPA Data", [
      row("Employer (Legal Name)", data.companyName),
      row("Federal Employer ID (FEIN)", inc.fein),
      row("UI Number", inc.uiNumber),
      row("SIC / NAICS Code", inc.sicNaicsCode),
      row("Facility / Site", inc.facility),
      row("Insurance Company", inc.insuranceCompany),
      row("Insurance Phone", inc.insurancePhone),
      row("Policy Number", inc.policyNumber),
      row("TPA Name", inc.tpaName),
    ].join(''))}

    ${section("IV. Injury / Incident Data", [
      row("Date of Injury / Illness", data.incidentDate),
      row("Time Employee Began Work", inc.timeWorkBegan),
      row("Time of Event", inc.timeOfEvent),
      row("Incident Location", [inc.injuryCity, inc.injuryState, inc.injuryCounty].filter(Boolean).join(', ')),
      row("Work Area", inc.location),
      row("On Employer Premises", inc.onEmployerPremises === true ? "Yes" : inc.onEmployerPremises === false ? "No" : null),
      row("Incident Type", inc.incidentType),
      row("Nature of Injury", inc.natureOfInjury),
      row("Body Part Affected", inc.bodyPart),
      row("Object / Substance", inc.objectOrSubstance),
    ].join(''))}

    ${inc.whatEmployeeWasDoing ? `
    <p style="margin:14px 0 4px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;">What Employee Was Doing</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 16px;font-size:12px;color:#0f172a;">${inc.whatEmployeeWasDoing}</div>
    ` : ''}

    ${inc.howInjuryOccurred ? `
    <p style="margin:14px 0 4px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;">How the Injury Occurred</p>
    <div style="background:#fffbeb;border-left:4px solid #d97706;border-radius:4px;padding:12px 16px;font-size:12px;color:#78350f;">${inc.howInjuryOccurred}</div>
    ` : ''}

    ${section("V. Medical Treatment", [
      row("Treating Physician", inc.physicianName),
      row("Treatment Facility", inc.treatmentFacility),
      row("Treatment Address", inc.treatmentAddress),
      row("Treated in ER", inc.treatedInEr ? "Yes" : null),
      row("Hospitalized Overnight", inc.hospitalizedOvernight ? "Yes" : null, inc.hospitalizedOvernight),
    ].join(''))}

    ${section("VI. OSHA 300 Classification & Key Dates", [
      row("OSHA Recordable", inc.isRecordable ? "YES" : "No", inc.isRecordable),
      row("Resulted in Death", inc.resultedInDeath ? "YES" : null, inc.resultedInDeath),
      row("Days Away from Work", inc.daysAway > 0 ? inc.daysAway.toString() : null),
      row("Days Restricted Duty", inc.daysRestricted > 0 ? inc.daysRestricted.toString() : null),
      row("Days Job Transfer", inc.daysJobTransfer > 0 ? inc.daysJobTransfer.toString() : null),
      row("Last Day Worked", inc.lastDayWorked),
      row("First Day Missed", inc.firstDayMissed),
      row("Return-to-Work Date", inc.returnToWorkDate),
      row("Date of Death", inc.deathDate, true),
    ].join(''))}

    <p style="margin:20px 0 0;font-size:12px;color:#64748b;">This First Report of Injury was generated by <strong>Core Compliance Hub</strong>. For questions contact the employer directly or log in to CCHUB to view the full incident record.</p>
  `;

  return brandedHtml("FROI — Workers' Compensation First Report of Injury", body);
}

export function buildCapaAssignmentEmail(data: {
  assigneeName: string;
  capaTitle: string;
  problemStatement: string;
  priority: string;
  targetDate: string;
  immediateActions?: string;
  correctiveActions?: string;
  companyName: string;
}): string {
  const priorityColor = data.priority === "critical" ? "#dc2626" : data.priority === "high" ? "#d97706" : data.priority === "medium" ? "#2563eb" : "#64748b";

  const body = `
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">CAPA Assigned to You</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;">A Corrective Action Plan has been assigned to you in Core Compliance Hub. Please review the details and take action by the target date.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;color:#475569;font-size:13px;width:160px;vertical-align:top;"><strong>CAPA Title:</strong></td>
            <td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;">${data.capaTitle}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#475569;font-size:13px;vertical-align:top;"><strong>Company:</strong></td>
            <td style="padding:6px 0;color:#0f172a;font-size:13px;">${data.companyName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#475569;font-size:13px;vertical-align:top;"><strong>Assigned To:</strong></td>
            <td style="padding:6px 0;color:#0f172a;font-size:13px;">${data.assigneeName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#475569;font-size:13px;vertical-align:top;"><strong>Priority:</strong></td>
            <td style="padding:6px 0;"><span style="background:${priorityColor};color:#fff;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:700;text-transform:uppercase;">${data.priority}</span></td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#475569;font-size:13px;vertical-align:top;"><strong>Target Date:</strong></td>
            <td style="padding:6px 0;color:#dc2626;font-size:13px;font-weight:600;">${data.targetDate}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;border-radius:4px;margin-bottom:16px;">
      <p style="margin:0;font-size:13px;color:#991b1b;"><strong>Problem Statement:</strong></p>
      <p style="margin:6px 0 0;font-size:13px;color:#7f1d1d;">${data.problemStatement}</p>
    </div>

    ${data.immediateActions ? `
    <div style="margin-bottom:16px;">
      <p style="margin:0 0 4px;font-size:13px;color:#475569;"><strong>Immediate Actions Required:</strong></p>
      <p style="margin:0;font-size:13px;color:#374151;background:#f0fdf4;padding:10px 14px;border-radius:6px;border:1px solid #d1fae5;">${data.immediateActions}</p>
    </div>` : ""}

    ${data.correctiveActions ? `
    <div style="margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:13px;color:#475569;"><strong>Corrective Actions Planned:</strong></p>
      <p style="margin:0;font-size:13px;color:#374151;background:#eff6ff;padding:10px 14px;border-radius:6px;border:1px solid #dbeafe;">${data.correctiveActions}</p>
    </div>` : ""}

    <a href="https://cchub.app/incidents" style="display:inline-block;background:#ea6c19;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;font-size:14px;">Open CAPA in Dashboard →</a>
  `;

  return brandedHtml("CAPA Assigned — Action Required", body);
}

export function buildCapaOverdueEmail(data: {
  capaTitle: string;
  responsiblePerson: string;
  targetDate: string;
  daysOverdue: number;
  problemStatement: string;
  companyName: string;
}): string {
  const body = `
    <h2 style="margin:0 0 8px;color:#dc2626;font-size:20px;">⚠ CAPA Past Due</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;">The following Corrective Action Plan has passed its target completion date and requires immediate attention.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;color:#7f1d1d;font-size:13px;width:160px;vertical-align:top;"><strong>CAPA Title:</strong></td>
            <td style="padding:6px 0;color:#991b1b;font-size:13px;font-weight:600;">${data.capaTitle}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#7f1d1d;font-size:13px;vertical-align:top;"><strong>Company:</strong></td>
            <td style="padding:6px 0;color:#374151;font-size:13px;">${data.companyName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#7f1d1d;font-size:13px;vertical-align:top;"><strong>Assigned To:</strong></td>
            <td style="padding:6px 0;color:#374151;font-size:13px;">${data.responsiblePerson}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#7f1d1d;font-size:13px;vertical-align:top;"><strong>Was Due:</strong></td>
            <td style="padding:6px 0;color:#dc2626;font-size:13px;font-weight:700;">${data.targetDate} &nbsp;(${data.daysOverdue} day${data.daysOverdue !== 1 ? "s" : ""} overdue)</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <div style="background:#fffbeb;border-left:4px solid #d97706;padding:12px 16px;border-radius:4px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#92400e;"><strong>Problem Statement:</strong></p>
      <p style="margin:6px 0 0;font-size:13px;color:#78350f;">${data.problemStatement}</p>
    </div>

    <p style="margin:0 0 16px;font-size:13px;color:#475569;">Please log in and update this CAPA's status immediately, or contact the responsible person to confirm completion.</p>

    <a href="https://cchub.app/incidents" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;font-size:14px;">Review Overdue CAPA →</a>
  `;

  return brandedHtml("CAPA Overdue — Immediate Attention Required", body);
}

export function buildContactInquiryAdminEmail(data: {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  employeeCount?: string;
  inquiryType: string;
  message: string;
}): string {
  const body = `
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">New Contact Inquiry</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;">A new inquiry has been submitted through the Core Compliance Hub website.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;color:#475569;font-size:13px;width:160px;"><strong>Name:</strong></td>
            <td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#475569;font-size:13px;"><strong>Email:</strong></td>
            <td style="padding:6px 0;"><a href="mailto:${data.email}" style="color:#ea6c19;font-size:13px;">${data.email}</a></td>
          </tr>
          ${data.company ? `<tr><td style="padding:6px 0;color:#475569;font-size:13px;"><strong>Company:</strong></td><td style="padding:6px 0;color:#0f172a;font-size:13px;">${data.company}</td></tr>` : ""}
          ${data.phone ? `<tr><td style="padding:6px 0;color:#475569;font-size:13px;"><strong>Phone:</strong></td><td style="padding:6px 0;color:#0f172a;font-size:13px;">${data.phone}</td></tr>` : ""}
          ${data.employeeCount ? `<tr><td style="padding:6px 0;color:#475569;font-size:13px;"><strong>Employee Count:</strong></td><td style="padding:6px 0;color:#0f172a;font-size:13px;">${data.employeeCount}</td></tr>` : ""}
          <tr>
            <td style="padding:6px 0;color:#475569;font-size:13px;"><strong>Inquiry Type:</strong></td>
            <td style="padding:6px 0;"><span style="background:#ea6c19;color:#fff;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:700;">${data.inquiryType}</span></td>
          </tr>
        </table>
      </td></tr>
    </table>

    <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:12px 16px;border-radius:4px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#14532d;"><strong>Message:</strong></p>
      <p style="margin:6px 0 0;font-size:14px;color:#166534;white-space:pre-wrap;">${data.message}</p>
    </div>

    <a href="mailto:${data.email}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;font-size:14px;">Reply to ${data.name} →</a>
  `;

  return brandedHtml(`New Inquiry: ${data.inquiryType} — ${data.name}`, body);
}

export function buildContactConfirmationEmail(data: {
  name: string;
  inquiryType: string;
}): string {
  const body = `
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">We Received Your Inquiry</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;">Thank you for reaching out, ${data.name}. Our team has received your ${data.inquiryType} inquiry and will follow up within <strong>1 business day</strong>.</p>

    <div style="background:#f0fdf4;border:1px solid #d1fae5;border-radius:8px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 12px;color:#166534;font-size:14px;font-weight:600;">What happens next:</p>
      <ul style="margin:0;padding-left:20px;color:#374151;font-size:13px;line-height:1.8;">
        <li>Our compliance team will review your inquiry</li>
        <li>You'll receive a personalized response within 1 business day</li>
        <li>For urgent compliance matters, please call us directly</li>
      </ul>
    </div>

    <p style="margin:0 0 20px;font-size:13px;color:#475569;">
      In the meantime, you can explore our compliance platform and AI-powered tools at <a href="https://cchub.app" style="color:#ea6c19;">cchub.app</a>.
    </p>

    <p style="margin:0;font-size:13px;color:#475569;">
      Best regards,<br />
      <strong>The Core Compliance Hub Team</strong><br />
      <a href="mailto:evillarreal@acsi-quality.com" style="color:#ea6c19;">evillarreal@acsi-quality.com</a>
    </p>
  `;

  return brandedHtml("We Received Your Inquiry — Core Compliance Hub", body);
}
