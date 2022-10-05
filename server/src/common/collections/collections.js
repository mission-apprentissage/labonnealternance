import * as logsDescriptor from "./logs.js";
import * as migrationsDescriptor from "./migrations.js";
import { dbCollection } from "../mongodb.js";

export function getCollectionDescriptors() {
  return [logsDescriptor, migrationsDescriptor];
}

export function migrations() {
  return dbCollection(migrationsDescriptor.name);
}

export function logs() {
  return dbCollection(logsDescriptor.name);
}
