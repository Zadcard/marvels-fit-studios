"use client";

import eventCatalog from "@/lib/analytics/event-catalog.json";

type AnalyticsPropertyValue = string | number | boolean;
type AnalyticsEventProperties = Record<string, AnalyticsPropertyValue>;
type AnalyticsEventName = keyof typeof eventCatalog;
type AnalyticsPropertyDefinition = {
  type: "string" | "number" | "boolean";
  required: boolean;
  description: string;
};
type AnalyticsEventDefinition = {
  description: string;
  trigger: string;
  privacy: string;
  properties: Record<string, AnalyticsPropertyDefinition>;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

function getEventDefinition(eventName: AnalyticsEventName): AnalyticsEventDefinition {
  return eventCatalog[eventName] as AnalyticsEventDefinition;
}

function validateEvent(
  eventName: AnalyticsEventName,
  properties: AnalyticsEventProperties
) {
  const definition = getEventDefinition(eventName);
  const allowedProperties = definition.properties;
  const missingProperties = Object.entries(allowedProperties)
    .filter(
      ([propertyName, propertyDefinition]) =>
        propertyDefinition.required &&
        !Object.prototype.hasOwnProperty.call(properties, propertyName)
    )
    .map(([propertyName]) => propertyName);
  const unexpectedProperties = Object.keys(properties).filter(
    (propertyName) => !Object.prototype.hasOwnProperty.call(allowedProperties, propertyName)
  );
  const invalidTypeProperties = Object.entries(properties)
    .filter(([propertyName, propertyValue]) => {
      const propertyDefinition = allowedProperties[propertyName];
      return propertyDefinition
        ? typeof propertyValue !== propertyDefinition.type
        : false;
    })
    .map(([propertyName]) => propertyName);

  if (
    missingProperties.length === 0 &&
    unexpectedProperties.length === 0 &&
    invalidTypeProperties.length === 0
  ) {
    return;
  }

  console.warn("[analytics] Event payload does not match catalog.", {
    eventName,
    missingProperties,
    unexpectedProperties,
    invalidTypeProperties,
  });
}

export function trackEvent(
  eventName: AnalyticsEventName,
  properties: AnalyticsEventProperties
) {
  if (typeof window === "undefined") {
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    validateEvent(eventName, properties);
  }

  const payload = {
    event: eventName,
    ...properties,
  };

  window.dispatchEvent(
    new CustomEvent("marvels:analytics-event", {
      detail: {
        name: eventName,
        properties,
      },
    })
  );

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);
}
