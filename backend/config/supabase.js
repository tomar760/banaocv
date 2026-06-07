/* ============================================================
   BanaoCV — backend/config/supabase.js
   ============================================================ */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for admin operations
);

module.exports = { supabase };
