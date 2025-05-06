import { desc, eq, and, aliasedTable } from 'drizzle-orm';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { voteTable, annotationTable } from '@/db/schema';
import { env } from '@/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  const headerList = await headers();
  const secret = headerList.get('X-Secret');
  if (secret !== env.SECRET) {
    notFound();
  }
  const correct = aliasedTable(annotationTable, 'correct');

  const votes = await db
    .select({
      annotation_id: annotationTable.id,
      image_id: annotationTable.imageId,
      label: annotationTable.label,
      quality: annotationTable.quality,
      description: correct.inquiry,
      inquiry: annotationTable.inquiry,
      latency: annotationTable.latency,
      matched: eq(voteTable.authorization, 'grant'),
    })
    .from(voteTable)
    .innerJoin(annotationTable, eq(voteTable.annotation, annotationTable.id))
    .leftJoin(correct, and(eq(correct.imageId, annotationTable.imageId), eq(correct.annotator, 'ai')))
    .orderBy(desc(voteTable.createdAt));

  return Response.json(votes);
}
