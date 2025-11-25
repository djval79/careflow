# Audit Trail and Accountability System - Implementation Plan

## Goal Description
Implement a comprehensive audit logging system to track all important actions in the recruitment platform, providing full accountability and traceability for compliance, security, and operational transparency.

## User Review Required

> [!IMPORTANT]
> **Data Retention Policy Needed**
> - How long should audit logs be retained? (e.g., 1 year, 3 years, indefinitely)
> - Should old logs be archived or deleted?
> - Are there any compliance requirements (GDPR, SOC2, etc.)?

> [!IMPORTANT]
> **Privacy Considerations**
> - Should we log IP addresses?
> - Should we log user agent strings?
> - What PII should be excluded from change snapshots?

## Proposed Changes

### Database

#### [NEW] [migrations/create_audit_system.sql](file:///Users/valentinechideme/Downloads/novumflow (uncle mike )/hr-recruitment-platform/migrations/create_audit_system.sql)

**Audit Logs Table:**
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'VIEW'
    entity_type TEXT NOT NULL, -- 'tenant', 'form', 'application', 'user', etc.
    entity_id UUID,
    entity_name TEXT,
    changes JSONB, -- Before/after snapshot
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Features:**
- User attribution (who did it)
- Timestamp (when it happened)
- Action type (what they did)
- Entity tracking (what was affected)
- Change snapshots (before/after values)
- IP and user agent for security
- Tenant isolation

**Indexes:**
- `idx_audit_logs_tenant_id` - Fast tenant filtering
- `idx_audit_logs_user_id` - User activity tracking
- `idx_audit_logs_entity` - Entity history lookup
- `idx_audit_logs_created_at` - Time-based queries

**Triggers:**
- Auto-log tenant changes
- Auto-log form changes
- Auto-log application changes
- Auto-log user changes

---

### Backend

#### [NEW] `src/lib/services/AuditService.ts`

**Core Functions:**
```typescript
interface AuditLog {
    id: string;
    tenant_id: string;
    user_id: string;
    user_email: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
    entity_type: string;
    entity_id: string;
    entity_name: string;
    changes: {
        before?: any;
        after?: any;
        fields_changed?: string[];
    };
    ip_address?: string;
    user_agent?: string;
    created_at: string;
}

// Log an action
auditService.log({
    action: 'UPDATE',
    entity_type: 'form',
    entity_id: 'abc-123',
    entity_name: 'Employee Evaluation Form',
    changes: {
        before: { title: 'Old Title' },
        after: { title: 'New Title' },
        fields_changed: ['title']
    }
});

// Get audit trail for an entity
auditService.getEntityHistory('form', 'abc-123');

// Get user activity
auditService.getUserActivity(userId, { limit: 50 });

// Search audit logs
auditService.search({
    entity_type: 'form',
    action: 'DELETE',
    date_from: '2024-01-01',
    date_to: '2024-12-31'
});
```

---

### Frontend

#### [NEW] `src/pages/AuditLogPage.tsx`

**Features:**
- Audit log table with pagination
- Filters:
  - Date range picker
  - User filter
  - Action type (CREATE/UPDATE/DELETE)
  - Entity type (forms, applications, etc.)
- Search by entity name
- Export to CSV
- View change details modal

**UI Components:**
- Timeline view of changes
- Before/after comparison
- User attribution badges
- Color-coded action types:
  - 🟢 CREATE (green)
  - 🟡 UPDATE (yellow)
  - 🔴 DELETE (red)
  - 🔵 VIEW (blue)

#### [NEW] `src/components/AuditTrail.tsx`

**Reusable Component:**
Display audit trail for any entity (form, application, tenant, etc.)

```tsx
<AuditTrail 
    entityType="form" 
    entityId="abc-123" 
    showUser={true}
    limit={10}
/>
```

Shows:
- Who made changes
- When changes were made
- What was changed
- Before/after values

---

### Integration Points

#### 1. Form Builder (`src/pages/FormsPage.tsx`)
```typescript
// When creating a form
await auditService.log({
    action: 'CREATE',
    entity_type: 'form',
    entity_id: newForm.id,
    entity_name: newForm.title,
    changes: { after: newForm }
});

// When editing a form
await auditService.log({
    action: 'UPDATE',
    entity_type: 'form',
    entity_id: form.id,
    entity_name: form.title,
    changes: {
        before: originalForm,
        after: updatedForm,
        fields_changed: ['title', 'description']
    }
});

// When deleting a form
await auditService.log({
    action: 'DELETE',
    entity_type: 'form',
    entity_id: form.id,
    entity_name: form.title,
    changes: { before: form }
});
```

#### 2. Tenant Management (`src/pages/TenantManagementPage.tsx`)
- Log tenant creation
- Log subscription changes
- Log feature toggles
- Log onboarding completion

#### 3. Applications (`src/pages/RecruitmentPage.tsx`)
- Log application status changes
- Log assignment changes
- Log document uploads
- Log notes added

#### 4. User Management
- Log user creation
- Log role changes
- Log permission updates
- Log password resets

---

### Database Triggers (Automatic Logging)

```sql
-- Auto-log tenant changes
CREATE TRIGGER audit_tenant_changes
    AFTER INSERT OR UPDATE OR DELETE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_trail();

-- Auto-log form changes
CREATE TRIGGER audit_form_changes
    AFTER INSERT OR UPDATE OR DELETE ON forms
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_trail();
```

**Benefits:**
- Can't be bypassed
- Captures all changes (even direct DB edits)
- No code changes needed for basic logging

---

## Verification Plan

### Manual Testing

1. **Create Form Test**
   - Create a new form
   - Check audit_logs table
   - Verify user_id, action='CREATE', entity captured

2. **Edit Form Test**
   - Edit form title
   - Check audit log shows before/after
   - Verify fields_changed array

3. **Delete Form Test**
   - Delete a form
   - Verify audit log shows action='DELETE'
   - Verify before snapshot captured

4. **Audit Log Viewer**
   - Navigate to Audit Logs page
   - Filter by date range
   - Filter by user
   - Filter by action type
   - Export to CSV

5. **Entity History**
   - View a form
   - Click "View History"
   - See timeline of all changes
   - See who made each change

### Database Verification

```sql
-- Check audit logs exist
SELECT COUNT(*) FROM audit_logs;

-- Check recent activity
SELECT 
    user_email,
    action,
    entity_type,
    entity_name,
    created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 20;

-- Check specific entity history
SELECT * FROM audit_logs
WHERE entity_type = 'form'
AND entity_id = 'abc-123'
ORDER BY created_at DESC;
```

---

## Security Considerations

### RLS Policies
```sql
-- Users can only see audit logs for their tenant
CREATE POLICY "Users see own tenant audit logs" ON audit_logs
    FOR SELECT USING (tenant_id = current_tenant_id());

-- Super admins see all audit logs
CREATE POLICY "Super admins see all audit logs" ON audit_logs
    FOR SELECT USING (is_super_admin());

-- Only system can insert audit logs
CREATE POLICY "System only inserts" ON audit_logs
    FOR INSERT WITH CHECK (false);
```

### Data Protection
- Exclude sensitive fields from snapshots (passwords, tokens)
- Hash or mask PII in logs
- Encrypt audit logs at rest
- Regular backup of audit logs

---

## Benefits

### Compliance
✅ GDPR Article 30 - Records of processing activities  
✅ SOC 2 - Audit logging requirements  
✅ HIPAA - Access and modification tracking  
✅ ISO 27001 - Information security logging  

### Security
✅ Detect unauthorized access  
✅ Track suspicious activity  
✅ Forensic investigation capability  
✅ Accountability enforcement  

### Operations
✅ Troubleshoot issues ("Who changed this?")  
✅ Undo accidental changes  
✅ Track user productivity  
✅ Generate compliance reports  

---

## Future Enhancements

1. **Real-time Alerts**
   - Email on critical changes
   - Slack notifications
   - Webhook integrations

2. **Advanced Analytics**
   - User activity dashboards
   - Change frequency metrics
   - Risk scoring

3. **Automated Compliance Reports**
   - Monthly activity summaries
   - Access reports
   - Change reports

4. **Rollback Functionality**
   - Restore previous versions
   - Undo changes
   - Compare versions

---

## Implementation Timeline

- **Phase 1** (Day 1-2): Database schema and triggers
- **Phase 2** (Day 3-4): AuditService and basic logging
- **Phase 3** (Day 5-6): Integration with forms and tenants
- **Phase 4** (Day 7-8): Audit log viewer UI
- **Phase 5** (Day 9-10): Testing and refinement

**Total Estimated Time:** 10 days
