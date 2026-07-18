"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@/lib/supabase/domain";

import { requireRole } from "@/lib/auth/session";
import {
  bulkClientImportService,
  type BulkClientImportReport,
  type BulkClientPreviewRow,
} from "@/lib/services/bulk-client-import";

export async function previewClientImportCSV(
  csvContent: string
): Promise<BulkClientPreviewRow[]> {
  await requireRole(UserRole.ADMIN);
  return bulkClientImportService.parseClientsFromCSV(csvContent);
}

export async function importClientCSV(
  csvContent: string
): Promise<BulkClientImportReport> {
  await requireRole(UserRole.ADMIN);

  const stats = await bulkClientImportService.importClientsFromCSV(csvContent);
  const report = bulkClientImportService.generateImportReport(stats);

  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/groups");

  return report;
}
