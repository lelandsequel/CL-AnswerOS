/**
 * Unit tests for demo payload
 * Ensures deterministic output and required fields
 */

import { getDemoAuditPayload, getDemoAuditPayloadWithOverrides } from '@/lib/demo/demoPayload';

describe('Demo Payload', () => {
  it('should return a valid demo audit payload', () => {
    const payload = getDemoAuditPayload();
    expect(payload).toBeDefined();
    expect(payload.url).toBe('https://rockspring.com');
    expect(payload.rawScan).toBeDefined();
    expect(payload.structuredAudit).toBeDefined();
    expect(payload.structuredFields).toBeDefined();
  });

  it('should have all required structured fields', () => {
    const payload = getDemoAuditPayload();
    const fields = payload.structuredFields;
    
    expect(fields?.company_name).toBe('Rockspring Capital');
    expect(fields?.website_url).toBe('https://rockspring.com');
    expect(fields?.industry).toBe('Real Estate Finance');
    expect(fields?.geography).toBe('US, California');
    expect(Array.isArray(fields?.services)).toBe(true);
    expect(fields?.services?.length).toBeGreaterThan(0);
    expect(fields?.target_customer).toBeDefined();
    expect(Array.isArray(fields?.core_issues)).toBe(true);
    expect(Array.isArray(fields?.quick_wins)).toBe(true);
    expect(Array.isArray(fields?.aeo_opportunities)).toBe(true);
  });

  it('should be deterministic (same output on multiple calls)', () => {
    const payload1 = getDemoAuditPayload();
    const payload2 = getDemoAuditPayload();
    
    expect(payload1.url).toBe(payload2.url);
    expect(payload1.structuredFields?.company_name).toBe(payload2.structuredFields?.company_name);
    expect(payload1.structuredFields?.industry).toBe(payload2.structuredFields?.industry);
    expect(JSON.stringify(payload1.structuredFields)).toBe(JSON.stringify(payload2.structuredFields));
  });

  it('should support overrides', () => {
    const payload = getDemoAuditPayloadWithOverrides({
      company_name: 'Custom Company',
      industry: 'Tech',
    });
    
    expect(payload.structuredFields?.company_name).toBe('Custom Company');
    expect(payload.structuredFields?.industry).toBe('Tech');
    // Other fields should remain unchanged
    expect(payload.structuredFields?.website_url).toBe('https://rockspring.com');
  });

  it('should have valid structured audit', () => {
    const payload = getDemoAuditPayload();
    const audit = payload.structuredAudit;
    
    expect(audit?.summary).toBeDefined();
    expect(audit?.overview).toBeDefined();
    expect(audit?.core_issues).toBeDefined();
    expect(audit?.quick_wins_48h).toBeDefined();
    expect(audit?.aeo_opportunities).toBeDefined();
    expect(audit?.content_playbook).toBeDefined();
  });

  it('should have non-empty raw scan', () => {
    const payload = getDemoAuditPayload();
    expect(payload.rawScan).toBeTruthy();
    expect(payload.rawScan.length).toBeGreaterThan(0);
    expect(payload.rawScan).toContain('Rockspring Capital');
  });
});

