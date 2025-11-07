import { logger } from "../lib/logger.js";
import type { NotificationChannel, NotificationType } from "@prisma/client";
import { createNotification } from "./notification-service.js";
import { sendEmailNotification } from "./email-notification-service.js";
import { sendSmsNotification } from "./sms-notification-service.js";
import type { BookingEmailData } from "./email-templates.js";
import { getEmailTemplate } from "./email-templates.js";

export type NotificationQueueJob = {
  id: string;
  userId: string;
  userEmail: string;
  userPhone?: string;
  type: NotificationType;
  channels: NotificationChannel[];
  bookingData?: BookingEmailData & { oldScheduledAt?: string };
  priority?: number;
  scheduledFor?: Date;
};

export type QueueStatus = {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
};

/**
 * Simple in-memory notification queue
 * For production, consider using BullMQ with Redis
 */
class NotificationQueue {
  private queue: NotificationQueueJob[] = [];
  private processing = new Set<string>();
  private completed = new Set<string>();
  private failed = new Map<string, string>();
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  /**
   * Adds a notification job to the queue
   */
  async enqueue(job: NotificationQueueJob): Promise<void> {
    this.queue.push(job);
    this.queue.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    logger.info(
      {
        jobId: job.id,
        userId: job.userId,
        type: job.type,
        channels: job.channels,
      },
      "Notification job enqueued",
    );

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }
  }

  /**
   * Starts the queue processing loop
   */
  private startProcessing(): void {
    if (this.processingInterval) {
      return;
    }

    this.isProcessing = true;
    this.processingInterval = setInterval(() => {
      void this.processNext();
    }, 1000);

    // Ensure the interval doesn't keep the process alive
    this.processingInterval.unref?.();

    logger.info("Notification queue processing started");
  }

  /**
   * Stops the queue processing loop
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;

    logger.info("Notification queue processing stopped");
  }

  /**
   * Processes the next job in the queue
   */
  private async processNext(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    const now = new Date();
    const job = this.queue.find(
      (j) => !j.scheduledFor || j.scheduledFor <= now,
    );

    if (!job) {
      return;
    }

    // Remove from queue
    this.queue = this.queue.filter((j) => j.id !== job.id);
    this.processing.add(job.id);

    try {
      await this.processJob(job);
      this.processing.delete(job.id);
      this.completed.add(job.id);

      logger.info(
        {
          jobId: job.id,
          type: job.type,
        },
        "Notification job completed",
      );
    } catch (error) {
      this.processing.delete(job.id);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.failed.set(job.id, errorMessage);

      logger.error(
        {
          jobId: job.id,
          type: job.type,
          error: errorMessage,
        },
        "Notification job failed",
      );
    }
  }

  /**
   * Processes a single notification job
   */
  private async processJob(job: NotificationQueueJob): Promise<void> {
    for (const channel of job.channels) {
      try {
        // Create notification record
        const notificationId = await createNotification({
          userId: job.userId,
          type: job.type,
          channel,
          message: this.generateMessage(job, channel),
          subject: this.generateSubject(job),
          metadata: job.bookingData
            ? { bookingCode: job.bookingData.bookingCode }
            : undefined,
          bookingId: job.bookingData
            ? this.extractBookingId(job.bookingData)
            : undefined,
        });

        // Send via appropriate channel
        if (channel === "EMAIL" && job.bookingData) {
          await this.sendEmail(job, notificationId);
        } else if (channel === "SMS" && job.userPhone) {
          await this.sendSms(job, notificationId);
        }
        // IN_APP notifications are handled by createNotification
      } catch (error) {
        logger.error(
          {
            jobId: job.id,
            channel,
            error,
          },
          "Failed to send notification via channel",
        );
      }
    }
  }

  /**
   * Sends email notification
   */
  private async sendEmail(
    job: NotificationQueueJob,
    notificationId: string,
  ): Promise<void> {
    if (!job.bookingData) {
      throw new Error("Booking data required for email notifications");
    }

    const template = getEmailTemplate(job.type, job.bookingData);
    if (!template) {
      throw new Error(`No email template found for type: ${job.type}`);
    }

    await sendEmailNotification({
      notificationId,
      to: job.userEmail,
      subject: template.subject,
      text: template.text,
      html: template.html,
      type: job.type,
    });
  }

  /**
   * Sends SMS notification
   */
  private async sendSms(
    job: NotificationQueueJob,
    notificationId: string,
  ): Promise<void> {
    if (!job.userPhone) {
      throw new Error("Phone number required for SMS notifications");
    }

    const message = this.generateSmsMessage(job);

    await sendSmsNotification({
      notificationId,
      to: job.userPhone,
      message,
      type: job.type,
    });
  }

  /**
   * Generates notification message based on type
   */
  private generateMessage(
    job: NotificationQueueJob,
    channel: NotificationChannel,
  ): string {
    if (channel === "SMS") {
      return this.generateSmsMessage(job);
    }

    const data = job.bookingData;
    if (!data) {
      return `Notificación: ${job.type}`;
    }

    switch (job.type) {
      case "BOOKING_CREATED":
        return `Tu reserva ${data.bookingCode} ha sido creada para ${data.scheduledAt}`;
      case "BOOKING_REMINDER_24H":
        return `Recordatorio: Tu servicio ${data.bookingCode} es mañana a las ${data.scheduledAt}`;
      case "BOOKING_REMINDER_1H":
        return `Recordatorio: Tu servicio ${data.bookingCode} comienza en 1 hora`;
      case "BOOKING_COMPLETED":
        return `Tu servicio ${data.bookingCode} ha sido completado`;
      case "BOOKING_CANCELLED":
        return `Tu reserva ${data.bookingCode} ha sido cancelada`;
      case "BOOKING_RESCHEDULED":
        return `Tu reserva ${data.bookingCode} ha sido reprogramada para ${data.scheduledAt}`;
      default:
        return `Actualización de reserva ${data.bookingCode}`;
    }
  }

  /**
   * Generates SMS message
   */
  private generateSmsMessage(job: NotificationQueueJob): string {
    const data = job.bookingData;
    if (!data) {
      return `Brisa Cubana - Notificación`;
    }

    switch (job.type) {
      case "BOOKING_CREATED":
        return `Brisa Cubana: Reserva ${data.bookingCode} confirmada para ${data.scheduledAt}`;
      case "BOOKING_REMINDER_24H":
        return `Brisa Cubana: Recordatorio - Servicio mañana ${data.scheduledAt}. Reserva: ${data.bookingCode}`;
      case "BOOKING_REMINDER_1H":
        return `Brisa Cubana: Tu servicio comienza en 1 hora. Reserva: ${data.bookingCode}`;
      case "BOOKING_COMPLETED":
        return `Brisa Cubana: Servicio ${data.bookingCode} completado. ¡Gracias!`;
      case "BOOKING_CANCELLED":
        return `Brisa Cubana: Reserva ${data.bookingCode} cancelada`;
      case "BOOKING_RESCHEDULED":
        return `Brisa Cubana: Reserva ${data.bookingCode} reprogramada para ${data.scheduledAt}`;
      default:
        return `Brisa Cubana - Actualización de reserva ${data.bookingCode}`;
    }
  }

  /**
   * Generates subject for email notifications
   */
  private generateSubject(job: NotificationQueueJob): string | undefined {
    const data = job.bookingData;
    if (!data) {
      return undefined;
    }

    const template = getEmailTemplate(job.type, data);
    return template?.subject;
  }

  /**
   * Extracts booking ID from booking data metadata
   */
  private extractBookingId(data: BookingEmailData): string | undefined {
    return data.bookingId;
  }

  /**
   * Gets queue status
   */
  getStatus(): QueueStatus {
    return {
      pending: this.queue.length,
      processing: this.processing.size,
      completed: this.completed.size,
      failed: this.failed.size,
    };
  }

  /**
   * Clears completed and failed jobs
   */
  clearHistory(): void {
    this.completed.clear();
    this.failed.clear();
    logger.info("Notification queue history cleared");
  }
}

// Singleton instance
const notificationQueue = new NotificationQueue();

export { notificationQueue };

/**
 * Helper function to queue a booking notification
 */
export async function queueBookingNotification(
  job: Omit<NotificationQueueJob, "id">,
): Promise<void> {
  const jobWithId: NotificationQueueJob = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    ...job,
  };

  await notificationQueue.enqueue(jobWithId);
}
