import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const wallet = url.searchParams.get("wallet");

  if (!wallet) return NextResponse.json({ error: "No wallet" }, { status: 400 });

  const { data, error } = await supabase
    .from("portfolio_snapshots")
    .select("timestamp, total_value_usdc")
    .eq("wallet_address", wallet.toLowerCase())
    .order("timestamp", { ascending: true })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ snapshots: data });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { wallet_address, total_value_usdc } = body;

  if (!wallet_address || total_value_usdc == null) {
     return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  // We rely on RLS or Supabase to manage trust, but for an MVP indexer we just insert it
  const { data, error } = await supabase
    .from("portfolio_snapshots")
    .insert([{
       wallet_address: wallet_address.toLowerCase(),
       total_value_usdc,
       timestamp: new Date().toISOString()
    }]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}
