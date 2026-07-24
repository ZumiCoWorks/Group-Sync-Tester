#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  const email = process.argv[2] || 'boss@afda.co.za';
  const password = process.argv[3] || 'Password123!';
  const firstName = process.argv[4] || 'Admin';
  const lastName = process.argv[5] || 'User';

  console.log(`Creating staff account for ${email}...`);

  // 1. Create the user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('already exists')) {
      console.log(`User ${email} already exists in Auth. Looking up ID...`);
      // Fallback if they already made it manually
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existing = listData.users.find(u => u.email === email);
      if (existing) {
        await ensureStaffProfile(existing.id, email, firstName, lastName);
      }
    } else {
      console.error('Error creating user in Auth:', authError.message);
    }
  } else if (authData.user) {
    await ensureStaffProfile(authData.user.id, email, firstName, lastName);
    console.log(`\n✅ Success! You can now log in at the Staff Dashboard.`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  }
}

async function ensureStaffProfile(userId, email, firstName, lastName) {
  // 2. Ensure the user exists in the public.users table as a staff member
  const { error: userError } = await supabase.from('users').upsert({
    id: userId,
    email,
    first_name: firstName,
    last_name: lastName,
    role: 'staff',
  }, { onConflict: 'id' });

  if (userError) {
    console.error('Error creating user record in public.users:', userError);
  } else {
    console.log('Successfully set up staff permissions in public.users table.');
  }

  // 3. Ensure they are in profiles (fallback alias)
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    email,
    role: 'staff',
  }, { onConflict: 'id' });

  if (profileError) {
    console.error('Error creating profile record:', profileError);
  }
}

run();
