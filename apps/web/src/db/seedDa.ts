import { eq } from 'drizzle-orm';
import { z } from 'zod';
import unsafeDataAugmentationAnnotations from './data-augmentation-annotaions.json'; // eslint-disable-line
import type { InsertAnnotation } from './schema';
import { insertAnnotationSchema, annotationTable } from './schema';
import { db } from '.';

const daAnnotationsSchema = z.array(
  z.object({
    id: z.string(),
    imageId: z.string(),
    label: z.string(),
    latency: z.number(),
    inquiry: z.string(),
    description: z.string(),
    quality: z.enum(['low', 'medium', 'high']),
  }),
);

const main = async () => {
  const daAnnotations = daAnnotationsSchema.parse(unsafeDataAugmentationAnnotations);
  const daAnnotationRows = z.array(insertAnnotationSchema).parse(
    daAnnotations.map(
      ({ imageId, label, latency, inquiry, quality }): InsertAnnotation => ({
        imageId,
        label,
        latency,
        inquiry,
        quality,
        quick: false,
        annotator: 'data-augmentation',
      }),
    ),
  );

  const currentdaAnnotationCount = await db.$count(annotationTable, eq(annotationTable.annotator, 'data-augmentation'));
  if (currentdaAnnotationCount > 0) {
    throw new Error('data augmentation annotations already exist');
  }

  await db.insert(annotationTable).values(daAnnotationRows);
};

main();
