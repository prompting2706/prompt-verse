/**
 * Migration 002 — Supabase Management API approach
 * Uses the official Management API endpoint
 */

const PROJECT_REF = 'mhuhxwamaxdpmxludetp';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odWh4d2FtYXhkcG14bHVkZXRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc4MDY2MSwiZXhwIjoyMDk1MzU2NjYxfQ.jaQqpBIURL1XvqH2JaecBtynYc_gYNe3Eb46vouC2w4';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

const STATEMENTS = [
  `alter table public.profiles add column if not exists followers uuid[] not null default '{}'`,
  `alter table public.profiles add column if not exists favorites uuid[] not null default '{}'`,
  `alter table public.profiles add column if not exists has_completed_onboarding boolean not null default false`,
  `alter table public.prompts add column if not exists likes uuid[] not null default '{}'`,
  `alter table public.prompts add column if not exists comments jsonb not null default '[]'`,
  `alter table public.prompts add column if not exists versions jsonb not null default '[]'`,
  `alter table public.custom_orders drop constraint if exists custom_orders_status_check`,
  `alter table public.custom_orders add constraint custom_orders_status_check check (status in ('pending','accepted','in_progress','delivered','completed','declined','cancelled'))`,
  `alter table public.custom_orders add column if not exists seller_note text`,
  `alter table public.notifications add column if not exists actor_name text not null default ''`,
  `alter table public.notifications add column if not exists actor_avatar text not null default ''`,
  `alter table public.campaigns add column if not exists purpose text not null default 'social'`,
  `alter table public.campaigns add column if not exists prompt_stats jsonb not null default '[]'`,
  `alter table public.campaigns add column if not exists total_impressions integer not null default 0`,
  `alter table public.campaigns add column if not exists total_sales integer not null default 0`,
  `update public.campaigns set total_impressions = impressions where total_impressions = 0`,
  `alter table public.marketplace_items add column if not exists original_price numeric(10,2)`,
  `alter table public.marketplace_items add column if not exists sponsored_start_date timestamptz`,
  `alter table public.marketplace_items add column if not exists sponsored_end_date timestamptz`,
];

async function execSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'HEAD',
    headers: { 'apikey': SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
  });

  // Supabase supports raw SQL via the SQL endpoint in newer versions
  const sqlRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  });

  if (sqlRes.status === 404) {
    // Try alternative endpoint
    const alt = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    if (!alt.ok) {
      const body = await alt.text();
      throw new Error(`Management API ${alt.status}: ${body.slice(0, 100)}`);
    }
    return await alt.json();
  }

  if (!sqlRes.ok) {
    const body = await sqlRes.text();
    throw new Error(`${sqlRes.status}: ${body.slice(0, 100)}`);
  }
  return await sqlRes.json();
}

console.log(`\n🚀 PromptVerse — Migration 002\n${'─'.repeat(50)}`);
let passed = 0, failed = 0;

for (const sql of STATEMENTS) {
  const label = sql.replace(/\s+/g, ' ').slice(0, 65);
  try {
    await execSQL(sql);
    console.log(`✅ ${label}`);
    passed++;
  } catch (err) {
    const msg = String(err.message || err);
    if (msg.includes('already exists') || msg.includes('401') || msg.includes('403')) {
      if (msg.includes('already exists')) {
        console.log(`⚪ ${label} (zaten mevcut)`);
        passed++;
      } else {
        console.log(`🔑 ${label}`);
        console.log(`   → Management API Personal Access Token (PAT) gerekiyor`);
        failed++;
        break;
      }
    } else {
      console.log(`❌ ${label}`);
      console.log(`   ${msg.slice(0, 120)}`);
      failed++;
    }
  }
}

if (failed > 0) {
  console.log(`\n${'═'.repeat(50)}`);
  console.log('📋 MANUEL ÇALIŞTIRILMASI GEREKEN SQL:');
  console.log('   Supabase SQL Editor: https://app.supabase.com/project/mhuhxwamaxdpmxludetp/sql/new');
  console.log(`${'═'.repeat(50)}\n`);
  console.log(STATEMENTS.join(';\n') + ';');
} else {
  console.log(`\n🎉 Tamamlandı! Passed: ${passed}`);
}
