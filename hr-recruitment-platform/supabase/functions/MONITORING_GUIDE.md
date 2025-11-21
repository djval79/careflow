# Edge Function Monitoring Guide

## Accessing Logs

### Supabase Dashboard
1. Go to [Dashboard](https://supabase.com/dashboard/project/niikshfoecitimepiifo)
2. Click **Logs** → **Edge Functions**
3. Select `performance-crud` from the dropdown

### Log Structure

With the new logging system, you'll see structured JSON logs:

```json
{
  "timestamp": "2025-11-20T23:10:15.123Z",
  "level": "INFO",
  "message": "Processing action",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "url": "https://niikshfoecitimepiifo.supabase.co/functions/v1/performance-crud",
  "action": "generate_sample_data",
  "data": { "durationMs": "1234.56  }
}
```

### Log Levels

| Level | Purpose | Example |
|-------|---------|---------|
| INFO | Normal operations | Request received, Action completed |
| WARN | Potential issues | Slow query, Deprecated feature used |
| ERROR | Failures | Database error, Invalid request |

## Common Log Patterns

### Successful Request
```
INFO: Request received
INFO: Processing action {"action":"get_reports"}
INFO: Starting: generate_sample_data
INFO: Completed: generate_sample_data {"durationMs":"1234.56"}
```

### Failed Request
```
INFO: Request received  
INFO: Processing action {"action":"generate_sample_data"}
ERROR: Failed: generate_sample_data {"durationMs":"234.56","error":"Table does not exist","stack":"..."}
ERROR: Request failed
```

## Performance Monitoring

### Key Metrics

**Response Times** (from logs):
- `get_reports`: < 500ms (typical)
- `generate_sample_data`: < 5000ms (typical)
- `list` (reviews/goals): < 300ms (typical)

**Alert Thresholds**:
- ⚠️ Warning: > 2x typical duration
- ❌ Critical: > 5x typical duration

### Viewing Performance Trends
1. Dashboard → Logs → Edge Functions
2. Use time range selector (last 1 hour, 24 hours, etc.)
3. Filter by `level:ERROR` to see failures quickly

## Common Errors & Solutions

### "Table does not exist"
**Log Pattern**: `ERROR: relation "reviews" does not exist`  
**Cause**: Migration not run  
**Solution**: Execute `migrations/schema.sql`

### "Permission denied for table"
**Log Pattern**: `ERROR: permission denied for relation reviews`  
**Cause**: RLS policy blocking access  
**Solution**: Check RLS policies in `migrations/rls_policies.sql`

### "Function invocation failed"
**Log Pattern**: Empty logs, 400/500 status in browser  
**Cause**: Function crash before logging initialized
**Solution**: Check function deployment, redeploy if needed

### Timeout Errors
**Log Pattern**: No "Completed" log after "Starting"  
**Cause**: Operation took > 60s (Supabase limit)  
**Solution**: Optimize query or batch operations

## Setting Up Alerts (Optional)

### Using Supabase CLI
```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Configure webhooks for error alerts
supabase functions deploy performance-crud \
  --project-ref niikshfoecitimepiifo \
  --verify-jwt false
```

### Third-party Monitoring
Consider integrating:
- **Sentry** - Error tracking
- **DataDog** - Full observability
- **Better Stack** - Log aggregation

## Best Practices

1. **Correlation IDs**: Each request has a unique ID to track across logs
2. **Timing Operations**: All major operations logged with duration
3. **Structured Data**: Logs are JSON for easy parsing
4. **Error Context**: Errors include stack traces and relevant data

## Example: Debugging a Failed Request

### 1. Find the Error
```
Dashboard → Logs → Filter by level:ERROR
```

### 2. Get Correlation ID
```json
{
  "correlationId": "abc-123-def",
  "error": "reviews.filter is not a function"
}
```

### 3. Find Related Logs
```
Search: "abc-123-def"
```

### 4. Trace the Flow
```
INFO: Request received (correlationId: abc-123-def)
INFO: Processing action {"action":"list"}
ERROR: Request failed (correlationId: abc-123-def)
```

### 5. Identify Root Cause
The error shows `reviews.filter is not a function`, meaning the API returned an object instead of an array.

## Monitoring Checklist

- [ ] Check logs daily for errors
- [ ] Monitor response times weekly
- [ ] Review correlation IDs for slow requests
- [ ] Set up alerts for critical errors (optional)
- [ ] Archive logs monthly (Supabase retains 7 days)

## Production Hardening

For production deployments:
1. **Enable log retention** (Supabase Pro plan)
2. **Set up error alerts** via webhooks
3. **Create dashboards** for key metrics
4. **Document incident response** procedures
5. **Schedule log reviews** with team
