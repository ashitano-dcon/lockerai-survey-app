import { eq, and, gte, not } from 'drizzle-orm';
import { desc } from 'drizzle-orm';
import { db } from '../db';
import { annotationTable, voteTable, redeemTable } from '@/db/schema';
import type { Email } from '@/states/atoms/email';

export const getSurveyProgress = async () => {
  const annotationCount = await db.$count(
    annotationTable,
    and(eq(annotationTable.quick, false), not(eq(annotationTable.annotator, 'ai'))),
  );
  const quickAnnotationCount = await db.$count(
    annotationTable,
    and(eq(annotationTable.quick, true), not(eq(annotationTable.annotator, 'ai'))),
  );
  const voteCount = await db.$count(voteTable);
  return {
    annotationCountGoal: 1406 as const,
    annotationCount,
    quickAnnotationCountGoal: 703 as const,
    quickAnnotationCount,
    voteCount,
  };
};

export const getAnnotationSurveyProgressByEmail = async (email: Email) => {
  const lastRedeem = (
    await db
      .select()
      .from(redeemTable)
      .where(and(eq(redeemTable.email, email), eq(redeemTable.type, 'annotation')))
      .orderBy(desc(redeemTable.requestedAt))
  )[0];
  const since = lastRedeem?.requestedAt ?? new Date(0);
  const annotationCountSinceLastRedeem = await db.$count(
    annotationTable,
    and(eq(annotationTable.quick, false), eq(annotationTable.email, email), gte(annotationTable.createdAt, since)),
  );
  const quickAnnotationCountSinceLastRedeem = await db.$count(
    annotationTable,
    and(eq(annotationTable.quick, true), eq(annotationTable.email, email), gte(annotationTable.createdAt, since)),
  );
  const annotationCount = await db.$count(
    annotationTable,
    and(eq(annotationTable.quick, false), eq(annotationTable.email, email)),
  );
  const quickAnnotationCount = await db.$count(
    annotationTable,
    and(eq(annotationTable.quick, true), eq(annotationTable.email, email)),
  );
  const annotationRedeemGoal = 7 as const;
  const quickAnnotationRedeemGoal = 4 as const;
  const isRedeemable =
    annotationCountSinceLastRedeem >= annotationRedeemGoal &&
    quickAnnotationCountSinceLastRedeem >= quickAnnotationRedeemGoal;
  return {
    annotation: {
      total: annotationCount,
      sinceLastRedeem: annotationCountSinceLastRedeem,
      redeemGoal: annotationRedeemGoal,
    },
    quickAnnotation: {
      total: quickAnnotationCount,
      sinceLastRedeem: quickAnnotationCountSinceLastRedeem,
      redeemGoal: quickAnnotationRedeemGoal,
    },
    isRedeemable,
    lastRedeem,
  };
};

export const getVoteSurveyProgressByEmail = async (email: Email) => {
  const lastRedeem = (
    await db
      .select()
      .from(redeemTable)
      .where(and(eq(redeemTable.email, email), eq(redeemTable.type, 'vote')))
      .orderBy(desc(redeemTable.requestedAt))
      .limit(1)
  )[0];
  const since = lastRedeem?.requestedAt ?? new Date(0);
  const voteCountSinceLastRedeem = await db.$count(
    voteTable,
    and(eq(voteTable.email, email), gte(voteTable.createdAt, since)),
  );
  const voteCount = await db.$count(voteTable, eq(voteTable.email, email));
  const voteRedeemGoal = 20 as const;
  const isRedeemable = voteCountSinceLastRedeem >= voteRedeemGoal;
  return {
    vote: {
      total: voteCount,
      sinceLastRedeem: voteCountSinceLastRedeem,
      redeemGoal: voteRedeemGoal,
    },
    isRedeemable,
    lastRedeem,
  };
};
