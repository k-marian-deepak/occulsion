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
