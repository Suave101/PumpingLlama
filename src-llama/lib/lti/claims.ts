// LTI 1.3 / LTI Advantage claim names and scopes (IMS Global specs)
const LTI = 'https://purl.imsglobal.org/spec/lti/claim/';

export const CLAIM = {
  messageType: `${LTI}message_type`,
  version: `${LTI}version`,
  deploymentId: `${LTI}deployment_id`,
  targetLinkUri: `${LTI}target_link_uri`,
  resourceLink: `${LTI}resource_link`,
  roles: `${LTI}roles`,
  context: `${LTI}context`,
  custom: `${LTI}custom`,
  agsEndpoint: 'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint',
  deepLinkingSettings: 'https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings',
  deepLinkingContentItems: 'https://purl.imsglobal.org/spec/lti-dl/claim/content_items',
  deepLinkingData: 'https://purl.imsglobal.org/spec/lti-dl/claim/data',
} as const;

export const SCOPE = {
  lineItem: 'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem',
  lineItemReadOnly: 'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem.readonly',
  resultReadOnly: 'https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly',
  score: 'https://purl.imsglobal.org/spec/lti-ags/scope/score',
} as const;

const STAFF_ROLES = ['#Instructor', '#Administrator', '#ContentDeveloper', '#TeachingAssistant'];

export const isStaff = (roles: string[]) => roles.some((r) => STAFF_ROLES.some((s) => r.endsWith(s)));
