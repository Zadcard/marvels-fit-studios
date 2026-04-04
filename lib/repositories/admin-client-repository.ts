import {
  adminClientRecords,
  type AdminClientRecord,
} from "@/lib/mocks/admin-clients";

export interface AdminClientRepository {
  list(): AdminClientRecord[];
}

class MockAdminClientRepository implements AdminClientRepository {
  list() {
    return adminClientRecords;
  }
}

export const adminClientRepository: AdminClientRepository =
  new MockAdminClientRepository();
