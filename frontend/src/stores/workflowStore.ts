import { create } from 'zustand'
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react'
import {
  type WorkflowConflictMode,
  parseWorkflowYaml,
  serializeWorkflowYaml,
} from '@/lib/workflowYaml'

export type WorkflowStatus =
  | 'not_published'
  | 'published_enabled'
  | 'published_disabled'
  | 'has_unpublished_changes'

export interface WorkflowItem {
  id: string
  name: string
  description?: string
  section?: string
  nodes: Node[]
  edges: Edge[]
  status: WorkflowStatus
  updatedAt: string
  versionDescription?: string
  tags: string[]
  timeBackMinutes?: number
  publishedNodes?: Node[]
  publishedEdges?: Edge[]
  versions: WorkflowVersion[]
}

export interface WorkflowVersion {
  id: string
  name: string
  createdAt: string
  author: string
  description?: string
  kind: 'draft' | 'published'
  nodes: Node[]
  edges: Edge[]
}

interface WorkflowStore {
  nodes: Node[]
  edges: Edge[]
  selectedNode: Node | null
  workflows: WorkflowItem[]
  currentWorkflowId: string | null
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  selectNode: (node: Node | null) => void
  addNode: (node: Node) => void
  createWorkflowDraft: (name?: string) => string
  saveCurrentWorkflowDraft: (name?: string) => string | null
  publishCurrentWorkflow: (payload?: {
    versionDescription?: string
    tags?: string[]
    timeBackMinutes?: number
  }) => string | null
  unpublishWorkflow: (id: string) => void
  setWorkflowTriggerEnabled: (id: string, enabled: boolean) => void
  openWorkflowInCanvas: (id: string) => void
  renameWorkflowVersion: (workflowId: string, versionId: string, name: string) => void
  restoreWorkflowVersion: (workflowId: string, versionId: string) => void
  saveWorkflowVersionAsWorkflow: (workflowId: string, versionId: string) => string | null
  exportWorkflowYaml: (id: string, options?: { publishedOnly?: boolean }) => string | null
  importWorkflowYaml: (yamlText: string, mode: WorkflowConflictMode) => string
}

function toValidStatus(status: string): WorkflowStatus {
  if (status === 'published_enabled') return 'published_enabled'
  if (status === 'published_disabled') return 'published_disabled'
  if (status === 'has_unpublished_changes') return 'has_unpublished_changes'
  return 'not_published'
}

function uniqueName(baseName: string, existingNames: string[]) {
  if (!existingNames.includes(baseName)) return baseName
  let count = 2
  let candidate = `${baseName} (${count})`
  while (existingNames.includes(candidate)) {
    count += 1
    candidate = `${baseName} (${count})`
  }
  return candidate
}

function createVersionEntry(input: {
  name: string
  description?: string
  kind: 'draft' | 'published'
  nodes: Node[]
  edges: Edge[]
}) {
  return {
    id: `ver-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    name: input.name,
    createdAt: new Date().toISOString(),
    author: 'You',
    description: input.description || '',
    kind: input.kind,
    nodes: input.nodes,
    edges: input.edges,
  }
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  workflows: [],
  currentWorkflowId: null,

  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),

  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),

  onConnect: (connection) =>
    set({ edges: addEdge({ ...connection, animated: true }, get().edges) }),

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  selectNode: (node) => set({ selectedNode: node }),

  addNode: (node) => set({ nodes: [...get().nodes, node] }),

  createWorkflowDraft: (name = 'Untitled workflow') => {
    const id = `wf-${Date.now()}`
    const draft: WorkflowItem = {
      id,
      name,
      description: '',
      section: 'Ungrouped',
      nodes: get().nodes,
      edges: get().edges,
      status: 'not_published',
      updatedAt: new Date().toISOString(),
      tags: [],
      versions: [
        createVersionEntry({
          name: 'Latest version',
          kind: 'draft',
          nodes: get().nodes,
          edges: get().edges,
        }),
      ],
    }
    set({
      workflows: [draft, ...get().workflows],
      currentWorkflowId: id,
    })
    return id
  },

  saveCurrentWorkflowDraft: (name) => {
    const { workflows, currentWorkflowId, nodes, edges } = get()
    if (!currentWorkflowId) {
      return get().createWorkflowDraft(name)
    }

    set({
      workflows: workflows.map((workflow) => {
        if (workflow.id !== currentWorkflowId) return workflow

        const nextStatus =
          workflow.status === 'published_enabled' ||
          workflow.status === 'published_disabled'
            ? 'has_unpublished_changes'
            : workflow.status

        return {
          ...workflow,
          name: name || workflow.name,
          nodes,
          edges,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
          versions: [
            createVersionEntry({
              name: 'Latest version',
              description: workflow.versionDescription,
              kind: 'draft',
              nodes,
              edges,
            }),
            ...workflow.versions,
          ],
        }
      }),
    })
    return currentWorkflowId
  },

  publishCurrentWorkflow: (payload) => {
    const { workflows, currentWorkflowId, nodes, edges } = get()
    if (!currentWorkflowId) {
      const createdId = get().createWorkflowDraft()
      get().publishCurrentWorkflow(payload)
      return createdId
    }

    set({
      workflows: workflows.map((workflow) =>
        workflow.id === currentWorkflowId
          ? {
              ...workflow,
              nodes,
              edges,
              description: workflow.description || '',
              section: workflow.section || 'Ungrouped',
              status: 'published_enabled',
              updatedAt: new Date().toISOString(),
              versionDescription:
                payload?.versionDescription || workflow.versionDescription,
              tags: payload?.tags ?? workflow.tags,
              timeBackMinutes:
                payload?.timeBackMinutes ?? workflow.timeBackMinutes,
              publishedNodes: nodes,
              publishedEdges: edges,
              versions: [
                createVersionEntry({
                  name: payload?.versionDescription || `Published ${new Date().toLocaleString()}`,
                  description: payload?.versionDescription,
                  kind: 'published',
                  nodes,
                  edges,
                }),
                ...workflow.versions,
              ],
            }
          : workflow,
      ),
    })
    return currentWorkflowId
  },

  unpublishWorkflow: (id) => {
    set({
      workflows: get().workflows.map((workflow) =>
        workflow.id === id
          ? {
              ...workflow,
              status: 'not_published',
              updatedAt: new Date().toISOString(),
            }
          : workflow,
      ),
    })
  },

  setWorkflowTriggerEnabled: (id, enabled) => {
    set({
      workflows: get().workflows.map((workflow) =>
        workflow.id === id
          ? {
              ...workflow,
              status: enabled ? 'published_enabled' : 'published_disabled',
              updatedAt: new Date().toISOString(),
            }
          : workflow,
      ),
    })
  },

  openWorkflowInCanvas: (id) => {
    const workflow = get().workflows.find((item) => item.id === id)
    if (!workflow) return

    set({
      currentWorkflowId: id,
      nodes: workflow.nodes,
      edges: workflow.edges,
      selectedNode: null,
    })
  },

  renameWorkflowVersion: (workflowId, versionId, name) => {
    const trimmed = name.trim()
    if (!trimmed) return

    set({
      workflows: get().workflows.map((workflow) =>
        workflow.id !== workflowId
          ? workflow
          : {
              ...workflow,
              versions: workflow.versions.map((version) =>
                version.id === versionId ? { ...version, name: trimmed } : version,
              ),
            },
      ),
    })
  },

  restoreWorkflowVersion: (workflowId, versionId) => {
    const workflow = get().workflows.find((item) => item.id === workflowId)
    if (!workflow) return

    const version = workflow.versions.find((item) => item.id === versionId)
    if (!version) return

    const nextStatus =
      workflow.status === 'published_enabled' || workflow.status === 'published_disabled'
        ? 'has_unpublished_changes'
        : 'not_published'

    const restoredDraftVersion = createVersionEntry({
      name: `Restored from ${version.name}`,
      kind: 'draft',
      nodes: version.nodes,
      edges: version.edges,
    })

    set({
      workflows: get().workflows.map((item) =>
        item.id !== workflowId
          ? item
          : {
              ...item,
              nodes: version.nodes,
              edges: version.edges,
              status: nextStatus,
              updatedAt: new Date().toISOString(),
              versions: [restoredDraftVersion, ...item.versions],
            },
      ),
      ...(get().currentWorkflowId === workflowId
        ? {
            nodes: version.nodes,
            edges: version.edges,
            selectedNode: null,
          }
        : {}),
    })
  },

  saveWorkflowVersionAsWorkflow: (workflowId, versionId) => {
    const workflow = get().workflows.find((item) => item.id === workflowId)
    if (!workflow) return null

    const version = workflow.versions.find((item) => item.id === versionId)
    if (!version) return null

    const existingNames = get().workflows.map((item) => item.name)
    const nextName = uniqueName(`${workflow.name} - ${version.name}`, existingNames)

    const newWorkflow: WorkflowItem = {
      id: `wf-${Date.now()}`,
      name: nextName,
      description: workflow.description,
      section: workflow.section,
      nodes: version.nodes,
      edges: version.edges,
      status: 'not_published',
      updatedAt: new Date().toISOString(),
      versionDescription: version.description,
      tags: [...workflow.tags],
      versions: [
        createVersionEntry({
          name: 'Latest version',
          description: `Saved from ${workflow.name} / ${version.name}`,
          kind: 'draft',
          nodes: version.nodes,
          edges: version.edges,
        }),
      ],
    }

    set({ workflows: [newWorkflow, ...get().workflows] })
    return newWorkflow.id
  },

  exportWorkflowYaml: (id, options) => {
    const workflow = get().workflows.find((item) => item.id === id)
    if (!workflow) return null

    const yaml = serializeWorkflowYaml({
      name: workflow.name,
      description: workflow.description,
      section: workflow.section,
      tags: workflow.tags,
      status: workflow.status,
      updatedAt: workflow.updatedAt,
      nodes:
        options?.publishedOnly && workflow.publishedNodes
          ? workflow.publishedNodes
          : workflow.nodes,
      edges:
        options?.publishedOnly && workflow.publishedEdges
          ? workflow.publishedEdges
          : workflow.edges,
      publishedNodes: workflow.publishedNodes,
      publishedEdges: workflow.publishedEdges,
    })

    return yaml
  },

  importWorkflowYaml: (yamlText, mode) => {
    const parsed = parseWorkflowYaml(yamlText)
    const existing = get().workflows
    const conflict = existing.find((item) => item.name === parsed.name)

    const createImportedWorkflow = (workflowName: string, id?: string): WorkflowItem => ({
      id: id || `wf-${Date.now()}`,
      name: workflowName,
      description: parsed.description || '',
      section: parsed.section || 'Ungrouped',
      nodes: parsed.nodes,
      edges: parsed.edges,
      status: toValidStatus(parsed.status || 'not_published'),
      updatedAt: new Date().toISOString(),
      versionDescription: parsed.description || '',
      tags: parsed.tags || [],
      publishedNodes: parsed.publishedNodes,
      publishedEdges: parsed.publishedEdges,
      versions: [
        createVersionEntry({
          name: 'Imported version',
          description: parsed.description,
          kind:
            toValidStatus(parsed.status || 'not_published') === 'not_published'
              ? 'draft'
              : 'published',
          nodes: parsed.nodes,
          edges: parsed.edges,
        }),
      ],
    })

    if (!conflict) {
      const imported = createImportedWorkflow(parsed.name)
      set({ workflows: [imported, ...existing] })
      return imported.id
    }

    if (mode === 'override_original') {
      const replaced = createImportedWorkflow(parsed.name, conflict.id)
      set({
        workflows: existing.map((item) => (item.id === conflict.id ? replaced : item)),
      })
      return conflict.id
    }

    if (mode === 'duplicate') {
      const name = uniqueName(`${parsed.name} (imported)`, existing.map((item) => item.name))
      const duplicated = createImportedWorkflow(name)
      set({ workflows: [duplicated, ...existing] })
      return duplicated.id
    }

    const keepName = uniqueName(parsed.name, existing.map((item) => item.name))
    const kept = createImportedWorkflow(keepName)
    set({ workflows: [kept, ...existing] })
    return kept.id
  },
}))
