import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dnthnigzjyjylepfdqru.supabase.co';
const supabaseKey = 'sb_publishable_2sGZFwzX0YsGsna8kcmr5g_FwdeDsID';
const supabase = createClient(supabaseUrl, supabaseKey);

async function create() {
  const { data, error } = await supabase.auth.signUp({
    email: 'kissbranel@gmail.com',
    password: 'PIN1234',
    options: {
      data: { name: 'ACC branel' }
    }
  });
  if (error) console.error("Error:", error.message);
  else console.log("Success:", data);
}
create();
