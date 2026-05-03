import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dnthnigzjyjylepfdqru.supabase.co';
const supabaseKey = 'sb_publishable_2sGZFwzX0YsGsna8kcmr5g_FwdeDsID';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing group creation...");
  const { data: { user }, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'test@test.com',
    password: 'testtest'
  });
  
  if (authErr || !user) {
    console.error("Auth error:", authErr);
    // Continue without auth, RLS might block but let's see
  }

  // Insert group
  const { data: group, error: groupErr } = await supabase.from('groups').insert({
    name: "Test Debug",
    initials: "TD",
    color: "green",
    contribution_amount: 1000,
    frequency: "Mensuelle",
    max_members: 2,
    total_rounds: 2,
    penalty_rate: 5,
    guarantee_deposit: 0,
    order_type: "vrf",
    min_score: 0,
    status: "pending",
  }).select().single();

  if (groupErr) {
    console.error("Group Insert Error:");
    console.error(JSON.stringify(groupErr, null, 2));
    return;
  }

  console.log("Group created:", group.id);

  // Insert group member (this triggers the counting function)
  const { error: memberErr } = await supabase.from('group_members').insert({
    group_id: group.id,
    profile_id: user?.id || 'd3513a0c-6f81-42cb-b286-90b501cc3a26', // Random UUID if unauth
    role: "admin",
    turn_order: 1,
    status: "waiting",
    guarantee_status: "verified"
  });

  if (memberErr) {
    console.error("Group Member Insert Error:");
    console.error(JSON.stringify(memberErr, null, 2));
    return;
  }

  console.log("Group member created successfully!");
}

test();
