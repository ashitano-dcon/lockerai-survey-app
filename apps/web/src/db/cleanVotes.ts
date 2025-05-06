import fs from 'fs/promises';
import { sql, inArray } from 'drizzle-orm';
import { voteTable } from './schema';
import { db } from '.';

/**
 * 投票をクリーンアップします。
 * voteTableから、同じannotationを持つ行のうち、最新のもの以外を消して重複を解消する。
 */
const cleanVotes = async () => {
  // 同じannotationを持っていて、より新しい行が存在する投票のIDを取得
  const duplicateVoteIds = await db
    .select({
      id: voteTable.id,
      email: voteTable.email,
      annotation: voteTable.annotation,
      authorization: voteTable.authorization,
      createdAt: voteTable.createdAt,
    })
    .from(voteTable)
    .where(
      // 1文章につき、1人1投票まで
      sql`EXISTS (
        SELECT 1 
        FROM ${voteTable} as v2 
        WHERE ${voteTable.annotation} = v2.annotation 
        AND ${voteTable.email} = v2.email
        AND v2.created_at > ${voteTable.createdAt}
      )`,
    );

  // 削除して削除した行を返す
  const deletedRows = await db
    .delete(voteTable)
    .where(
      inArray(
        voteTable.id,
        duplicateVoteIds.map((vote) => vote.id),
      ),
    )
    .returning();

  console.log(`${deletedRows.length}件の重複投票を削除しました`);

  // 削除した行をjsonファイルに保存
  await fs.writeFile('deletedVotes.json', JSON.stringify(deletedRows, null, 2));
  return deletedRows;
};

cleanVotes();
