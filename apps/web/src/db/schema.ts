import { randomUUID } from 'crypto';
import { uuid, text, pgTable, pgEnum, varchar, timestamp, boolean, real } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const annotatorOptionsEnum = pgEnum('annotator_options', ['human', 'ai', 'data-augmentation']);
export const redeemTypeOptionsEnum = pgEnum('redeem_type_options', ['annotation', 'vote']);
export const authorizationOptionsEnum = pgEnum('authorization_options', ['grant', 'deny']);
export const qualityOptionsEnum = pgEnum('quality_options', ['low', 'medium', 'high']);

// 遺失物の画像から説明文章を書くアノテーションの結果
export const annotationTable = pgTable('annotation', {
  id: uuid()
    .primaryKey()
    .$defaultFn(() => randomUUID()), // プライマリキー (UUIDv4)
  email: varchar({ length: 255 }), // 遺失物の画像を書いた人のメールアドレス
  imageId: varchar('image_id', { length: 255 }).notNull(), // 遺失物の画像の拡張子を除いたファイル名
  latency: real().notNull(), // 遺失物を引き取るために説明文章の書き主が主張している紛失日時 - 実際の紛失日時の誤差 (単位:日)
  annotator: annotatorOptionsEnum()
    .notNull()
    .$default(() => 'human'), // 説明文章を書いた者の分類
  label: varchar({ length: 255 }).notNull(), // Open Imege Dataset v7由来の画像のラベル
  inquiry: text().notNull(), // 説明文書
  duration: real(), // 説明文書を書くのにかかった時間 (単位:秒)
  quick: boolean().notNull(), // 10秒間だけ画像が表示される収集方法だったかどうか
  quality: qualityOptionsEnum(), // 合成データの品質の設定。`annotator`が`data-augmentation`の場合にのみ使用
  createdAt: timestamp('created_at').defaultNow().notNull(), // アノテーションの登録日時
});

// 説明文章が遺失物を正しく説明しているの投票結果
export const voteTable = pgTable('vote', {
  id: uuid()
    .primaryKey()
    .$defaultFn(() => randomUUID()), // プライマリキー (UUIDv4)
  email: varchar({ length: 255 }).notNull(), // 投票した人のメールアドレス
  annotation: uuid()
    .references(() => annotationTable.id)
    .notNull(), // 投票対象のアノテーション
  authorization: authorizationOptionsEnum().notNull(), // 是認か否認かのどちらか
  duration: real().notNull(), // 回答までの所要時間 (単位:秒)
  createdAt: timestamp('created_at').defaultNow().notNull(), // 投票結果の登録日時
});

// 謝礼の受け取り状態
export const redeemTable = pgTable('redeem', {
  id: uuid()
    .primaryKey()
    .$defaultFn(() => randomUUID()), // プライマリキー (UUIDv4)
  email: varchar({ length: 255 }).notNull(), // 謝礼を受け取る人のメールアドレス
  secret: varchar({ length: 255 }).notNull(), // 謝礼の受け取り用の秘密の文字列
  type: redeemTypeOptionsEnum().notNull(), // 謝礼の種類 (アノテーションか投票か)
  lastResentAt: timestamp('last_resent_at').defaultNow().notNull(), // 最後に受け取り用メールが再送信された日時
  confirmedAt: timestamp('confirmed_at'), // 謝礼の受け取りが確認された日時
  requestedAt: timestamp('requested_at').defaultNow().notNull(), // 謝礼の受け取りが申請された日時
});

export const insertAnnotationSchema = createInsertSchema(annotationTable);
export type InsertAnnotation = z.infer<typeof insertAnnotationSchema>;
export const insertVoteSchema = createInsertSchema(voteTable);
export type InsertVote = z.infer<typeof insertVoteSchema>;
export const insertRedeemSchema = createInsertSchema(redeemTable);
export type InsertRedeem = z.infer<typeof insertRedeemSchema>;
