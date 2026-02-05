import { db } from "./db";
import { employees, companyProfiles, dotNotifications, users } from "@shared/schema";
import { eq, sql, and, lte, gte, isNotNull } from "drizzle-orm";

interface NotificationResult {
  employeeId: number;
  employeeName: string;
  employeePhone: string | null;
  employeeEmail: string | null;
  daysUntilExpiry: number;
  notificationType: '60_day' | '30_day' | '15_day' | '7_day';
  clinicName: string | null;
  clinicAddress: string | null;
  clinicPhone: string | null;
  managerEmail: string | null;
  userId: string;
}

export class DotNotificationService {
  async checkExpiringDotPhysicals(userId: string): Promise<NotificationResult[]> {
    const now = new Date();
    const results: NotificationResult[] = [];
    
    const employeesWithExpiry = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        phoneNumber: employees.phoneNumber,
        email: employees.email,
        dotPhysicalExpiry: employees.dotPhysicalExpiry,
        lastNotificationSent: employees.lastNotificationSent,
        notificationsSent: employees.notificationsSent,
        userId: employees.userId,
      })
      .from(employees)
      .where(
        and(
          eq(employees.userId, userId),
          isNotNull(employees.dotPhysicalExpiry),
          gte(employees.dotPhysicalExpiry, now)
        )
      );

    for (const emp of employeesWithExpiry) {
      if (!emp.dotPhysicalExpiry) continue;
      
      const daysUntilExpiry = Math.ceil(
        (emp.dotPhysicalExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      let notificationType: NotificationResult['notificationType'] | null = null;
      
      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
        notificationType = '7_day';
      } else if (daysUntilExpiry <= 15 && daysUntilExpiry > 7) {
        notificationType = '15_day';
      } else if (daysUntilExpiry <= 30 && daysUntilExpiry > 15) {
        notificationType = '30_day';
      } else if (daysUntilExpiry <= 60 && daysUntilExpiry > 30) {
        notificationType = '60_day';
      }
      
      if (!notificationType) continue;
      
      const alreadySent = await this.hasNotificationBeenSent(emp.id, notificationType);
      if (alreadySent) continue;
      
      const profile = await db
        .select()
        .from(companyProfiles)
        .where(eq(companyProfiles.userId, emp.userId))
        .limit(1);
      
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, emp.userId))
        .limit(1);
      
      results.push({
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        employeePhone: emp.phoneNumber,
        employeeEmail: emp.email,
        daysUntilExpiry,
        notificationType,
        clinicName: profile[0]?.clinicName || null,
        clinicAddress: profile[0]?.clinicAddress 
          ? `${profile[0].clinicAddress}, ${profile[0].clinicCity || ''} ${profile[0].clinicState || ''} ${profile[0].clinicZipCode || ''}`.trim()
          : null,
        clinicPhone: profile[0]?.clinicPhone || null,
        managerEmail: user[0]?.email || null,
        userId: emp.userId,
      });
    }
    
    return results;
  }
  
  async hasNotificationBeenSent(employeeId: number, notificationType: string): Promise<boolean> {
    // Only consider 'sent' notifications as blocking - failed/logged ones can be retried
    const existing = await db
      .select()
      .from(dotNotifications)
      .where(
        and(
          eq(dotNotifications.employeeId, employeeId),
          eq(dotNotifications.notificationType, notificationType),
          eq(dotNotifications.status, 'sent')
        )
      )
      .limit(1);
    
    return existing.length > 0;
  }
  
  generateMessage(notification: NotificationResult): string {
    const daysText = notification.daysUntilExpiry === 1 ? 'day' : 'days';
    
    let message = '';
    
    switch (notification.notificationType) {
      case '60_day':
        message = `Hi ${notification.employeeName.split(' ')[0]}, your DOT physical expires in 2 months.`;
        if (notification.clinicName) {
          message += ` Please plan to visit ${notification.clinicName} soon.`;
        }
        break;
      case '30_day':
        message = `Only 30 days left on your DOT medical card!`;
        if (notification.clinicName) {
          message += ` Tap for directions to ${notification.clinicName}.`;
        }
        break;
      case '15_day':
        message = `URGENT: Your DOT physical expires in ${notification.daysUntilExpiry} ${daysText}!`;
        if (notification.clinicName) {
          message += ` Visit ${notification.clinicName} immediately to avoid going Out of Service.`;
        }
        if (notification.clinicPhone) {
          message += ` Call: ${notification.clinicPhone}`;
        }
        break;
      case '7_day':
        message = `CRITICAL: Your DOT physical expires in ${notification.daysUntilExpiry} ${daysText}!`;
        message += ` You will be OUT OF SERVICE if not renewed. Contact your clinic TODAY.`;
        if (notification.clinicPhone) {
          message += ` Call: ${notification.clinicPhone}`;
        }
        break;
    }
    
    return message;
  }
  
  generateManagerAlert(notification: NotificationResult): string {
    return `Alert: Driver ${notification.employeeName}'s DOT physical expires in ${notification.daysUntilExpiry} days. No new certificate on file. Contact driver to avoid OOS (Out of Service) violations.`;
  }
  
  async logNotification(
    employeeId: number,
    userId: string,
    notificationType: string,
    channel: 'sms' | 'email' | 'push',
    message: string,
    recipientPhone?: string,
    recipientEmail?: string,
    status: string = 'pending'
  ) {
    await db.insert(dotNotifications).values({
      employeeId,
      userId,
      notificationType,
      channel,
      message,
      recipientPhone: recipientPhone || null,
      recipientEmail: recipientEmail || null,
      status,
      sentAt: status === 'sent' ? new Date() : null,
    });
  }
  
  async markNotificationSent(notificationId: number) {
    await db
      .update(dotNotifications)
      .set({ status: 'sent', sentAt: new Date() })
      .where(eq(dotNotifications.id, notificationId));
  }
  
  async getNotificationHistory(userId: string, limit = 50) {
    return db
      .select({
        id: dotNotifications.id,
        employeeId: dotNotifications.employeeId,
        notificationType: dotNotifications.notificationType,
        channel: dotNotifications.channel,
        message: dotNotifications.message,
        status: dotNotifications.status,
        sentAt: dotNotifications.sentAt,
        createdAt: dotNotifications.createdAt,
      })
      .from(dotNotifications)
      .where(eq(dotNotifications.userId, userId))
      .orderBy(sql`${dotNotifications.createdAt} DESC`)
      .limit(limit);
  }
  
  async getPendingNotifications() {
    return db
      .select()
      .from(dotNotifications)
      .where(eq(dotNotifications.status, 'pending'));
  }
  
  async getEmployeesNeedingManagerAlert(userId: string) {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    return db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        dotPhysicalExpiry: employees.dotPhysicalExpiry,
        dotCardImageUrl: employees.dotCardImageUrl,
        dotCardUploadedAt: employees.dotCardUploadedAt,
      })
      .from(employees)
      .where(
        and(
          eq(employees.userId, userId),
          isNotNull(employees.dotPhysicalExpiry),
          lte(employees.dotPhysicalExpiry, sevenDaysFromNow)
        )
      );
  }
}

export const dotNotificationService = new DotNotificationService();
