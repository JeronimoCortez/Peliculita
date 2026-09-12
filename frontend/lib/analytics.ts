// Analytics events: mismos nombres definidos en la spec original. Sink = console
// en este POC frontend-only; reemplazable por un sink real sin tocar los llamadores.
import { ANALYTICS_EVENTS } from "./constants";

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export function track(eventName: AnalyticsEventName, payload: Record<string, unknown> = {}) {
  const event = { event: eventName, timestamp: new Date().toISOString(), ...payload };
  // eslint-disable-next-line no-console
  console.log("[analytics]", event);
  return event;
}

export { ANALYTICS_EVENTS };
