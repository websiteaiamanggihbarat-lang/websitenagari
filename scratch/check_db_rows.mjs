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

async function test() {
  const { data: rows, error } = await supabase.from('lembaga_organisasi').select('*')
  console.log("Error:", error)
  console.log("Rows count:", rows?.length || 0)
  console.log("Rows data:", JSON.stringify(rows, null, 2))
}

test()
