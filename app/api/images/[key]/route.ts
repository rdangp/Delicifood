import { env } from 'cloudflare:workers';
export async function GET(r: Request, { params }: any) { const { key } = await params; if (!/^[\w-]+\.(jpg|png|webp)$/.test(key))
    return new Response('Not found', { status: 404 }); try {
    const o = await env.BUCKET?.get(key);
    if (!o)
        return new Response('Not found', { status: 404 });
    return new Response(o.body, { headers: { 'Content-Type': o.httpMetadata?.contentType || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public,max-age=31536000,immutable' } });
}
catch {
    return new Response('Penyimpanan tidak tersedia', { status: 503 });
} }
