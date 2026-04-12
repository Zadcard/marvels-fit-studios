import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.join(
  __dirname,
  "..",
  "lib",
  "analytics",
  "event-catalog.json"
);
const eventCatalog = JSON.parse(readFileSync(catalogPath, "utf8"));

const allowedPropertyTypes = new Set(["string", "number", "boolean"]);
const disallowedPropertyNames = new Set([
  "email",
  "full_name",
  "name",
  "password",
  "phone",
]);

const entries = Object.entries(eventCatalog);

assert.ok(entries.length > 0, "Expected at least one analytics event.");

for (const [eventName, definition] of entries) {
  assert.match(
    eventName,
    /^[a-z][a-z0-9_]*$/,
    `Event name "${eventName}" must be snake_case.`
  );
  assert.equal(
    typeof definition.description,
    "string",
    `Event "${eventName}" must include a description.`
  );
  assert.ok(
    definition.description.length > 0,
    `Event "${eventName}" must not have an empty description.`
  );
  assert.equal(
    typeof definition.trigger,
    "string",
    `Event "${eventName}" must include a trigger description.`
  );
  assert.equal(
    definition.privacy,
    "no-pii",
    `Event "${eventName}" must explicitly declare no-pii privacy handling.`
  );

  for (const [propertyName, propertyDefinition] of Object.entries(
    definition.properties
  )) {
    assert.match(
      propertyName,
      /^[a-z][a-z0-9_]*$/,
      `Property "${propertyName}" in "${eventName}" must be snake_case.`
    );
    assert.ok(
      !disallowedPropertyNames.has(propertyName),
      `Property "${propertyName}" in "${eventName}" looks like direct PII.`
    );
    assert.ok(
      allowedPropertyTypes.has(propertyDefinition.type),
      `Property "${propertyName}" in "${eventName}" has an unsupported type.`
    );
    assert.equal(
      typeof propertyDefinition.required,
      "boolean",
      `Property "${propertyName}" in "${eventName}" must declare required.`
    );
    assert.equal(
      typeof propertyDefinition.description,
      "string",
      `Property "${propertyName}" in "${eventName}" must include a description.`
    );
  }
}

const requiredEvents = [
  "landing_join_modal_opened",
  "landing_join_form_submit_attempted",
  "landing_join_form_submit_succeeded",
  "landing_join_form_submit_failed",
];

for (const eventName of requiredEvents) {
  assert.ok(eventCatalog[eventName], `Missing catalog entry for ${eventName}.`);
}

console.log("analytics event catalog checks passed");
