import type { StaticImageData } from 'next/image';
import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import type { ReactElement } from 'react';
import { Image } from '@/components/Image';
import { Textarea } from '@/components/Textarea';
import VoteDocs from '@/docs/vote.mdx';
import { ImageLabel } from '@/features/navigation/components/ImageLabel/ImageLabel';
import { VoteForm } from '@/features/navigation/components/VoteForm/VoteForm';
import { createVote } from '@/usecases/createVote';
import { getAiAnnotationByImageId } from '@/usecases/getAiAnnotationByImageId';
import { getAnnotation } from '@/usecases/getAnnotation';
import { getNextVoteAnnotationId } from '@/usecases/getNextVoteAnnotationId';
import { css } from 'styled-system/css';

type VotePageProps = {
  params: Promise<{ annotationId: string }>;
};

const VotePage = async ({ params }: VotePageProps): Promise<ReactElement> => {
  const { annotationId } = await params;
  const annotation = await getAnnotation({ id: annotationId });
  if (!annotation) {
    notFound();
  }
  const { imageId, label, inquiry, latency } = annotation;
  const image = (await import(`../../../../../public/data/images/${imageId}.webp`)).default as StaticImageData;
  const aiAnnotation = await getAiAnnotationByImageId({ imageId });
  if (!aiAnnotation) {
    throw new Error('AIによるアノテーションが見つかりませんでした。');
  }

  const insertResult = async (formData: FormData) => {
    'use server';
    const email = formData.get('email') as string;
    const authorization = formData.get('authorization') as 'grant' | 'deny';
    const startsAt = new Date(formData.get('starts-at') as string);
    const endsAt = new Date();
    const duration = (endsAt.getTime() - startsAt.getTime()) / 1000;
    await createVote({ email, annotation: annotationId, duration, authorization });

    const nextAnnotationId = await getNextVoteAnnotationId();
    redirect(`/survey/vote/${nextAnnotationId}`);
  };

  return (
    <main
      className={css({
        w: 'full',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'start',
        flexDir: 'column',
        gap: '12',
        lg: {
          flexDir: 'row',
        },
      })}
    >
      <div
        className={css({
          flex: '1',
          display: 'flex',
          flexDir: 'column',
          justifyContent: 'start',
          alignItems: 'stretch',
          gap: '2',
        })}
      >
        <ImageLabel label={label} />
        <Image src={image} alt={label} placeholder="blur" />
        <label
          htmlFor="ai-inquiry"
          className={css({
            alignSelf: 'start',
            fontWeight: 'bold',
          })}
        >
          正しい説明文章{' '}
          <span
            className={css({
              fontSize: 'sm',
              p: '1',
              bg: 'success.11',
              color: 'success.1',
            })}
          >
            AIによる自動生成
          </span>
        </label>
        <Textarea
          id="ai-inquiry"
          name="ai-inquiry"
          placeholder="ここに説明文章を入力してください"
          value={aiAnnotation.inquiry}
          readOnly
        />
        <label
          htmlFor="inquiry"
          className={css({
            alignSelf: 'start',
            fontWeight: 'bold',
          })}
        >
          遺失物を引き取ろうとしている人物による説明文章{' '}
          <span
            className={css({
              fontSize: 'sm',
              p: '1',
              bg: 'info.11',
              color: 'info.1',
            })}
          >
            投票対象
          </span>
        </label>
        <Textarea id="inquiry" name="inquiry" placeholder="ここに説明文章を入力してください" value={inquiry} readOnly />
        <p
          aria-hidden
          className={css({
            alignSelf: 'end',
            textAlign: 'right',
            fontWeight: 'bold',
            fontSize: 'sm',
            color: 'keyplate.3',
          })}
        >
          {annotation.annotator === 'human' ? '人間による手書きデータ' : `LLMによる合成データ (${annotation.quality})`}
        </p>
        <label
          htmlFor="latency"
          className={css({
            alignSelf: 'start',
            fontWeight: 'bold',
          })}
        >
          主張された紛失日時と実際の誤差{' '}
          <span
            className={css({
              fontSize: 'sm',
              p: '1',
              bg: 'info.11',
              color: 'info.1',
            })}
          >
            投票対象
          </span>
        </label>
        <p
          id="latency"
          className={css({
            bg: 'keyplate.a.2',
            rounded: 'md',
            py: '2',
            px: '4',
          })}
        >
          {latency > 0
            ? `遺失物を引き取るために説明文章を書いた人物が主張している紛失日時は、実際の紛失日時の ${Math.abs(latency)} 日後でした。`
            : `遺失物を引き取るために説明文章を書いた人物が主張している紛失日時は、実際の紛失日時の ${Math.abs(latency)} 日前でした。`}
        </p>
        <VoteForm action={insertResult} />
      </div>
      <div
        className={css({
          flex: '1',
          display: 'flex',
          flexDir: 'column',
          justifyContent: 'start',
          alignItems: 'start',
          gap: '2',
          lg: {
            p: '6',
            bg: 'keyplate.a.1',
            border: '1px solid',
            borderColor: 'keyplate.6',
            rounded: '2xl',
          },
        })}
      >
        <div className="markup_div markdown-alert markdown-alert-tip">
          回答画面上部の画像と説明文章に対して、遺失物(落とし物)を受け渡してもいい正しい申請かどうかを、投票してください。
          その後、入力欄の下にある「回答を完了して送信」ボタンを押してください。
        </div>
        <VoteDocs />
      </div>
    </main>
  );
};

export default VotePage;

/**
 * ルートが再生成されるまでの時間を秒単位で指定します。
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#revalidate
 */
export const revalidate = 86400; // 24時間
