import { env } from 'cloudflare:workers';
import { admin, error, sameOrigin } from '@/lib/server';
export async function POST(r: Request) { if (!await admin())
    return Response.json({ error: 'Akses ditolak' }, { status: 403 }); try {
    sameOrigin(r);
    if (Number(r.headers.get('content-length') || 0) > 5500000)
        throw Error('Foto maksimal 5 MB.');
    const f = (await r.formData()).get('file');
    if (!(f instanceof File) || f.size > 5 * 1024 * 1024 || f.size === 0)
        throw Error('Pilih foto JPG, PNG, atau WebP maksimal 5 MB.');
    const bytes = new Uint8Array(await f.arrayBuffer());
    let type = '', ext = '';
    if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
        type = 'image/jpeg';
        ext = 'jpg';
    }
    else if ([137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)) {
        type = 'image/png';
        ext = 'png';
    }
    else if (new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP') {
        type = 'image/webp';
        ext = 'webp';
    }
    if (!ext || f.type !== type)
        throw Error('Format foto tidak valid. Gunakan JPG, PNG, atau WebP.');
    if (!env.BUCKET)
        throw Error('Penyimpanan foto belum tersedia.');
    const key = crypto.randomUUID() + '.' + ext;
    await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: type } });
    return Response.json({ url: '/api/images/' + key });
}
catch (e) {
    return error(e);
} }
