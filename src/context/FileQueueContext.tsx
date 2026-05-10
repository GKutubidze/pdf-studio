import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react'
import type { QueuedFile } from '../types'

type Action =
  | { type: 'ADD_FILES'; files: QueuedFile[] }
  | { type: 'REMOVE_FILE'; id: string }
  | { type: 'UPDATE_FILE'; id: string; patch: Partial<QueuedFile> }
  | { type: 'CLEAR' }
  | { type: 'REORDER'; ids: string[] }

interface State {
  files: QueuedFile[]
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_FILES':
      return { files: [...state.files, ...action.files] }
    case 'REMOVE_FILE':
      return { files: state.files.filter((f) => f.id !== action.id) }
    case 'UPDATE_FILE':
      return {
        files: state.files.map((f) =>
          f.id === action.id ? { ...f, ...action.patch } : f,
        ),
      }
    case 'CLEAR':
      return { files: [] }
    case 'REORDER': {
      const map = new Map(state.files.map((f) => [f.id, f]))
      return { files: action.ids.flatMap((id) => (map.get(id) ? [map.get(id)!] : [])) }
    }
    default:
      return state
  }
}

interface FileQueueContextValue {
  files: QueuedFile[]
  addFiles: (files: QueuedFile[]) => void
  removeFile: (id: string) => void
  updateFile: (id: string, patch: Partial<QueuedFile>) => void
  clearFiles: () => void
  reorderFiles: (ids: string[]) => void
}

const FileQueueContext = createContext<FileQueueContextValue | null>(null)

export function FileQueueProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { files: [] })

  const addFiles = useCallback(
    (files: QueuedFile[]) => dispatch({ type: 'ADD_FILES', files }),
    [],
  )
  const removeFile = useCallback(
    (id: string) => dispatch({ type: 'REMOVE_FILE', id }),
    [],
  )
  const updateFile = useCallback(
    (id: string, patch: Partial<QueuedFile>) =>
      dispatch({ type: 'UPDATE_FILE', id, patch }),
    [],
  )
  const clearFiles = useCallback(() => dispatch({ type: 'CLEAR' }), [])
  const reorderFiles = useCallback(
    (ids: string[]) => dispatch({ type: 'REORDER', ids }),
    [],
  )

  return (
    <FileQueueContext.Provider
      value={{ files: state.files, addFiles, removeFile, updateFile, clearFiles, reorderFiles }}
    >
      {children}
    </FileQueueContext.Provider>
  )
}

export function useFileQueueContext() {
  const ctx = useContext(FileQueueContext)
  if (!ctx) throw new Error('useFileQueueContext must be used within FileQueueProvider')
  return ctx
}
