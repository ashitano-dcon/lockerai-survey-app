import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import GetStartedDocs from '@/docs/get-started.mdx';
import VoteDocs from '@/docs/vote.mdx';
import { EmailForm } from '@/features/navigation/components/EmailForm/EmailForm';
import { getNextVoteAnnotationId } from '@/usecases/getNextVoteAnnotationId';

import { css } from 'styled-system/css';

const Page = async (): Promise<ReactNode> => {
  const startSurvey = async () => {
    'use server';
    const annotationId = await getNextVoteAnnotationId();
    redirect(`/survey/vote/${annotationId}`);
  };
  return (
    <main
      className={css({
        pb: '32',
        display: 'flex',
        w: 'full',
        maxW: '800px',
        flexDir: 'column',
        alignSelf: 'center',
        lineHeight: '1.8',
      })}
    >
      <VoteDocs />
      <GetStartedDocs />
      <EmailForm action={startSurvey} />
    </main>
  );
};

export default Page;
