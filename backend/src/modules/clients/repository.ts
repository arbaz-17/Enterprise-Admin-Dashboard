import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";

import { db } from "../../db/index.js";
import { clients } from "../../db/schema.js";

import { escapeLike } from "../../lib/search.js";

import type {
  ClientListQuery,
  CreateClientInput,
  UpdateClientInput,
} from "./schemas.js";

// ============================================================
// READ OPERATIONS
// ============================================================

/**
 * Fetch clients with search, filtering, sorting
 * and pagination.
 */
export async function listClients(query: ClientListQuery) {
  const { page, pageSize, q, status, sortBy, sortDir } = query;

  const sortColumns = {
    name: clients.name,
    contactName: clients.contactName,
    contactEmail: clients.contactEmail,
    status: clients.status,
    updatedAt: clients.updatedAt,
  };

  const sortColumn = sortColumns[sortBy];

  // Build optional filters.
  const filters: SQL[] = [];

  if (q) {
    const pattern = `%${escapeLike(q)}%`;

    const searchFilter = or(
      ilike(clients.name, pattern),
      ilike(clients.contactName, pattern),
      ilike(clients.contactEmail, pattern),
    );

    if (searchFilter) {
      filters.push(searchFilter);
    }
  }

  if (status) {
    filters.push(eq(clients.status, status));
  }

  const where = filters.length > 0 ? and(...filters) : undefined;

  // Keep reads sequential with the existing DB pool.
  const records = await db
    .select()
    .from(clients)
    .where(where)
    .orderBy(
      sortDir === "desc" ? desc(sortColumn) : asc(sortColumn),
      asc(clients.id),
    )
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const total = await db.$count(clients, where);

  return {
    records,
    total,
  };
}

/**
 * Fetch a single client.
 * Returns undefined when no record exists.
 */
export async function getClientById(id: string) {
  const [record] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, id))
    .limit(1);

  return record;
}

// ============================================================
// WRITE OPERATIONS
// ============================================================

/**
 * Create a new client and return its full record.
 */
export async function createClientRecord(input: CreateClientInput) {
  const [created] = await db.insert(clients).values(input).returning();

  return created;
}

/**
 * Update an existing client.
 * Returns undefined if the client doesn't exist.
 */
export async function updateClientRecord(
  id: string,
  updates: UpdateClientInput,
) {
  const [updated] = await db
    .update(clients)
    .set({
      ...updates,
      updatedAt: sql`now()`,
    })
    .where(eq(clients.id, id))
    .returning();

  return updated;
}

/**
 * Delete a client.
 *
 * Foreign-key constraints prevent deletion
 * when dependent projects exist.
 */
export async function deleteClientRecord(id: string) {
  const [deleted] = await db
    .delete(clients)
    .where(eq(clients.id, id))
    .returning({
      id: clients.id,
    });

  return deleted;
}
