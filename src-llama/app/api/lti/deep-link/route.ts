import type { NextRequest } from 'next/server';
import { getPlatform, notConfigured, toolUrl } from '@/lib/lti/config';
import { CLAIM, isStaff } from '@/lib/lti/claims';
import { verifySession } from '@/lib/lti/session';
import { signForPlatform } from '@/lib/lti/platform';
import { autoPostPage, errorPage } from '@/lib/lti/html';
import { findSectionByKey, labProblems } from '@/lib/textbook/book';
import { gradeSection } from '@/lib/textbook/grading';
import { loadProblemMap } from '@/lib/problems';

// The instructor picked sections in /lti/deep-link; send them back to Canvas as graded links
export async function POST(request: NextRequest) {
  const platform = getPlatform();
  if (!platform) return notConfigured();

  const form = await request.formData();
  const session = await verifySession(form.get('token') as string | null);
  if (!session?.deepLink) return errorPage(401, 'The Canvas session expired. Start again from Canvas.');
  if (!isStaff(session.roles)) return errorPage(403, 'Only instructors can add textbook sections to a course.');

  const base = toolUrl(request);
  const contentItems = form
    .getAll('section')
    .flatMap((key) => {
      const ref = typeof key === 'string' ? findSectionByKey(key) : undefined;
      return ref ? [ref] : [];
    })
    .map((ref) => {
      // Total points for an empty response, the same maximum the score route posts
      const { total } = gradeSection(ref.section, {}, loadProblemMap(labProblems(ref.section)));
      const title = `${ref.chapterNumber}.${ref.sectionNumber} ${ref.section.title}`;
      return {
        type: 'ltiResourceLink',
        title,
        url: `${base}${ref.href}`,
        custom: { section: ref.key },
        ...(total > 0 ? { lineItem: { scoreMaximum: total, label: title, resourceId: ref.key } } : {}),
      };
    });

  const jwt = await signForPlatform(platform, {
    [CLAIM.messageType]: 'LtiDeepLinkingResponse',
    [CLAIM.version]: '1.3.0',
    [CLAIM.deploymentId]: session.deploymentId,
    [CLAIM.deepLinkingContentItems]: contentItems,
    ...(session.deepLink.data ? { [CLAIM.deepLinkingData]: session.deepLink.data } : {}),
  });

  return autoPostPage(session.deepLink.returnUrl, { JWT: jwt });
}
