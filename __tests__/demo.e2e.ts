/**
 * E2E tests for one-click demo flow
 * Uses Playwright to test the full demo flow
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('One-Click Demo Flow', () => {
  test('should create demo asset and redirect to pSEO', async ({ page }) => {
    // Navigate to home
    await page.goto(BASE_URL);
    
    // Click "Run Demo" button
    const runDemoButton = page.locator('button:has-text("Run Demo")').first();
    await expect(runDemoButton).toBeVisible();
    await runDemoButton.click();
    
    // Wait for redirect to pSEO page
    await page.waitForURL(/\/pseo\?asset=.*&demo=1/);
    
    // Verify we're on pSEO page
    expect(page.url()).toContain('/pseo');
    expect(page.url()).toContain('demo=1');
    
    // Verify form is populated
    const companyNameInput = page.locator('input[name="company_name"]');
    await expect(companyNameInput).toHaveValue('Rockspring Capital');
    
    const websiteInput = page.locator('input[name="website_url"]');
    await expect(websiteInput).toHaveValue('https://rockspring.com');
    
    // Verify demo stepper is visible
    const stepper = page.locator('text=pSEO');
    await expect(stepper).toBeVisible();
  });

  test('should navigate from pSEO to Deck Outline', async ({ page }) => {
    // First, run demo to get to pSEO
    await page.goto(BASE_URL);
    const runDemoButton = page.locator('button:has-text("Run Demo")').first();
    await runDemoButton.click();
    await page.waitForURL(/\/pseo\?asset=.*&demo=1/);
    
    // Extract assetId from URL
    const url = page.url();
    const assetMatch = url.match(/asset=([^&]+)/);
    const assetId = assetMatch?.[1];
    expect(assetId).toBeTruthy();
    
    // Click "Next: Deck" button
    const nextButton = page.locator('button:has-text("Next: Deck")');
    await expect(nextButton).toBeVisible();
    await nextButton.click();
    
    // Wait for redirect to deck-outline page
    await page.waitForURL(/\/deck-outline\?asset=.*&demo=1/);
    
    // Verify we're on deck-outline page
    expect(page.url()).toContain('/deck-outline');
    expect(page.url()).toContain(`asset=${assetId}`);
    expect(page.url()).toContain('demo=1');
    
    // Verify form is populated
    const companyNameInput = page.locator('input[name="company_name"]');
    await expect(companyNameInput).toHaveValue('Rockspring Capital');
  });

  test('should show demo stepper on both pages', async ({ page }) => {
    await page.goto(BASE_URL);
    const runDemoButton = page.locator('button:has-text("Run Demo")').first();
    await runDemoButton.click();
    await page.waitForURL(/\/pseo\?asset=.*&demo=1/);
    
    // Check stepper on pSEO
    const pseoStepper = page.locator('text=Audit').first();
    await expect(pseoStepper).toBeVisible();
    
    // Navigate to deck
    const nextButton = page.locator('button:has-text("Next: Deck")');
    await nextButton.click();
    await page.waitForURL(/\/deck-outline\?asset=.*&demo=1/);
    
    // Check stepper on deck
    const deckStepper = page.locator('text=Deck');
    await expect(deckStepper).toBeVisible();
  });

  test('should be idempotent (multiple clicks reuse same asset)', async ({ page }) => {
    await page.goto(BASE_URL);

    // Click Run Demo first time
    const runDemoButton = page.locator('button:has-text("Run Demo")').first();
    await runDemoButton.click();
    await page.waitForURL(/\/pseo\?asset=.*&demo=1/);

    const firstUrl = page.url();
    const firstAssetMatch = firstUrl.match(/asset=([^&]+)/);
    const firstAssetId = firstAssetMatch?.[1];

    // Go back and click again
    await page.goto(BASE_URL);
    await runDemoButton.click();
    await page.waitForURL(/\/pseo\?asset=.*&demo=1/);

    const secondUrl = page.url();
    const secondAssetMatch = secondUrl.match(/asset=([^&]+)/);
    const secondAssetId = secondAssetMatch?.[1];

    // Both should use the SAME assetId (idempotent)
    expect(firstAssetId).toBe(secondAssetId);
    expect(firstUrl).toContain('/pseo');
    expect(secondUrl).toContain('/pseo');
  });

  test('should return reused flag on second call', async ({ page, context }) => {
    // Make first API call
    const res1 = await context.request.post(`${BASE_URL}/api/demo/create-audit-asset`);
    const data1 = await res1.json();

    expect(data1.success).toBe(true);
    expect(data1.assetId).toBeTruthy();
    expect(data1.reused).toBe(false); // First call creates new asset

    // Make second API call
    const res2 = await context.request.post(`${BASE_URL}/api/demo/create-audit-asset`);
    const data2 = await res2.json();

    expect(data2.success).toBe(true);
    expect(data2.assetId).toBe(data1.assetId); // Same assetId
    expect(data2.reused).toBe(true); // Second call reuses existing asset
  });
});

