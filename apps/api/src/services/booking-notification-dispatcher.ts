import type {
  Booking,
  BookingStatus,
  NotificationChannel,
} from "@prisma/client";
import { queueBookingNotification } from "./notification-queue.js";
import type { BookingEmailData } from "./email-templates.js";
import { logger } from "../lib/logger.js";
import type { BookingWithRelations } from "../repositories/booking-repository.js";

/**
 * Formats a date for display in notifications
 */
function formatNotificationDate(date: Date): string {
  return new Intl.DateTimeFormat("es-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(date);
}

/**
 * Converts a booking to email data
 */
function bookingToEmailData(
  booking: BookingWithRelations,
): BookingEmailData | null {
  if (!booking.customer || !booking.service || !booking.property) {
    logger.warn(
      { bookingId: booking.id },
      "Cannot create email data: missing required relations",
    );
    return null;
  }

  return {
    bookingId: booking.id,
    bookingCode: booking.code,
    customerName: booking.customer.fullName || booking.customer.email,
    serviceName: booking.service.name,
    propertyAddress: `${booking.property.addressLine}, ${booking.property.city}, ${booking.property.state} ${booking.property.zipCode}`,
    scheduledAt: formatNotificationDate(booking.scheduledAt),
    durationMin: booking.durationMin,
    totalAmount: `$${booking.totalAmount.toFixed(2)}`,
    notes: booking.notes || undefined,
    staffName:
      booking.assignedStaff?.fullName ||
      booking.assignedStaff?.email ||
      undefined,
  };
}

/**
 * Determines which notification channels to use based on user preferences
 * For now, defaults to EMAIL and IN_APP
 * Future: Read from user notification preferences
 */
function getNotificationChannels(
  customer: { phone?: string | null } | null | undefined,
): NotificationChannel[] {
  const channels: NotificationChannel[] = ["EMAIL", "IN_APP"];

  if (customer?.phone) {
    channels.push("SMS");
  }

  return channels;
}

/**
 * Queues notification for booking created
 */
export async function notifyBookingCreated(
  booking: BookingWithRelations,
): Promise<void> {
  if (!booking.customer) {
    logger.warn(
      { bookingId: booking.id },
      "Cannot send booking created notification: missing customer",
    );
    return;
  }

  const emailData = bookingToEmailData(booking);
  if (!emailData) {
    return;
  }

  try {
    await queueBookingNotification({
      userId: booking.customer.id,
      userEmail: booking.customer.email,
      type: "BOOKING_CREATED",
      channels: getNotificationChannels(booking.customer),
      bookingData: emailData,
      priority: 5,
    });

    logger.info(
      {
        bookingId: booking.id,
        bookingCode: booking.code,
        customerId: booking.customer.id,
      },
      "Booking created notification queued",
    );
  } catch (error) {
    logger.error(
      {
        bookingId: booking.id,
        error,
      },
      "Failed to queue booking created notification",
    );
  }
}

/**
 * Queues notification for booking cancelled
 */
export async function notifyBookingCancelled(
  booking: BookingWithRelations,
): Promise<void> {
  if (!booking.customer) return;

  const emailData = bookingToEmailData(booking);
  if (!emailData) return;

  try {
    await queueBookingNotification({
      userId: booking.customer.id,
      userEmail: booking.customer.email,
      type: "BOOKING_CANCELLED",
      channels: getNotificationChannels(booking.customer),
      bookingData: emailData,
      priority: 8,
    });

    logger.info(
      {
        bookingId: booking.id,
        bookingCode: booking.code,
        customerId: booking.customer.id,
      },
      "Booking cancelled notification queued",
    );
  } catch (error) {
    logger.error(
      {
        bookingId: booking.id,
        error,
      },
      "Failed to queue booking cancelled notification",
    );
  }
}

/**
 * Queues notification for booking completed
 */
export async function notifyBookingCompleted(
  booking: BookingWithRelations,
): Promise<void> {
  if (!booking.customer) return;

  const emailData = bookingToEmailData(booking);
  if (!emailData) return;

  try {
    await queueBookingNotification({
      userId: booking.customer.id,
      userEmail: booking.customer.email,
      type: "BOOKING_COMPLETED",
      channels: getNotificationChannels(booking.customer),
      bookingData: emailData,
      priority: 6,
    });

    logger.info(
      {
        bookingId: booking.id,
        bookingCode: booking.code,
        customerId: booking.customer.id,
      },
      "Booking completed notification queued",
    );
  } catch (error) {
    logger.error(
      {
        bookingId: booking.id,
        error,
      },
      "Failed to queue booking completed notification",
    );
  }
}

/**
 * Queues notification for booking rescheduled
 */
export async function notifyBookingRescheduled(
  booking: BookingWithRelations,
  oldScheduledAt: Date,
): Promise<void> {
  if (!booking.customer) return;

  const emailData = bookingToEmailData(booking);
  if (!emailData) return;

  try {
    await queueBookingNotification({
      userId: booking.customer.id,
      userEmail: booking.customer.email,
      type: "BOOKING_RESCHEDULED",
      channels: getNotificationChannels(booking.customer),
      bookingData: {
        ...emailData,
        oldScheduledAt: formatNotificationDate(oldScheduledAt),
      },
      priority: 7,
    });

    logger.info(
      {
        bookingId: booking.id,
        bookingCode: booking.code,
        customerId: booking.customer.id,
        oldScheduledAt: oldScheduledAt.toISOString(),
        newScheduledAt: booking.scheduledAt.toISOString(),
      },
      "Booking rescheduled notification queued",
    );
  } catch (error) {
    logger.error(
      {
        bookingId: booking.id,
        error,
      },
      "Failed to queue booking rescheduled notification",
    );
  }
}

/**
 * Queues notification for booking status changed
 */
export async function notifyBookingStatusChanged(
  booking: BookingWithRelations,
  oldStatus: BookingStatus,
  newStatus: BookingStatus,
): Promise<void> {
  // Handle specific status changes with dedicated notifications
  if (newStatus === "COMPLETED") {
    return await notifyBookingCompleted(booking);
  }

  if (newStatus === "CANCELLED") {
    return await notifyBookingCancelled(booking);
  }

  if (!booking.customer) return;

  const emailData = bookingToEmailData(booking);
  if (!emailData) return;

  // For other status changes, send a generic status change notification
  try {
    await queueBookingNotification({
      userId: booking.customer.id,
      userEmail: booking.customer.email,
      type: "BOOKING_STATUS_CHANGED",
      channels: ["IN_APP"], // Only in-app for generic status changes
      bookingData: emailData,
      priority: 4,
    });

    logger.info(
      {
        bookingId: booking.id,
        bookingCode: booking.code,
        customerId: booking.customer.id,
        oldStatus,
        newStatus,
      },
      "Booking status changed notification queued",
    );
  } catch (error) {
    logger.error(
      {
        bookingId: booking.id,
        error,
      },
      "Failed to queue booking status changed notification",
    );
  }
}

/**
 * Determines if a booking update should trigger notifications
 */
export async function handleBookingUpdate(
  oldBooking: Booking,
  newBooking: BookingWithRelations,
): Promise<void> {
  // Check for schedule change
  if (oldBooking.scheduledAt.getTime() !== newBooking.scheduledAt.getTime()) {
    await notifyBookingRescheduled(newBooking, oldBooking.scheduledAt);
    return;
  }

  // Check for status change
  if (oldBooking.status !== newBooking.status) {
    await notifyBookingStatusChanged(
      newBooking,
      oldBooking.status,
      newBooking.status,
    );
    return;
  }

  // For other changes (duration, notes, etc.), no notification needed
}
