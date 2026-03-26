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
  | 'under_review'

export type UserRole = 'creator' | 'contributor' | 'owner'

export interface WorkflowReviewRequest {
  id: string
  submittedAt: string
  submittedBy: string
  reviewers: string[]
  versionDescription?: string
  tags: string[]
  timeBackMinutes?: number
  snapshotNodes: Node[]
  snapshotEdges: Edge[]
  status: 'pending' | 'completed'
}

export interface WorkflowNotifications {
  emails: string[]
  webhooks: Array<{
    url: string
    headers?: Record<string, string>
  }>
}

export interface WorkflowFailureEvent {
  id: string
  workspaceName: string
  workflowId: string
  workflowName: string
  triggeringEntity: string
  failureTimestamp: string
  failedStep: string
}

export interface NotificationDelivery {
  id: string
  workflowId: string
  workflowName: string
  channel: 'email' | 'webhook'
  target: string
  sentAt: string
  payload: WorkflowFailureEvent
}

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
  activeExecutions: number
  executionsLast7d: number
  reviewRequest?: WorkflowReviewRequest
  notifications: WorkflowNotifications
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
  reviewState?: 'under_review'
}

interface WorkflowStore {
  nodes: Node[]
  edges: Edge[]
  selectedNode: Node | null
  workflows: WorkflowItem[]
  failureEvents: WorkflowFailureEvent[]
  notificationDeliveries: NotificationDelivery[]
  currentWorkflowId: string | null
  currentUserRole: UserRole
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  setCurrentUserRole: (role: UserRole) => void
  selectNode: (node: Node | null) => void
  addNode: (node: Node) => void
  persistCurrentWorkflowGraph: (nodes: Node[], edges: Edge[]) => void
  createWorkflowDraft: (name?: string) => string
  saveCurrentWorkflowDraft: (name?: string) => string | null
  publishCurrentWorkflow: (payload?: {
    versionDescription?: string
    tags?: string[]
    timeBackMinutes?: number
  }) => string | null
  submitWorkflowForReview: (payload: {
    workflowId: string
    versionDescription?: string
    tags?: string[]
    timeBackMinutes?: number
    reviewers?: string[]
  }) => string | null
  unpublishWorkflow: (id: string) => void
  setWorkflowTriggerEnabled: (id: string, enabled: boolean) => void
  updateWorkflowTags: (id: string, tags: string[]) => void
  updateWorkflowSection: (workflowIds: string[], section: string) => void
  runWorkflowExecution: (id: string) => void
  registerWorkflowFailure: (payload: {
    workflowId: string
    failedStep: string
    triggeringEntity?: string
    source?: 'manual' | 'automatic'
  }) => string | null
  stopWorkflowExecutions: (id: string) => void
  updateWorkflowNotifications: (id: string, notifications: WorkflowNotifications) => void
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

function sameGraph(nodesA: Node[], edgesA: Edge[], nodesB: Node[], edgesB: Edge[]) {
  return JSON.stringify(nodesA) === JSON.stringify(nodesB) && JSON.stringify(edgesA) === JSON.stringify(edgesB)
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
  failureEvents: [],
  notificationDeliveries: [],
  currentWorkflowId: null,
  currentUserRole: 'creator',

  onNodesChange: (changes) =>
    set(() => {
      const previousNodes = get().nodes
      const changedNodes = applyNodeChanges(changes, previousNodes)
      let nextNodes = changedNodes

      changes.forEach((change) => {
        if (change.type !== 'position') return

        const before = previousNodes.find((item) => item.id === change.id)
        const after = changedNodes.find((item) => item.id === change.id)
        if (!before || !after) return
        if (before.type === 'annotation') return

        const deltaX = (after.position?.x ?? 0) - (before.position?.x ?? 0)
        const deltaY = (after.position?.y ?? 0) - (before.position?.y ?? 0)
        if (!deltaX && !deltaY) return

        nextNodes = nextNodes.map((node) => {
          if (node.type !== 'annotation') return node
          const pinnedTo = (node.data as { pinnedTo?: string } | undefined)?.pinnedTo
          if (pinnedTo !== change.id) return node
          return {
            ...node,
            position: {
              x: (node.position?.x ?? 0) + deltaX,
              y: (node.position?.y ?? 0) + deltaY,
            },
          }
        })
      })

      return { nodes: nextNodes }
    }),

  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),

  onConnect: (connection) =>
    set({ edges: addEdge({ ...connection, animated: true }, get().edges) }),

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setCurrentUserRole: (role) => set({ currentUserRole: role }),
  selectNode: (node) => set({ selectedNode: node }),

  addNode: (node) => set({ nodes: [...get().nodes, node] }),

  persistCurrentWorkflowGraph: (nodes, edges) => {
    const { currentWorkflowId, workflows } = get()
    if (!currentWorkflowId) return

    set({
      workflows: workflows.map((workflow) => {
        if (workflow.id !== currentWorkflowId) return workflow

        const nextStatus: WorkflowStatus =
          workflow.status === 'published_enabled' || workflow.status === 'published_disabled'
            ? 'has_unpublished_changes'
            : workflow.status

        return {
          ...workflow,
          nodes,
          edges,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        }
      }),
    })
  },

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
      activeExecutions: 0,
      executionsLast7d: 0,
      notifications: {
        emails: [],
        webhooks: [],
      },
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
    const { workflows, currentWorkflowId, nodes, edges, currentUserRole } = get()
    if (currentUserRole === 'creator') {
      return currentWorkflowId
    }
    if (!currentWorkflowId) {
      const createdId = get().createWorkflowDraft()
      get().publishCurrentWorkflow(payload)
      return createdId
    }

    set({
      workflows: workflows.map((workflow) =>
        workflow.id !== currentWorkflowId
          ? workflow
          : (() => {
              const reviewSnapshotNodes =
                workflow.reviewRequest?.status === 'pending'
                  ? workflow.reviewRequest.snapshotNodes
                  : nodes
              const reviewSnapshotEdges =
                workflow.reviewRequest?.status === 'pending'
                  ? workflow.reviewRequest.snapshotEdges
                  : edges

              const hasNewDraftChanges = !sameGraph(
                nodes,
                edges,
                reviewSnapshotNodes,
                reviewSnapshotEdges,
              )

              return {
                ...workflow,
                nodes,
                edges,
                description: workflow.description || '',
                section: workflow.section || 'Ungrouped',
                status: hasNewDraftChanges ? 'has_unpublished_changes' : 'published_enabled',
                updatedAt: new Date().toISOString(),
                versionDescription:
                  payload?.versionDescription ||
                  workflow.reviewRequest?.versionDescription ||
                  workflow.versionDescription,
                tags: payload?.tags ?? workflow.reviewRequest?.tags ?? workflow.tags,
                timeBackMinutes:
                  payload?.timeBackMinutes ??
                  workflow.reviewRequest?.timeBackMinutes ??
                  workflow.timeBackMinutes,
                publishedNodes: reviewSnapshotNodes,
                publishedEdges: reviewSnapshotEdges,
                reviewRequest: workflow.reviewRequest
                  ? { ...workflow.reviewRequest, status: 'completed' }
                  : undefined,
                versions: [
                  createVersionEntry({
                    name:
                      payload?.versionDescription ||
                      workflow.reviewRequest?.versionDescription ||
                      `Published ${new Date().toLocaleString()}`,
                    description:
                      payload?.versionDescription || workflow.reviewRequest?.versionDescription,
                    kind: 'published',
                    nodes: reviewSnapshotNodes,
                    edges: reviewSnapshotEdges,
                  }),
                  ...workflow.versions,
                ],
              }
            })(),
      ),
    })
    return currentWorkflowId
  },

  submitWorkflowForReview: (payload) => {
    const { workflows, nodes, edges, currentWorkflowId } = get()

    const workflow = workflows.find((item) => item.id === payload.workflowId)
    if (!workflow) return null

    const sourceNodes = currentWorkflowId === payload.workflowId ? nodes : workflow.nodes
    const sourceEdges = currentWorkflowId === payload.workflowId ? edges : workflow.edges

    const reviewRequest: WorkflowReviewRequest = {
      id: `review-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      submittedBy: 'You',
      reviewers: payload.reviewers || [],
      versionDescription: payload.versionDescription,
      tags: payload.tags || workflow.tags,
      timeBackMinutes: payload.timeBackMinutes,
      snapshotNodes: sourceNodes,
      snapshotEdges: sourceEdges,
      status: 'pending',
    }

    set({
      workflows: workflows.map((item) =>
        item.id !== payload.workflowId
          ? item
          : {
              ...item,
              status: 'under_review',
              updatedAt: new Date().toISOString(),
              versionDescription: payload.versionDescription || item.versionDescription,
              tags: payload.tags || item.tags,
              timeBackMinutes: payload.timeBackMinutes ?? item.timeBackMinutes,
              reviewRequest,
              versions: [
                {
                  ...createVersionEntry({
                    name: 'Under review version',
                    description: payload.versionDescription,
                    kind: 'draft',
                    nodes: sourceNodes,
                    edges: sourceEdges,
                  }),
                  reviewState: 'under_review',
                },
                ...item.versions,
              ],
            },
      ),
    })

    return payload.workflowId
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

  updateWorkflowTags: (id, tags) => {
    set({
      workflows: get().workflows.map((workflow) =>
        workflow.id === id
          ? {
              ...workflow,
              tags,
              updatedAt: new Date().toISOString(),
            }
          : workflow,
      ),
    })
  },

  updateWorkflowSection: (workflowIds, section) => {
    const sectionName = section.trim() || 'Ungrouped'
    set({
      workflows: get().workflows.map((workflow) =>
        workflowIds.includes(workflow.id)
          ? {
              ...workflow,
              section: sectionName,
              updatedAt: new Date().toISOString(),
            }
          : workflow,
      ),
    })
  },

  runWorkflowExecution: (id) => {
    set({
      workflows: get().workflows.map((workflow) =>
        workflow.id === id
          ? {
              ...workflow,
              activeExecutions: workflow.activeExecutions + 1,
              executionsLast7d: workflow.executionsLast7d + 1,
              updatedAt: new Date().toISOString(),
            }
          : workflow,
      ),
    })
  },

  registerWorkflowFailure: ({
    workflowId,
    failedStep,
    triggeringEntity = 'System Event',
    source = 'automatic',
  }) => {
    const workflow = get().workflows.find((item) => item.id === workflowId)
    if (!workflow) return null

    const failureEvent: WorkflowFailureEvent = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      workspaceName: 'My Workspace',
      workflowId,
      workflowName: workflow.name,
      triggeringEntity,
      failureTimestamp: new Date().toISOString(),
      failedStep,
    }

    const shouldNotify =
      source !== 'manual' &&
      (workflow.status === 'published_enabled' ||
        workflow.status === 'published_disabled' ||
        workflow.status === 'has_unpublished_changes')

    const deliveries: NotificationDelivery[] = shouldNotify
      ? [
          ...workflow.notifications.emails.map((email) => ({
            id: `nd-${Date.now()}-${Math.floor(Math.random() * 10000)}-email`,
            workflowId,
            workflowName: workflow.name,
            channel: 'email' as const,
            target: email,
            sentAt: new Date().toISOString(),
            payload: failureEvent,
          })),
          ...workflow.notifications.webhooks.map((webhook) => ({
            id: `nd-${Date.now()}-${Math.floor(Math.random() * 10000)}-webhook`,
            workflowId,
            workflowName: workflow.name,
            channel: 'webhook' as const,
            target: webhook.url,
            sentAt: new Date().toISOString(),
            payload: failureEvent,
          })),
        ]
      : []

    set({
      workflows: get().workflows.map((item) =>
        item.id === workflowId
          ? {
              ...item,
              activeExecutions: Math.max(0, item.activeExecutions - 1),
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
      failureEvents: [failureEvent, ...get().failureEvents],
      notificationDeliveries: [...deliveries, ...get().notificationDeliveries],
    })

    return failureEvent.id
  },

  stopWorkflowExecutions: (id) => {
    set({
      workflows: get().workflows.map((workflow) =>
        workflow.id === id
          ? {
              ...workflow,
              activeExecutions: 0,
              updatedAt: new Date().toISOString(),
            }
          : workflow,
      ),
    })
  },

  updateWorkflowNotifications: (id, notifications) => {
    set({
      workflows: get().workflows.map((workflow) =>
        workflow.id === id
          ? {
              ...workflow,
              notifications,
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
      activeExecutions: 0,
      executionsLast7d: 0,
      notifications: {
        emails: [],
        webhooks: [],
      },
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
      activeExecutions: 0,
      executionsLast7d: 0,
      notifications: {
        emails: [],
        webhooks: [],
      },
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
