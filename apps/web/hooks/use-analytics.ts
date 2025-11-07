type AnalyticsEvent = {
  event: string;
  properties?: Record<string, string | number | boolean>;
  timestamp: string;
};

/**
 * Simple analytics hook using localStorage
 * Tracks events locally without requiring a backend
 */
export function useAnalytics() {
  const trackEvent = (
    eventName: string,
    properties?: Record<string, string | number | boolean>,
  ) => {
    try {
      const event: AnalyticsEvent = {
        event: eventName,
        properties,
        timestamp: new Date().toISOString(),
      };

      // Store in localStorage
      const storageKey = "brisa_analytics_events";
      const existingEvents = localStorage.getItem(storageKey);
      const events: AnalyticsEvent[] = existingEvents
        ? JSON.parse(existingEvents)
        : [];

      events.push(event);

      // Keep only last 1000 events
      const trimmedEvents = events.slice(-1000);
      localStorage.setItem(storageKey, JSON.stringify(trimmedEvents));

      // Log in development
      if (process.env.NODE_ENV === "development") {
        console.log("[Analytics]", eventName, properties);
      }
    } catch (error) {
      // Fail silently - analytics should not break the app
      console.warn("Failed to track analytics event:", error);
    }
  };

  const getEvents = (): AnalyticsEvent[] => {
    try {
      const storageKey = "brisa_analytics_events";
      const existingEvents = localStorage.getItem(storageKey);
      return existingEvents ? JSON.parse(existingEvents) : [];
    } catch (error) {
      return [];
    }
  };

  const clearEvents = () => {
    try {
      localStorage.removeItem("brisa_analytics_events");
    } catch (error) {
      console.warn("Failed to clear analytics events:", error);
    }
  };

  return {
    trackEvent,
    getEvents,
    clearEvents,
  };
}
