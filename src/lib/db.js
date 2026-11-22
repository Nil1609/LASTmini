import crypto from 'crypto';
import { supabaseAdmin } from './supabase.js';

// Table column schemas matching Supabase PostgreSQL database
const TABLE_SCHEMAS = {
  users: new Set(['id', 'full_name', 'email', 'student_id', 'school', 'role', 'phone', 'password', 'created_at']),
  lost_reports: new Set(['id', 'user_id', 'reporter_name', 'reporter_email', 'item_name', 'category', 'description', 'color', 'brand', 'characteristics', 'location', 'date', 'time', 'image', 'verification_question', 'verification_answer', 'status', 'moderation_status', 'flag_count', 'created_at', 'updated_at']),
  found_reports: new Set(['id', 'user_id', 'reporter_name', 'reporter_email', 'item_name', 'category', 'description', 'color', 'brand', 'characteristics', 'location', 'date', 'time', 'custody', 'image', 'verification_question', 'verification_answer', 'status', 'moderation_status', 'flag_count', 'created_at', 'updated_at']),
  claims: new Set(['id', 'report_id', 'report_type', 'report_title', 'owner_id', 'claimant_id', 'claimant_name', 'claimant_email', 'claim_details', 'verification_answer_provided', 'is_verified_match', 'contact_note', 'conversation_id', 'status', 'created_at']),
  conversations: new Set(['id', 'report_id', 'report_title', 'report_type', 'owner_id', 'claimant_id', 'claim_id', 'status', 'created_at', 'updated_at']),
  messages: new Set(['id', 'conversation_id', 'sender_id', 'sender_name', 'text', 'created_at']),
  handover_verifications: new Set(['id', 'conversation_id', 'report_id', 'created_by', 'code', 'attempts', 'status', 'expires_at', 'verified_by', 'verified_at', 'created_at']),
  moderation_flags: new Set(['id', 'report_id', 'report_title', 'report_type', 'flagged_by', 'flagged_by_name', 'reason', 'details', 'status', 'created_at']),
  audit_logs: new Set(['id', 'admin_id', 'admin_name', 'action', 'target_report_id', 'target_report_title', 'reason', 'timestamp'])
};

const UUID_FIELDS = new Set(['id', 'user_id', 'owner_id', 'claimant_id', 'report_id', 'conversation_id', 'claim_id', 'created_by', 'verified_by', 'flagged_by', 'admin_id', 'target_report_id']);

function isUuid(val) {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
}

/**
 * Normalizes and filters fields to match Supabase table schemas
 */
function sanitizePayload(tableName, doc) {
  if (!doc || typeof doc !== 'object') return {};
  const allowed = TABLE_SCHEMAS[tableName];
  const out = {};

  // Alias mappings
  const raw = { ...doc };
  if (!raw.id && raw._id) raw.id = String(raw._id);
  delete raw._id;

  if (tableName === 'users') {
    if (raw.name && !raw.full_name) raw.full_name = raw.name;
    if (raw.studentId && !raw.student_id) raw.student_id = raw.studentId;
  }
  if (raw.createdAt && !raw.created_at) raw.created_at = raw.createdAt;
  if (raw.updatedAt && !raw.updated_at) raw.updated_at = raw.updatedAt;
  if (raw.itemName && !raw.item_name) raw.item_name = raw.itemName;

  // Ensure valid UUID for id if present or generating new
  if (raw.id) {
    if (!isUuid(raw.id)) {
      raw.id = crypto.randomUUID();
    }
  } else {
    raw.id = crypto.randomUUID();
  }

  // Sanitize date for date-only columns (lost_reports, found_reports)
  if (raw.date && typeof raw.date === 'string') {
    let d = raw.date.trim();
    if (d.includes('T')) d = d.split('T')[0];
    const dmyMatch = d.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      raw.date = `${year}-${month}-${day}`;
    } else {
      const ymdMatch = d.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
      if (ymdMatch) {
        const year = ymdMatch[1];
        const month = ymdMatch[2].padStart(2, '0');
        const day = ymdMatch[3].padStart(2, '0');
        raw.date = `${year}-${month}-${day}`;
      } else {
        const parsed = new Date(d);
        if (!isNaN(parsed.getTime())) {
          raw.date = parsed.toISOString().split('T')[0];
        }
      }
    }
  }

  // Filter against allowed table columns
  for (const [k, v] of Object.entries(raw)) {
    if (allowed && !allowed.has(k)) continue;
    // Don't insert undefined
    if (v !== undefined) {
      out[k] = v;
    }
  }

  return out;
}

/**
 * Filter mapping helper from MongoDB filter syntax to Supabase PostgREST query
 */
function applyFilterToSupabaseQuery(query, filter, tableName) {
  if (!filter || Object.keys(filter).length === 0) return { query, impossible: false };

  const allowed = tableName ? TABLE_SCHEMAS[tableName] : null;
  let impossible = false;

  for (const [key, value] of Object.entries(filter)) {
    if (key === '$or' && Array.isArray(value)) {
      const orParts = [];
      for (const sub of value) {
        for (const [subKey, subVal] of Object.entries(sub)) {
          const field = (subKey === '_id') ? 'id' : subKey;
          if (allowed && !allowed.has(field)) {
            // Column does not exist in this Supabase table - skip to prevent PostgREST column error
            continue;
          }
          if (UUID_FIELDS.has(field) && typeof subVal === 'string' && !isUuid(subVal)) {
            // impossible branch
            continue;
          }
          if (subVal && typeof subVal === 'object') {
            if (Array.isArray(subVal.$in)) {
              subVal.$in.forEach(v => {
                if (!UUID_FIELDS.has(field) || isUuid(v)) orParts.push(`${field}.eq.${v}`);
              });
            }
          } else if (subVal !== undefined) {
            orParts.push(`${field}.eq.${subVal}`);
          }
        }
      }
      if (orParts.length > 0) {
        query = query.or(orParts.join(','));
      } else {
        impossible = true;
      }
      continue;
    }

    const field = (key === '_id') ? 'id' : key;
    if (allowed && !allowed.has(field)) {
      // Column does not exist in this Supabase table - skip
      continue;
    }

    // Check UUID field validity
    if (UUID_FIELDS.has(field)) {
      if (typeof value === 'string' && !isUuid(value)) {
        impossible = true;
        continue;
      }
    }

    if (value && typeof value === 'object' && !(value instanceof RegExp)) {
      if (Array.isArray(value.$in)) {
        const validValues = UUID_FIELDS.has(field) ? value.$in.filter(isUuid) : value.$in;
        if (validValues.length === 0) {
          impossible = true;
        } else {
          query = query.in(field, validValues);
        }
        continue;
      }
      if (value.$ne !== undefined) {
        query = query.neq(field, value.$ne);
        continue;
      }
      if (value.$gt !== undefined) {
        query = query.gt(field, value.$gt);
        continue;
      }
      if (value.$gte !== undefined) {
        query = query.gte(field, value.$gte);
        continue;
      }
      if (value.$lt !== undefined) {
        query = query.lt(field, value.$lt);
        continue;
      }
      if (value.$lte !== undefined) {
        query = query.lte(field, value.$lte);
        continue;
      }
      if (value.$regex) {
        const pattern = value.$regex instanceof RegExp ? value.$regex.source : value.$regex;
        query = query.ilike(field, `%${pattern}%`);
        continue;
      }
    }

    if (value instanceof RegExp) {
      query = query.ilike(field, `%${value.source}%`);
      continue;
    }

    if (typeof value === 'string' && key === 'email') {
      query = query.ilike('email', value.trim());
      continue;
    }

    query = query.eq(field, value);
  }

  return { query, impossible };
}

function enrichRow(row) {
  if (!row) return null;
  const enriched = { ...row };
  if (row.id && !row._id) enriched._id = row.id;
  if (row.full_name && !row.name) enriched.name = row.full_name;
  return enriched;
}

/**
 * Supabase Postgres collection adapter for production
 */
class SupabaseCollection {
  constructor(name) {
    this.name = name;
  }

  async findOne(filter = {}) {
    try {
      let q = supabaseAdmin.from(this.name).select('*');
      const { query, impossible } = applyFilterToSupabaseQuery(q, filter, this.name);
      if (impossible) return null;

      const { data, error } = await query.limit(1);
      if (error || !data || data.length === 0) return null;
      const user = enrichRow(data[0]);

      if (this.name === 'users' && user?.id) {
        try {
          const { data: metaRows } = await supabaseAdmin
            .from('audit_logs')
            .select('reason')
            .eq('action', 'USER_METADATA')
            .eq('target_report_title', user.id)
            .order('timestamp', { ascending: false })
            .limit(1);

          if (metaRows && metaRows[0]?.reason) {
            try {
              const meta = JSON.parse(metaRows[0].reason);
              if ('avatar_url' in meta) {
                user.avatar_url = meta.avatar_url;
                user.avatar = meta.avatar_url;
              }
              if ('bio' in meta) user.bio = meta.bio;
              if ('department' in meta) user.department = meta.department;
            } catch (pErr) {}
          }
        } catch (mErr) {
          console.warn('[Supabase metadata fetch warning]:', mErr.message);
        }
      }

      return user;
    } catch (err) {
      console.error(`[Supabase findOne error on ${this.name}]:`, err.message);
      return null;
    }
  }

  find(filter = {}) {
    let sortField = null;
    let ascending = true;
    let skipCount = 0;
    let limitCount = null;

    const cursor = {
      sort: (sortObj = {}) => {
        const [sortKey, sortDir] = Object.entries(sortObj)[0] || [];
        if (sortKey) {
          sortField = sortKey === '_id' ? 'id' : sortKey;
          ascending = sortDir === 1;
        }
        return cursor;
      },
      skip: (n) => {
        skipCount = Math.max(0, parseInt(n, 10) || 0);
        return cursor;
      },
      limit: (n) => {
        limitCount = Math.max(0, parseInt(n, 10) || 0);
        return cursor;
      },
      toArray: async () => {
        try {
          let q = supabaseAdmin.from(this.name).select('*');
          const { query, impossible } = applyFilterToSupabaseQuery(q, filter, this.name);
          if (impossible) return [];

          let runQuery = query;
          if (sortField) {
            runQuery = runQuery.order(sortField, { ascending });
          }

          if (limitCount !== null) {
            const from = skipCount;
            const to = skipCount + limitCount - 1;
            runQuery = runQuery.range(from, to);
          } else if (skipCount > 0) {
            runQuery = runQuery.range(skipCount, skipCount + 1000);
          }

          const { data, error } = await runQuery;
          if (error) {
            console.error(`[Supabase toArray error on ${this.name}]:`, error.message);
            return [];
          }
          return (data || []).map(enrichRow);
        } catch (err) {
          console.error(`[Supabase find error on ${this.name}]:`, err.message);
          return [];
        }
      }
    };

    return cursor;
  }

  async insertOne(doc) {
    const item = sanitizePayload(this.name, doc);
    let { data, error } = await supabaseAdmin.from(this.name).insert(item).select().single();

    // Auto-heal if a column is missing from PostgreSQL table schema
    if (error && error.code === 'PGRST204') {
      const colMatch = error.message.match(/Could not find the '([^']+)' column/i);
      if (colMatch && colMatch[1]) {
        const missingCol = colMatch[1];
        console.warn(`[Supabase auto-heal]: Removing non-existent column "${missingCol}" from ${this.name} insert and retrying.`);
        delete item[missingCol];
        const retryResult = await supabaseAdmin.from(this.name).insert(item).select().single();
        data = retryResult.data;
        error = retryResult.error;
      }
    }

    if (error) {
      console.error(`[Supabase insertOne error on ${this.name}]:`, error.message);
      throw error;
    }
    return { acknowledged: true, insertedId: item.id };
  }

  async updateOne(filter = {}, update = {}, options = {}) {
    const updateFields = update.$set ? { ...update.$set } : { ...update };
    const sanitized = sanitizePayload(this.name, updateFields);
    delete sanitized.id; // Don't overwrite primary key

    if (this.name === 'users') {
      let targetUserId = filter.id || filter._id;
      if (!targetUserId && filter.$or && Array.isArray(filter.$or)) {
        for (const sub of filter.$or) {
          if (sub.id) targetUserId = sub.id;
          else if (sub._id) targetUserId = sub._id;
        }
      }

      // If still not found (e.g. filter by email), find user id
      if (!targetUserId && filter.email) {
        const u = await this.findOne({ email: filter.email });
        if (u) targetUserId = u.id;
      }

      if (targetUserId) {
        const metaFields = {};
        if ('avatar_url' in updateFields) metaFields.avatar_url = updateFields.avatar_url;
        if ('avatar' in updateFields && !metaFields.avatar_url) metaFields.avatar_url = updateFields.avatar;
        if ('bio' in updateFields) metaFields.bio = updateFields.bio;
        if ('department' in updateFields) metaFields.department = updateFields.department;

        if (Object.keys(metaFields).length > 0) {
          try {
            const { data: existingMeta } = await supabaseAdmin
              .from('audit_logs')
              .select('reason')
              .eq('action', 'USER_METADATA')
              .eq('target_report_title', targetUserId)
              .order('timestamp', { ascending: false })
              .limit(1);

            let merged = {};
            if (existingMeta && existingMeta[0]?.reason) {
              try { merged = JSON.parse(existingMeta[0].reason); } catch (e) {}
            }
            merged = { ...merged, ...metaFields };

            await supabaseAdmin
              .from('audit_logs')
              .delete()
              .eq('action', 'USER_METADATA')
              .eq('target_report_title', targetUserId);

            await supabaseAdmin
              .from('audit_logs')
              .insert({
                action: 'USER_METADATA',
                target_report_title: targetUserId,
                reason: JSON.stringify(merged),
                timestamp: new Date().toISOString()
              });
          } catch (mErr) {
            console.error('[Supabase metadata save error]:', mErr.message);
          }
        }
      }
    }

    let q = supabaseAdmin.from(this.name).update(sanitized);
    const { query, impossible } = applyFilterToSupabaseQuery(q, filter, this.name);
    if (impossible) return { acknowledged: true, modifiedCount: 0 };

    const { error } = await query;
    if (error) {
      console.error(`[Supabase updateOne error on ${this.name}]:`, error.message);
    }
    return { acknowledged: true };
  }

  async updateMany(filter = {}, update = {}) {
    const updateFields = update.$set ? { ...update.$set } : { ...update };
    const sanitized = sanitizePayload(this.name, updateFields);
    delete sanitized.id;

    let q = supabaseAdmin.from(this.name).update(sanitized);
    const { query, impossible } = applyFilterToSupabaseQuery(q, filter, this.name);
    if (impossible) return { acknowledged: true, modifiedCount: 0 };

    const { data, error } = await query;
    if (error) {
      console.error(`[Supabase updateMany error on ${this.name}]:`, error.message);
    }
    return { acknowledged: true, modifiedCount: data?.length || 1 };
  }

  async deleteOne(filter = {}) {
    let q = supabaseAdmin.from(this.name).delete();
    const { query, impossible } = applyFilterToSupabaseQuery(q, filter, this.name);
    if (impossible) return { acknowledged: true, deletedCount: 0 };

    const { error } = await query;
    if (error) {
      console.error(`[Supabase deleteOne error on ${this.name}]:`, error.message);
    }
    return { acknowledged: true, deletedCount: 1 };
  }

  async deleteMany(filter = {}) {
    let q = supabaseAdmin.from(this.name).delete();
    const { query, impossible } = applyFilterToSupabaseQuery(q, filter, this.name);
    if (impossible) return { acknowledged: true };

    const { error } = await query;
    if (error) {
      console.error(`[Supabase deleteMany error on ${this.name}]:`, error.message);
    }
    return { acknowledged: true };
  }

  async countDocuments(filter = {}) {
    try {
      let q = supabaseAdmin.from(this.name).select('*', { count: 'exact', head: true });
      const { query, impossible } = applyFilterToSupabaseQuery(q, filter, this.name);
      if (impossible) return 0;

      const { count, error } = await query;
      if (error) {
        console.error(`[Supabase countDocuments error on ${this.name}]:`, error.message);
        return 0;
      }
      return count || 0;
    } catch (err) {
      return 0;
    }
  }
}


class SupabaseVerificationCodesCollection {
  async updateOne(filter, update, options = {}) {
    try {
      const email = filter.email ? filter.email.trim().toLowerCase() : '';
      const doc = update.$set || update;
      const code = doc.code;
      const role = doc.role || 'Student';
      const phone = doc.phone || '';
      const purpose = doc.purpose || filter.purpose || 'auth';
      const expiresAt = doc.expiresAt ? new Date(doc.expiresAt).toISOString() : new Date(Date.now() + 300000).toISOString();

      const action = purpose === 'phone_update' ? 'PHONE_VERIFICATION_CODE' : 'VERIFICATION_CODE';

      // Clean up previous OTPs for this email and action
      await supabaseAdmin.from('audit_logs').delete().eq('action', action).eq('target_report_title', email);

      const recordPayload = {
        code,
        role,
        phone,
        purpose
      };

      // Store in audit_logs so all Vercel serverless instances can read and verify
      const { error } = await supabaseAdmin.from('audit_logs').insert({
        action,
        target_report_title: email,
        reason: JSON.stringify(recordPayload),
        admin_name: role,
        timestamp: expiresAt
      });
      if (error) {
        console.error('[Supabase verification_codes updateOne error]:', error.message);
      }
      return { acknowledged: true, modifiedCount: 1, upsertedCount: 1 };
    } catch (err) {
      console.error('[Supabase verification_codes updateOne error]:', err.message);
      return { acknowledged: false };
    }
  }

  async findOne(filter = {}) {
    try {
      const email = filter.email ? filter.email.trim().toLowerCase() : '';
      if (!email) return null;

      const purpose = filter.purpose || 'auth';
      const action = purpose === 'phone_update' ? 'PHONE_VERIFICATION_CODE' : 'VERIFICATION_CODE';

      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('action', action)
        .eq('target_report_title', email)
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) return null;

      const row = data[0];
      let parsedCode = row.reason;
      let parsedPhone = '';
      let parsedRole = row.admin_name || 'Student';
      let parsedPurpose = purpose;

      if (row.reason && row.reason.startsWith('{')) {
        try {
          const parsed = JSON.parse(row.reason);
          parsedCode = parsed.code || row.reason;
          parsedPhone = parsed.phone || '';
          parsedRole = parsed.role || row.admin_name || 'Student';
          parsedPurpose = parsed.purpose || purpose;
        } catch (e) {}
      }

      return {
        email: row.target_report_title,
        code: parsedCode,
        phone: parsedPhone,
        role: parsedRole,
        purpose: parsedPurpose,
        expiresAt: row.timestamp,
        createdAt: row.timestamp
      };
    } catch (err) {
      console.error('[Supabase verification_codes findOne error]:', err.message);
      return null;
    }
  }

  async deleteOne(filter = {}) {
    try {
      const email = filter.email ? filter.email.trim().toLowerCase() : '';
      const purpose = filter.purpose;
      if (email) {
        let q = supabaseAdmin.from('audit_logs').delete().eq('target_report_title', email);
        if (purpose === 'phone_update') {
          q = q.eq('action', 'PHONE_VERIFICATION_CODE');
        } else if (purpose) {
          q = q.eq('action', 'VERIFICATION_CODE');
        } else {
          q = q.in('action', ['VERIFICATION_CODE', 'PHONE_VERIFICATION_CODE']);
        }
        await q;
      }
      return { acknowledged: true, deletedCount: 1 };
    } catch (err) {
      return { acknowledged: false, deletedCount: 0 };
    }
  }

  async deleteMany(filter = {}) {
    return this.deleteOne(filter);
  }
}

class UnifiedDatabaseClient {
  db() {
    return {
      collection: (colName) => {
        if (colName === 'verification_codes') {
          return new SupabaseVerificationCodesCollection();
        }
        return new SupabaseCollection(colName);
      }
    };
  }
}

let clientInstance = null;
function getDatabaseClient() {
  if (!clientInstance) {
    clientInstance = new UnifiedDatabaseClient();
  }
  return clientInstance;
}

const clientPromise = Promise.resolve(getDatabaseClient());

export default clientPromise;
