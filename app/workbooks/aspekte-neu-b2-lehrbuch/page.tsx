import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { requireLehrbuchAccess } from '@/lib/lehrbuch-server';
import { WorkbookAccessError } from '@/lib/workbook-access';
import LehrbuchBook from '@/components/workbook/LehrbuchBook';
export const metadata: Metadata = { title: 'Aspekte neu B2 · Lehrbuch', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function LehrbuchPage() {
  const h = await headers(); let access;
  try { access = await requireLehrbuchAccess(new Request(`${h.get('x-forwarded-proto') || 'http'}://${h.get('host') || 'localhost'}/workbooks/aspekte-neu-b2-lehrbuch`, { headers: h })); }
  catch (e) {
    if (e instanceof WorkbookAccessError && e.status === 401) redirect('/login?next=%2Fworkbooks%2Faspekte-neu-b2-lehrbuch');
    if (e instanceof WorkbookAccessError && e.status === 404) notFound();
    return <main className="p-10"><h1>Private B2 Lehrbuch</h1><p>{e instanceof WorkbookAccessError ? e.message : 'Unable to check textbook access.'}</p><Link href="/dashboard/admin/workbooks">Back to private workbooks</Link></main>;
  }
  return <LehrbuchBook key={access.id} owner={access.id} />;
}
