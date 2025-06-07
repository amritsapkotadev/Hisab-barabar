// @ts-ignore: Deno global is available in Deno runtime
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

// Add this reference for Deno types if using VSCode or tsc
/// <reference types="deno.ns" />

// @ts-expect-error: Deno global is available in Deno runtime
declare const Deno: typeof globalThis.Deno;

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    const { id, email, name } = await req.json();

    const { data, error } = await supabase.from("users").upsert({
      id,
      email,
      name,
      created_at: new Date().toISOString(),
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ message: "User synced!", data }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
