const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tftuxnrpddfjlwiadljk.supabase.co';
const supabaseAnonKey = 'sb_publishable_gc9FsxkfQdEbCS1l_qZqQg_md20JUw0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, system_role');

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  console.log('Profiles currently in DB:');
  console.log(JSON.stringify(data, null, 2));
}

run();
