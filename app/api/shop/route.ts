import { catalog, error } from '@/lib/server';
export async function GET() { try {
    return Response.json(await catalog(), { headers: { 'Cache-Control': 'no-store' } });
}
catch (e) {
    return error(e, 503);
} }
