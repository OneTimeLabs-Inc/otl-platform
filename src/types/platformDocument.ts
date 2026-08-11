/* ==========================================================
   PLATFORM DOCUMENT TYPES
   Administrative OTLES document browsing
   ========================================================== */

export type PlatformDocumentOrganization = {
  id: string;
  name: string;
  slug: string;
};

export type PlatformDocumentWorkspace = {
  id: string;
  organizationId: string;
  name: string;
};

export type PlatformDocumentListItem = {
  id: string;
  workspaceId: string;
  categoryId: string;
  number: number;
  title: string;
  status: string;
  isPublished: boolean;
  currentRevisionId: string | null;
};

export type PlatformDocumentCategory = {
  id: string;
  workspaceId: string;
  parentId: string | null;
  code: string;
  name: string;
  sortOrder: number;
  documents: PlatformDocumentListItem[];
  children: PlatformDocumentCategory[];
};

export type PlatformDocumentDetail = {
  id: string;
  workspaceId: string;
  categoryId: string;
  number: number;
  title: string;
  description: string | null;
  status: string;
  isPublished: boolean;
  currentRevisionId: string;
  revisionId: string;
  revision: number;
  version: string;
  revisionTitle: string;
  content: string;
  updatedAt: string;
};