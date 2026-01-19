#!/bin/bash

# Test pSEO Audit with real DataForSEO data

echo "🚀 Testing pSEO Audit API..."
echo ""

curl -X POST http://localhost:3000/api/pseo-audit \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Rockspring Capital",
    "website_url": "https://rockspringcapital.com",
    "industry": "Commercial Real Estate Finance",
    "geography": "Houston, TX",
    "services": ["Bridge Loans", "Construction Financing"],
    "target_customer": "Real estate developers",
    "locations": ["Houston", "Dallas", "Austin"],
    "loan_programs": ["Bridge Loans", "Construction Loans", "Preferred Equity"],
    "asset_classes": ["Commercial Real Estate", "Multifamily", "Industrial"],
    "use_cases": ["Fix and Flip", "Ground-Up Development", "Refinance"]
  }' | jq .

echo ""
echo "✅ Test complete!"

