import { supabase } from "../lib/supabase";

import type {
  PlatformDocumentCategory,
  PlatformDocumentDetail,
  PlatformDocumentListItem,
  PlatformDocumentWorkspace,
} from "../types/platformDocument";


/* ==========================================================
   PLATFORM DOCUMENTS 001
   Load OTLES workspaces for an organization
   ========================================================== */

export async function getOrganizationOtlesWorkspaces(
  organizationId: string,
): Promise<PlatformDocumentWorkspace[]> {

  const { data, error } =
    await supabase
      .from("otles_workspaces")
      .select(`
        id,
        organization_id,
        name
      `)
      .eq(
        "organization_id",
        organizationId,
      )
      .order(
        "name",
        {
          ascending: true,
        },
      );

  if (error) {
    throw new Error(
      `Unable to load OTLES workspaces: ${error.message}`,
    );
  }

  return (data ?? []).map(
    workspace => ({
      id: workspace.id,
      organizationId:
        workspace.organization_id,
      name: workspace.name,
    }),
  );

}


/* ==========================================================
   PLATFORM DOCUMENTS 002
   Load nested category/document tree
   ========================================================== */

export async function getPlatformDocumentTree(
  workspaceId: string,
): Promise<PlatformDocumentCategory[]> {

  const [
    categoryResult,
    documentResult,
  ] = await Promise.all([

    supabase
      .from("otles_categories")
      .select(`
        id,
        workspace_id,
        parent_id,
        code,
        name,
        sort_order
      `)
      .eq(
        "workspace_id",
        workspaceId,
      )
      .order(
        "sort_order",
        {
          ascending: true,
        },
      )
      .order(
        "name",
        {
          ascending: true,
        },
      ),

    supabase
      .from("otles_documents")
      .select(`
        id,
        workspace_id,
        category_id,
        number,
        title,
        status,
        is_published,
        current_revision_id
      `)
      .eq(
        "workspace_id",
        workspaceId,
      )
      .order(
        "number",
        {
          ascending: true,
        },
      ),

  ]);

  if (categoryResult.error) {
    throw new Error(
      `Unable to load OTLES categories: ${categoryResult.error.message}`,
    );
  }

  if (documentResult.error) {
    throw new Error(
      `Unable to load OTLES documents: ${documentResult.error.message}`,
    );
  }

  const documentsByCategory =
    new Map<
      string,
      PlatformDocumentListItem[]
    >();

  for (
    const document of
    documentResult.data ?? []
  ) {

    const list =
      documentsByCategory.get(
        document.category_id,
      ) ?? [];

    list.push({
      id: document.id,
      workspaceId:
        document.workspace_id,
      categoryId:
        document.category_id,
      number: document.number,
      title: document.title,
      status: document.status,
      isPublished:
        document.is_published,
      currentRevisionId:
        document.current_revision_id,
    });

    documentsByCategory.set(
      document.category_id,
      list,
    );

  }

  const categoryMap =
    new Map<
      string,
      PlatformDocumentCategory
    >();

  for (
    const category of
    categoryResult.data ?? []
  ) {

    categoryMap.set(
      category.id,
      {
        id: category.id,
        workspaceId:
          category.workspace_id,
        parentId:
          category.parent_id,
        code: category.code,
        name: category.name,
        sortOrder:
          category.sort_order,
        documents:
          documentsByCategory.get(
            category.id,
          ) ?? [],
        children: [],
      },
    );

  }

  const roots:
    PlatformDocumentCategory[] = [];

  for (
    const category of
    categoryMap.values()
  ) {

    if (
      category.parentId &&
      categoryMap.has(
        category.parentId,
      )
    ) {

      categoryMap
        .get(
          category.parentId,
        )!
        .children.push(
          category,
        );

    } else {

      roots.push(
        category,
      );

    }

  }

  function sortCategories(
    categories:
      PlatformDocumentCategory[],
  ) {

    categories.sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        a.name.localeCompare(
          b.name,
        ),
    );

    for (const category of categories) {
      sortCategories(
        category.children,
      );
    }

  }

  sortCategories(
    roots,
  );

  return roots;

}


/* ==========================================================
   PLATFORM DOCUMENTS 003
   Load current document revision
   ========================================================== */

export async function getPlatformDocument(
  documentId: string,
): Promise<PlatformDocumentDetail> {

  const {
    data: document,
    error: documentError,
  } =
    await supabase
      .from("otles_documents")
      .select(`
        id,
        workspace_id,
        category_id,
        number,
        title,
        description,
        status,
        is_published,
        current_revision_id,
        updated_at
      `)
      .eq(
        "id",
        documentId,
      )
      .single();

  if (documentError) {
    throw new Error(
      `Unable to load document: ${documentError.message}`,
    );
  }

  if (
    !document.current_revision_id
  ) {
    throw new Error(
      "This document does not have a current revision.",
    );
  }

  const {
    data: revision,
    error: revisionError,
  } =
    await supabase
      .from(
        "otles_document_revisions",
      )
      .select(`
        id,
        document_id,
        revision,
        version,
        title,
        content
      `)
      .eq(
        "id",
        document.current_revision_id,
      )
      .single();

  if (revisionError) {
    throw new Error(
      `Unable to load document revision: ${revisionError.message}`,
    );
  }

  return {
    id: document.id,
    workspaceId:
      document.workspace_id,
    categoryId:
      document.category_id,
    number: document.number,
    title: document.title,
    description:
      document.description,
    status: document.status,
    isPublished:
      document.is_published,
    currentRevisionId:
      document.current_revision_id,
    revisionId:
      revision.id,
    revision:
      revision.revision,
    version:
      revision.version,
    revisionTitle:
      revision.title,
    content:
      revision.content ?? "",
    updatedAt:
      document.updated_at,
  };

}


/* ==========================================================
   PLATFORM DOCUMENTS 004
   Save current OTML revision content
   Matches OTLES working-document save behavior.
   ========================================================== */

export async function savePlatformDocumentContent(
  revisionId: string,
  content: string,
) {

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "otles_document_revisions",
      )
      .update({
        content,
      })
      .eq(
        "id",
        revisionId,
      )
      .select(`
        id,
        document_id,
        revision,
        version,
        content
      `)
      .single();

  if (error) {
    throw new Error(
      `Unable to save document: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error(
      "Document save completed without returning an updated revision.",
    );
  }

  return data;

}