import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envText = fs.readFileSync('.env.local', 'utf-8')
const env = {}
envText.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '')
  }
})

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(url, key)

async function inspect() {
  console.log("--- TESTING INSERT KELOMPOK_TANI_BUMNAG WITHOUT COVER ---")
  const testPayload = {
    nama_entitas: "Test Kelompok Tani Tanpa Cover " + Date.now(),
    jenis_entitas: "kelompok_tani",
    bidang_utama: "Pertanian Organik",
    deskripsi: "Deskripsi singkat test tanpa cover.",
    is_active: true,
    urutan: 1,
  }

  const { data, error } = await supabase
    .from('kelompok_tani_bumnag')
    .insert([testPayload])
    .select()

  console.log("Insert result data:", data)
  console.log("Insert result error:", JSON.stringify(error, null, 2))
}

inspect()
