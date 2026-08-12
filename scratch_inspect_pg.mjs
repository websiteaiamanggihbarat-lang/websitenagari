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

async function runInspection() {
  console.log("=== 1. SEARCHING ALL FUNCTIONS IN DATABASE WITH 'cover' OR 'foto' OR 'kelompok' ===")
  
  // Try querying rpc or tables
  const { data: testInsert, error: errInsert } = await supabase
    .from('kelompok_tani_bumnag')
    .insert([
      {
        nama_entitas: "TEST_INSPECT_" + Date.now(),
        jenis_entitas: "kelompok_tani",
        bidang_utama: "Pertanian",
        deskripsi: "Test inspect",
        is_active: true,
        urutan: 0
      }
    ])
    .select()

  console.log("Test Insert Result Data:", testInsert)
  console.log("Test Insert Result Error:", JSON.stringify(errInsert, null, 2))
}

runInspection()
