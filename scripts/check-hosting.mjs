import fs from 'node:fs';
const config=JSON.parse(fs.readFileSync('wrangler.json','utf8'));
const problems=[];
if(!fs.existsSync('dist/server/index.js')||!fs.existsSync('dist/client'))problems.push('Build tidak ditemukan; jalankan pnpm build.');
if(!/^[a-f0-9-]{36}$/.test(config.d1_databases?.[0]?.database_id||''))problems.push('Isi database_id D1 pada wrangler.json.');
if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(config.vars?.CF_ACCESS_TEAM_DOMAIN||''))problems.push('Isi CF_ACCESS_TEAM_DOMAIN.');
if(!config.vars?.CF_ACCESS_AUD||config.vars.CF_ACCESS_AUD.includes('GANTI_'))problems.push('Isi CF_ACCESS_AUD.');
if(problems.length){console.error(problems.join('\n'));process.exit(1)}
console.log('Konfigurasi file valid. Pastikan ADMIN_EMAIL sudah diatur dengan wrangler secret put.');
