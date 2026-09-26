import Storefront from '@/app/storefront';
import { catalog } from '@/lib/server';
export async function generateMetadata({ params }: any) { const { slug } = await params; try {
    const { products } = await catalog();
    const p = products.find((p: any) => p.slug === slug);
    return { title: p ? `${p.name} | Delicifood` : 'Produk | Delicifood', description: p?.description };
}
catch {
    return { title: 'Produk | Delicifood' };
} }
export default async function Page({ params }: any) { const { slug } = await params; return <Storefront slug={slug}/>; }
