
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

console.log(`Checking Supabase URL: ${supabaseUrl}`);
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
    try {
        // Attempt a simple query. Even if tables don't exist or RLS blocks, 
        // a network response (404, 401, 200) means creds are parsed and connection is made.
        // Invalid URL/Key usually throws a network error or "Invalid API Key" error.
        const { data, error, status } = await supabase.from('videos').select('count', { count: 'exact', head: true });

        if (error) {
            // If error is 401 Unauthorized, key might be wrong
            if (error.code === 'PGRST301' || status === 401) {
                console.error("Authentication Error: Invalid API Key or Permissions.");
            } else {
                console.log("Connection successful! (Even if query failed due to RLS/Table missing, the server responded)");
                console.log("Server Response:", error.message);
            }
        } else {
            console.log("Supabase Credentials Verified! Connection Successful.");
        }

    } catch (err) {
        console.error("Network/Client Error:", err);
    }
}

checkConnection();
