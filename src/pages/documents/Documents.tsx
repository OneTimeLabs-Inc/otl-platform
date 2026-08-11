import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Save,
} from "lucide-react";

import {
  getPlatformOrganizations,
  type PlatformOrganization,
} from "../../services/platformOrganizations";

import {
  getOrganizationOtlesWorkspaces,
  getPlatformDocument,
  getPlatformDocumentTree,
  savePlatformDocumentContent,
} from "../../services/platformDocuments";

import type {
  PlatformDocumentCategory,
  PlatformDocumentDetail,
  PlatformDocumentWorkspace,
} from "../../types/platformDocument";

import "./Documents.css";


/* ==========================================================
   PLATFORM DOCUMENTS 001
   Global OTLES document administration
   ========================================================== */

export default function Documents() {

  const [
    organizations,
    setOrganizations,
  ] =
    useState<
      PlatformOrganization[]
    >([]);

  const [
    organizationId,
    setOrganizationId,
  ] =
    useState("");

  const [
    workspaces,
    setWorkspaces,
  ] =
    useState<
      PlatformDocumentWorkspace[]
    >([]);

  const [
    workspaceId,
    setWorkspaceId,
  ] =
    useState("");

  const [
    categories,
    setCategories,
  ] =
    useState<
      PlatformDocumentCategory[]
    >([]);

  const [
    expandedCategoryIds,
    setExpandedCategoryIds,
  ] =
    useState<Set<string>>(
      new Set(),
    );

  const [
    selectedDocumentId,
    setSelectedDocumentId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    document,
    setDocument,
  ] =
    useState<
      PlatformDocumentDetail | null
    >(null);

  const [
    draftContent,
    setDraftContent,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    documentLoading,
    setDocumentLoading,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    savedMessage,
    setSavedMessage,
  ] =
    useState<string | null>(
      null,
    );


  /* ========================================================
     ORGANIZATIONS 002
     ======================================================== */

  useEffect(() => {

    let active = true;

    async function loadOrganizations() {

      try {

        setLoading(
          true,
        );

        setError(
          null,
        );

        const data =
          await getPlatformOrganizations();

        if (!active) {
          return;
        }

        setOrganizations(
          data,
        );

        setOrganizationId(
          current =>
            current ||
            data[0]?.id ||
            "",
        );

      } catch (err) {

        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load organizations.",
        );

      } finally {

        if (active) {
          setLoading(
            false,
          );
        }

      }

    }

    void loadOrganizations();

    return () => {
      active = false;
    };

  }, []);


  /* ========================================================
     WORKSPACES 003
     ======================================================== */

  useEffect(() => {

    if (!organizationId) {

      setWorkspaces([]);
      setWorkspaceId("");
      setCategories([]);
      setSelectedDocumentId(
        null,
      );

      return;

    }

    let active = true;

    async function loadWorkspaces() {

      try {

        setError(
          null,
        );

        setSelectedDocumentId(
          null,
        );

        setDocument(
          null,
        );

        const data =
          await getOrganizationOtlesWorkspaces(
            organizationId,
          );

        if (!active) {
          return;
        }

        setWorkspaces(
          data,
        );

        setWorkspaceId(
          data[0]?.id ?? "",
        );

      } catch (err) {

        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load organization workspace.",
        );

      }

    }

    void loadWorkspaces();

    return () => {
      active = false;
    };

  }, [
    organizationId,
  ]);


  /* ========================================================
     EXPLORER 004
     ======================================================== */

  useEffect(() => {

    if (!workspaceId) {

      setCategories([]);
      return;

    }

    let active = true;

    async function loadTree() {

      try {

        setError(
          null,
        );

        setSelectedDocumentId(
          null,
        );

        setDocument(
          null,
        );

        setExpandedCategoryIds(
          new Set(),
        );

        const tree =
          await getPlatformDocumentTree(
            workspaceId,
          );

        if (active) {
          setCategories(
            tree,
          );
        }

      } catch (err) {

        if (!active) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load OTLES documents.",
        );

      }

    }

    void loadTree();

    return () => {
      active = false;
    };

  }, [
    workspaceId,
  ]);


  /* ========================================================
     DOCUMENT 005
     ======================================================== */

  useEffect(() => {

    if (!selectedDocumentId) {

      setDocument(
        null,
      );

      setDraftContent(
        "",
      );

      return;

    }

    let active = true;

    async function loadDocument() {

      try {

        setDocumentLoading(
          true,
        );

        setError(
          null,
        );

        setSavedMessage(
          null,
        );

        const documentId =
          selectedDocumentId;

        if (!documentId) {
          return;
        }

        const data =
          await getPlatformDocument(
            documentId,
          );

        if (!active) {
          return;
        }

        setDocument(
          data,
        );

        setDraftContent(
          data.content,
        );

      } catch (err) {

        if (!active) {
          return;
        }

        setDocument(
          null,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load document.",
        );

      } finally {

        if (active) {
          setDocumentLoading(
            false,
          );
        }

      }

    }

    void loadDocument();

    return () => {
      active = false;
    };

  }, [
    selectedDocumentId,
  ]);


  /* ========================================================
     CATEGORY CONTROLS 006
     ======================================================== */

  function toggleCategory(
    categoryId: string,
  ) {

    setExpandedCategoryIds(
      current => {

        const next =
          new Set(current);

        if (
          next.has(
            categoryId,
          )
        ) {
          next.delete(
            categoryId,
          );
        } else {
          next.add(
            categoryId,
          );
        }

        return next;

      },
    );

  }


  function collectCategoryIds(
    list:
      PlatformDocumentCategory[],
  ): string[] {

    const ids: string[] = [];

    for (const category of list) {

      ids.push(
        category.id,
      );

      ids.push(
        ...collectCategoryIds(
          category.children,
        ),
      );

    }

    return ids;

  }


  function expandAll() {

    setExpandedCategoryIds(
      new Set(
        collectCategoryIds(
          categories,
        ),
      ),
    );

  }


  function collapseAll() {

    setExpandedCategoryIds(
      new Set(),
    );

  }


  /* ========================================================
     SAVE 007
     ======================================================== */

  async function handleSave() {

    if (!document) {
      return;
    }

    try {

      setSaving(
        true,
      );

      setError(
        null,
      );

      setSavedMessage(
        null,
      );

      await savePlatformDocumentContent(
        document.revisionId,
        draftContent,
      );

      setDocument(
        current =>
          current
            ? {
                ...current,
                content:
                  draftContent,
              }
            : current,
      );

      setSavedMessage(
        "Saved",
      );

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save document.",
      );

    } finally {

      setSaving(
        false,
      );

    }

  }


  const selectedOrganization =
    useMemo(
      () =>
        organizations.find(
          organization =>
            organization.id ===
            organizationId,
        ) ?? null,
      [
        organizations,
        organizationId,
      ],
    );


  /* ========================================================
     TREE 008
     ======================================================== */

  function renderCategory(
    category:
      PlatformDocumentCategory,
    depth = 0,
  ): React.ReactNode {

    const expanded =
      expandedCategoryIds.has(
        category.id,
      );

    return (
      <div
        key={
          category.id
        }
        className="platform-doc-category"
      >

        <button
          type="button"
          className="platform-doc-category-row"
          style={{
            paddingLeft:
              `${10 + depth * 16}px`,
          }}
          onClick={() =>
            toggleCategory(
              category.id,
            )
          }
        >

          {
            expanded
              ? <ChevronDown size={14} />
              : <ChevronRight size={14} />
          }

          <Folder size={14} />

          <span>
            {category.name}
          </span>

        </button>


        {expanded && (

          <div>

            {
              category.documents.map(
                item => (

                  <button
                    type="button"
                    key={
                      item.id
                    }
                    className={`platform-doc-document-row${
                      selectedDocumentId ===
                      item.id
                        ? " selected"
                        : ""
                    }`}
                    style={{
                      paddingLeft:
                        `${38 + depth * 16}px`,
                    }}
                    onClick={() =>
                      setSelectedDocumentId(
                        item.id,
                      )
                    }
                  >

                    <FileText
                      size={13}
                    />

                    <span className="platform-doc-code">
                      {category.code}-
                      {String(
                        item.number,
                      ).padStart(
                        3,
                        "0",
                      )}
                    </span>

                    <span className="platform-doc-document-title">
                      {item.title}
                    </span>

                  </button>

                ),
              )
            }


            {
              category.children.map(
                child =>
                  renderCategory(
                    child,
                    depth + 1,
                  ),
              )
            }

          </div>

        )}

      </div>
    );

  }


  return (
    <div className="platform-documents-page">

      <div className="platform-documents-container">

      <div className="platform-documents-heading">

        <div>
          <h1>
            Documents
          </h1>

          <p>
            View and edit OTLES documents across organizations.
          </p>
        </div>

      </div>


      <div className="platform-documents-filters">

        <label>
          <span>
            Organization
          </span>

          <select
            value={
              organizationId
            }
            onChange={
              event =>
                setOrganizationId(
                  event.target.value,
                )
            }
            disabled={
              loading
            }
          >

            {
              organizations.map(
                organization => (
                  <option
                    key={
                      organization.id
                    }
                    value={
                      organization.id
                    }
                  >
                    {organization.name}
                  </option>
                ),
              )
            }

          </select>
        </label>


        <label>
          <span>
            Workspace
          </span>

          <select
            value={
              workspaceId
            }
            onChange={
              event =>
                setWorkspaceId(
                  event.target.value,
                )
            }
            disabled={
              workspaces.length <= 1
            }
          >

            {
              workspaces.map(
                workspace => (
                  <option
                    key={
                      workspace.id
                    }
                    value={
                      workspace.id
                    }
                  >
                    {workspace.name}
                  </option>
                ),
              )
            }

          </select>
        </label>

      </div>


      {error && (
        <div className="platform-documents-error">
          {error}
        </div>
      )}


      <div className="platform-documents-workspace">

        <aside className="platform-documents-explorer">

          <div className="platform-documents-explorer-header">

            <div>
              <strong>
                {
                  selectedOrganization
                    ?.name ??
                  "Organization"
                }
              </strong>

              <span>
                OTLES Documents
              </span>
            </div>

            <div className="platform-documents-tree-controls">

              <button
                type="button"
                onClick={
                  expandAll
                }
                disabled={
                  categories.length === 0
                }
              >
                Expand All
              </button>

              <button
                type="button"
                onClick={
                  collapseAll
                }
                disabled={
                  categories.length === 0
                }
              >
                Collapse All
              </button>

            </div>

          </div>


          <div className="platform-documents-tree">

            {
              !workspaceId
                ? (
                  <div className="platform-documents-empty-small">
                    No OTLES workspace.
                  </div>
                )
                : categories.length === 0
                  ? (
                    <div className="platform-documents-empty-small">
                      No documents found.
                    </div>
                  )
                  : categories.map(
                      category =>
                        renderCategory(
                          category,
                        ),
                    )
            }

          </div>

        </aside>


        <section className="platform-documents-editor">

          {documentLoading ? (

            <div className="platform-documents-empty">
              Loading document...
            </div>

          ) : !document ? (

            <div className="platform-documents-empty">

              <FileText
                size={28}
              />

              <strong>
                Select a document
              </strong>

              <span>
                Choose an OTLES document from the organization explorer.
              </span>

            </div>

          ) : (

            <>

              <div className="platform-documents-editor-header">

                <div>

                  <div className="platform-documents-editor-meta">
                    Revision {document.revision}
                    {" · "}
                    Version {document.version}
                    {" · "}
                    {document.status}
                  </div>

                  <h2>
                    {document.title}
                  </h2>

                </div>


                <div className="platform-documents-save-area">

                  {savedMessage && (
                    <span>
                      {savedMessage}
                    </span>
                  )}

                  <button
                    type="button"
                    className="platform-documents-save-button"
                    onClick={
                      handleSave
                    }
                    disabled={
                      saving ||
                      draftContent ===
                        document.content
                    }
                  >
                    <Save size={14} />

                    {
                      saving
                        ? "Saving..."
                        : "Save"
                    }
                  </button>

                </div>

              </div>


              <textarea
                className="platform-documents-editor-textarea"
                value={
                  draftContent
                }
                onChange={
                  event => {

                    setDraftContent(
                      event.target.value,
                    );

                    setSavedMessage(
                      null,
                    );

                  }
                }
                spellCheck={
                  false
                }
              />

            </>

          )}

        </section>

      </div>

      </div>

    </div>
  );

}