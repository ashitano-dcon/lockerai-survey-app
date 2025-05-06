import { eq } from 'drizzle-orm';
import { db } from '../db';
import { annotationTable, voteTable } from '@/db/schema';

const pickOneRandomly = <T>(array: T[]) => {
  return array[Math.floor(Math.random() * array.length)];
};

export const getNextVoteAnnotationId = async () => {
  const [targetAnnotations, doneVotes] = await Promise.all([
    db
      .select({ id: annotationTable.id })
      .from(annotationTable)
      .where(eq(annotationTable.annotator, 'data-augmentation')),
    db.select({ annotation: voteTable.annotation }).from(voteTable),
  ]);

  if (targetAnnotations.length === 0) {
    return null;
  }

  const targetAnnotationIdSet = new Set(targetAnnotations.map((a) => a.id));
  const doneAnnotationIdSet = new Set(doneVotes.map((a) => a.annotation));

  const possibleAnnotationIdSet = targetAnnotationIdSet.difference(doneAnnotationIdSet);
  const possibleAnnotationIds = Array.from(possibleAnnotationIdSet);

  if (possibleAnnotationIds.length === 0) {
    return null;
  }

  const nextAnnotationId = pickOneRandomly(possibleAnnotationIds);
  return nextAnnotationId;
};
