import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://dnthnigzjyjylepfdqru.supabase.co';
const supabaseKey = 'sb_publishable_2sGZFwzX0YsGsna8kcmr5g_FwdeDsID';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: { user }, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'test@test.com',
    password: 'testtest'
  });
  
  if (authErr || !user) {
    console.error("Auth error:", authErr);
    return;
  }

  // Insert group
  const { data: group, error: groupErr } = await supabase.from('groups').insert({
    name: "Test Group Counter",
    initials: "TGC",
    color: "blue",
    contribution_amount: 1000,
    frequency: "Mensuelle",
    max_members: 3,
    total_rounds: 3,
    penalty_rate: 5,
    guarantee_deposit: 0,
    order_type: "vrf",
    min_score: 0,
    status: "pending",
  }).select().single();

  if (groupErr) {
    console.error("Group Insert Error:", groupErr);
    return;
  }
  
  console.log("Group created with ID:", group.id);
  console.log("Group Members Count before insert:", group.members_count);

  // Insert group member 1
  const { error: memberErr } = await supabase.from('group_members').insert({
    group_id: group.id,
    profile_id: user.id,
    role: "admin",
    turn_order: 1,
    status: "waiting",
    guarantee_status: "verified"
  });

  if (memberErr) {
    console.error("Member Insert Error:", memberErr);
    return;
  }

  const { data: groupAfter } = await supabase.from('groups').select('members_count, status').eq('id', group.id).single();
  console.log("Group after member 1:", groupAfter);
}

test();
