import { requireChatGPTUser } from '@/app/chatgpt-auth';
import { admin } from '@/lib/server';
import Admin from './panel';
export const dynamic = 'force-dynamic';
export default async function Page() { await requireChatGPTUser('/admin'); if (!await admin())
    return <main className="info-page"><h1>Akses terbatas</h1><p>Akun ini tidak memiliki izin pemilik toko.</p><a href="/" className="btn">Kembali ke toko</a></main>; return <Admin />; }
