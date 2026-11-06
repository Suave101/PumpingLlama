import { getPlatform, notConfigured } from '@/lib/lti/config';
import { SCOPE } from '@/lib/lti/claims';
import { bearerToken, verifySession } from '@/lib/lti/session';
import { postScore } from '@/lib/lti/platform';
import { findSectionByKey, labProblems } from '@/lib/textbook/book';
import { gradeSection } from '@/lib/textbook/grading';
import { loadProblemMap } from '@/lib/problems';

const fail = (status: number, error: string) => Response.json({ error }, { status });

// Grade a section's answers on the server and post the result to the Canvas gradebook
export async function POST(request: Request) {
  const platform = getPlatform();
  if (!platform) return notConfigured();

  const session = await verifySession(bearerToken(request));
  if (!session) return fail(401, 'Your Canvas session expired. Reopen this assignment from Canvas.');

  const body = (await request.json().catch(() => null)) as { sectionKey?: string; responses?: unknown } | null;
  if (!body?.sectionKey || typeof body.responses !== 'object' || body.responses === null) {
    return fail(400, 'Expected { sectionKey, responses }.');
  }
  // A launch's line item belongs to one section, so only that section's grade may be posted to it
  if (body.sectionKey !== session.sectionKey) return fail(403, 'This Canvas assignment is for a different section.');
  if (!session.lineItem || !session.agsScopes.includes(SCOPE.score)) {
    return fail(409, 'This Canvas link is not set up as a graded assignment.');
  }

  const ref = findSectionByKey(body.sectionKey);
  if (!ref) return fail(404, 'Unknown section.');

  const grade = gradeSection(ref.section, body.responses as Record<string, unknown>, loadProblemMap(labProblems(ref.section)));
  if (grade.total === 0) return fail(409, 'This section has no graded activities.');

  try {
    await postScore(platform, session.lineItem, SCOPE.score, {
      userId: session.userId,
      scoreGiven: grade.earned,
      scoreMaximum: grade.total,
      activityProgress: grade.earned >= grade.total ? 'Completed' : 'InProgress',
      gradingProgress: 'FullyGraded',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[lti] score passback failed', err);
    return fail(502, 'Canvas did not accept the grade. Your progress is saved, so try again later.');
  }

  return Response.json({ earned: grade.earned, total: grade.total });
}
