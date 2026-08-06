import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wrysbvdqslhjvcvxwokj.supabase.co";
const supabaseKey = "sb_publishable_a788V9Ui6dWFpTL5GnOpew_-4ECFAdk";

export const supabase = createClient(supabaseUrl, supabaseKey);
