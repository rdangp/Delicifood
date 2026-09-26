import Storefront from '@/app/storefront';
import { notFound } from 'next/navigation';
const pages = ['tentang', 'kontak', 'faq', 'pengiriman', 'retur', 'privasi', 'ketentuan'];
export async function generateMetadata({ params }: any) { const { info } = await params; return { title: info.charAt(0).toUpperCase() + info.slice(1) + ' | Delicifood' }; }
export default async function Page({ params }: any) { const { info } = await params; if (!pages.includes(info))
    notFound(); return <Storefront info={info}/>; }
