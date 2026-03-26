import { useMemo, useRef, useState } from 'react'
import { type NodeProps } from '@xyflow/react'
import { Pencil, Pin, Trash2 } from 'lucide-react'
import { useWorkflowStore } from '@/stores/workflowStore'

type AnnotationData = {
  content?: string
  pinnedTo?: string | null
}

function insertHtml(html: string) {
  document.execCommand('insertHTML', false, html)
}

export function AnnotationNode({ id, data, selected }: NodeProps) {
  const annotationData = (data || {}) as AnnotationData
  const [isEditing, setIsEditing] = useState(!annotationData.content)
  const editorRef = useRef<HTMLDivElement | null>(null)

  const { nodes, edges, setNodes, persistCurrentWorkflowGraph } = useWorkflowStore()

  const currentNode = useMemo(
    () => nodes.find((node) => node.id === id),
    [id, nodes],
  )

  const updateNodes = (nextNodes: any[]) => {
    setNodes(nextNodes)
    persistCurrentWorkflowGraph(nextNodes, edges)
  }

  const commitContent = () => {
    const html = editorRef.current?.innerHTML?.trim() || ''
    const nextNodes = nodes.map((node) =>
      node.id === id
        ? {
            ...node,
            data: {
              ...(node.data || {}),
              content: html,
            },
          }
        : node,
    )
    updateNodes(nextNodes as any[])
  }

  const togglePin = () => {
    const currentPinned = annotationData.pinnedTo || null
    if (currentPinned) {
      const nextNodes = nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...(node.data || {}),
                pinnedTo: null,
              },
            }
          : node,
      )
      updateNodes(nextNodes as any[])
      return
    }

    if (!currentNode) return

    const anchorNodes = nodes.filter((node) => node.type !== 'annotation')
    if (anchorNodes.length === 0) return

    const nearest = anchorNodes
      .map((node) => {
        const dx = (node.position?.x || 0) - (currentNode.position?.x || 0)
        const dy = (node.position?.y || 0) - (currentNode.position?.y || 0)
        return { id: node.id, distance: Math.sqrt(dx * dx + dy * dy) }
      })
      .sort((left, right) => left.distance - right.distance)[0]

    const nextNodes = nodes.map((node) =>
      node.id === id
        ? {
            ...node,
            data: {
              ...(node.data || {}),
              pinnedTo: nearest.id,
            },
          }
        : node,
    )
    updateNodes(nextNodes as any[])
  }

  const deleteAnnotation = () => {
    const nextNodes = nodes.filter((node) => node.id !== id)
    updateNodes(nextNodes as any[])
  }

  const runCommand = (command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    commitContent()
  }

  return (
    <div
      style={{
        minWidth: 310,
        maxWidth: 360,
        background: '#05070c',
        border: '2px solid #ff2bb5',
        borderRadius: 12,
        boxShadow: selected ? '0 0 0 2px rgba(255,43,181,0.3)' : '0 12px 30px rgba(0,0,0,0.45)',
      }}
    >
      {(selected || annotationData.pinnedTo) && (
        <div className="nodrag" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '8px 10px 0' }}>
          <button onClick={togglePin} style={{ background: 'transparent', border: 'none', color: annotationData.pinnedTo ? '#f9a8d4' : '#9ca3af', cursor: 'pointer' }} title={annotationData.pinnedTo ? 'Unpin annotation' : 'Pin annotation'}>
            <Pin size={14} />
          </button>
          <button onClick={() => setIsEditing(true)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }} title="Edit annotation">
            <Pencil size={14} />
          </button>
          <button onClick={deleteAnnotation} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }} title="Delete annotation">
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <div className="nodrag" style={{ padding: '10px 14px', color: '#e5e7eb' }}>
        {isEditing ? (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onMouseDown={(event) => event.stopPropagation()}
            onInput={commitContent}
            onBlur={() => {
              commitContent()
              setIsEditing(false)
            }}
            style={{
              minHeight: 90,
              outline: 'none',
              fontSize: 30,
              lineHeight: 1.35,
              color: '#e5e7eb',
            }}
            dangerouslySetInnerHTML={{ __html: annotationData.content || 'Write something ...' }}
          />
        ) : (
          <div
            onDoubleClick={() => setIsEditing(true)}
            style={{
              minHeight: 50,
              fontSize: 34,
              lineHeight: 1.3,
              color: annotationData.content ? '#e5e7eb' : '#9ca3af',
              whiteSpace: 'pre-wrap',
            }}
            dangerouslySetInnerHTML={{ __html: annotationData.content || 'Write something ...' }}
          />
        )}
      </div>

      {isEditing && (
        <div className="nodrag" style={{ borderTop: '1px solid #374151', padding: '8px 10px', display: 'flex', gap: 8, alignItems: 'center', color: '#e5e7eb', fontSize: 12 }}>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand('formatBlock', 'H1')} style={{ background: 'transparent', border: '1px solid #374151', color: '#e5e7eb', cursor: 'pointer', borderRadius: 4, padding: '2px 6px' }}>H</button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand('formatBlock', 'H2')} style={{ background: 'transparent', border: '1px solid #374151', color: '#e5e7eb', cursor: 'pointer', borderRadius: 4, padding: '2px 6px' }}>T</button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand('formatBlock', 'P')} style={{ background: 'transparent', border: '1px solid #374151', color: '#e5e7eb', cursor: 'pointer', borderRadius: 4, padding: '2px 6px' }}>¶</button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => insertHtml('<table border="1" style="border-collapse:collapse;width:100%"><tr><td>Cell</td><td>Cell</td></tr><tr><td>Cell</td><td>Cell</td></tr></table>')} style={{ background: 'transparent', border: '1px solid #374151', color: '#e5e7eb', cursor: 'pointer', borderRadius: 4, padding: '2px 6px' }}><i className="fa-solid fa-table" /></button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => {
            const url = window.prompt('Image URL')
            if (!url) return
            insertHtml(`<img src="${url}" alt="annotation" style="max-width:100%;border-radius:4px;"/>`)
            commitContent()
          }} style={{ background: 'transparent', border: '1px solid #374151', color: '#e5e7eb', cursor: 'pointer', borderRadius: 4, padding: '2px 6px' }}><i className="fa-regular fa-image" /></button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => {
            const url = window.prompt('Video URL')
            if (!url) return
            insertHtml(`<a href="${url}" target="_blank" rel="noreferrer">${url}</a>`)
            commitContent()
          }} style={{ background: 'transparent', border: '1px solid #374151', color: '#e5e7eb', cursor: 'pointer', borderRadius: 4, padding: '2px 6px' }}><i className="fa-solid fa-video" /></button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => {
            const url = window.prompt('Link URL')
            if (!url) return
            runCommand('createLink', url)
          }} style={{ background: 'transparent', border: '1px solid #374151', color: '#e5e7eb', cursor: 'pointer', borderRadius: 4, padding: '2px 6px' }}><i className="fa-solid fa-link" /></button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand('undo')} style={{ background: 'transparent', border: '1px solid #374151', color: '#e5e7eb', cursor: 'pointer', borderRadius: 4, padding: '2px 6px' }}><i className="fa-solid fa-rotate-left" /></button>
          <button onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand('redo')} style={{ background: 'transparent', border: '1px solid #374151', color: '#e5e7eb', cursor: 'pointer', borderRadius: 4, padding: '2px 6px' }}><i className="fa-solid fa-rotate-right" /></button>
        </div>
      )}
    </div>
  )
}