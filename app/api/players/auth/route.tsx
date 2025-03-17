import nacl from 'tweetnacl';
import { PublicKey } from '@solana/web3.js';
import { createClient } from '@supabase/supabase-js';
import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server";

export async function POST(request:any) {
  const { publicKey, signature, nonce } = await request.json()
  console.log(publicKey, signature, nonce)
  try {
    // Convert publicKey and signature to Uint8Array
    const publicKeyBytes = new PublicKey(publicKey).toBytes();
    const signatureBytes = Uint8Array.from(signature);
    
    // Convert the nonce (message) to Uint8Array
    const message = new TextEncoder().encode(nonce);
    
    // Verify the signature using tweetnacl
    const isValid = nacl.sign.detached.verify(message, signatureBytes, publicKeyBytes);

    if (isValid) {
      // Authentication successful
      // Create or retrieve the user in Supabase
      const { data: user, error } = await supabase
        .from('players')
        .upsert(
          { player: publicKey }, // Use wallet address as the unique identifier
          { onConflict: 'player' } // Update if the user already exists
        )
        .single();
      
      if (error) {
        console.log(error)
        return NextResponse.json({success:false, message: error.message }, { status: 400 });
      }

      // First create the user if they don't exist
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: `${publicKey}@gamerholic.xyz`, // Use a dummy email (wallet address + domain)
        password: publicKey, // Use the wallet address as the password
      });

      if (signUpError && signUpError.message !== 'User already registered') {
        console.log(signUpError)
        return NextResponse.json({success:false, message: signUpError.message });
      }

      // Then sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: `${publicKey}@gamerholic.xyz`, // Use a dummy email (wallet address + domain)
        password: publicKey, // Use the wallet address as the password
      }); 
      
      if (authError) {
        console.log(authError)
        return NextResponse.json({success:false, message: authError.message });
      }
      
      // Return the JWT to the frontend
      return NextResponse.json({ success:true, token: authData.session.access_token, refresh_token:null });
    } else {
      console.log("invalid signature")
      return NextResponse.json({ succcess:false,  message: "Invalid signature" });
    }
  } catch (error:any) {
    return NextResponse.json({ success:false, message: error.message });
  }
}