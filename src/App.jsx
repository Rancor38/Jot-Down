import React, { useState, useEffect, useRef, useCallback } from 'react'

// Multi-Line Editor Component for editing multiple selected canisters
function MultiLineEditor({
  canisters,
  selectedIds,
  onSave,
  onCancel
}) {
  const selectedCanisters = canisters.filter(c => selectedIds.has(c.id))
  const combinedContent = selectedCanisters.map(c => c.content).join('\n')
  const [editContent, setEditContent] = useState(combinedContent)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const textareaRef = useRef(null)
  const editorRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(editContent.length, editContent.length)
    }
  }, [])

  // Calculate position based on selected canisters
  useEffect(() => {
    const calculatePosition = () => {
      const selectedCanisterElements = Array.from(selectedIds).map(id =>
        document.querySelector(`[data-canister-id="${id}"]`)
      ).filter(Boolean)

      if (selectedCanisterElements.length > 0) {
        const firstElement = selectedCanisterElements[0]
        const lastElement = selectedCanisterElements[selectedCanisterElements.length - 1]

        const firstRect = firstElement.getBoundingClientRect()
        const lastRect = lastElement.getBoundingClientRect()

        const containerRect = document.querySelector('.canisters-container').getBoundingClientRect()

        setPosition({
          top: firstRect.top - containerRect.top + window.scrollY,
          left: firstRect.left - containerRect.left,
          width: Math.max(firstRect.width, 600), // Minimum width of 600px
          height: Math.max(200, (lastRect.bottom - firstRect.top) + 100) // Dynamic height based on selection
        })
      }
    }

    calculatePosition()

    // Recalculate on window resize
    window.addEventListener('resize', calculatePosition)
    window.addEventListener('scroll', calculatePosition)

    return () => {
      window.removeEventListener('resize', calculatePosition)
      window.removeEventListener('scroll', calculatePosition)
    }
  }, [selectedIds])

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
  }

  const handleSave = () => {
    const newLines = editContent.split('\n')
    onSave(selectedCanisters, newLines)
  }

  return (
    <div
      ref={editorRef}
      className="multi-line-editor inline"
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        width: position.width,
        minHeight: position.height,
        zIndex: 1000
      }}
    >
      <div className="multi-line-header">
        <span>✏️ Editing {selectedCanisters.length} lines together</span>
        <div className="multi-line-actions">
          <button onClick={handleSave} title="Save (Cmd+Enter)">✓ Save</button>
          <button onClick={onCancel} title="Cancel (Esc)">✗ Cancel</button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={editContent}
        onChange={(e) => setEditContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="multi-line-textarea"
        placeholder="Edit multiple lines here... Each line will become a separate container when saved."
        rows={Math.max(5, selectedCanisters.length + 2)}
        style={{ minHeight: position.height - 80 }} // Account for header height
      />
      <div className="multi-line-footer">
        <small>
          💡 <strong>Tip:</strong> Each line becomes a separate container. Press <kbd>Cmd+Enter</kbd> to save, <kbd>Esc</kbd> to cancel without changes.
        </small>
      </div>
    </div>
  )
}

// Individual Canister Component
function Canister({
  canister,
  isEditing,
  isSelected,
  isDragSelecting,
  isSelecting,
  onEdit,
  onSave,
  onCreateNew,
  onDelete,
  onStopEditing,
  onNavigateToPrevious,
  onNavigateToNext,
  totalCanisters,
  onMouseDown,
  onMouseEnter,
  onDoubleClick
}) {
  const [editContent, setEditContent] = useState(canister.content)
  const inputRef = useRef(null)
  const canisterRef = useRef(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.setSelectionRange(editContent.length, editContent.length)
    }
  }, [isEditing])

  useEffect(() => {
    if (isEditing) {
      setEditContent(canister.content)
    }
  }, [isEditing, canister.content])

  // Process markdown with highlighting for display
  const processLineMarkdown = (content) => {
    // Only show placeholder for empty content if there's more than one canister
    if ((!content || content.trim().length === 0) && totalCanisters > 1) {
      return '' // Return empty string instead of placeholder for multiple canisters
    } else if ((!content || content.trim().length === 0) && totalCanisters === 1) {
      return '<span class="placeholder-text">click to type something here</span>'
    }

    // Handle highlighting syntax
    const regex = /==/g
    let count = 0
    let processedContent = content.replace(regex, () => {
      count++
      return count % 2 === 1 ? '<mark>' : '</mark>'
    })

    // Convert basic markdown without creating block elements
    processedContent = processedContent
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^# (.*)/g, '<h1>$1</h1>')
      .replace(/^## (.*)/g, '<h2>$1</h2>')
      .replace(/^### (.*)/g, '<h3>$1</h3>')
      .replace(/^#### (.*)/g, '<h4>$1</h4>')
      .replace(/^##### (.*)/g, '<h5>$1</h5>')
      .replace(/^###### (.*)/g, '<h6>$1</h6>')
      .replace(/^- (.*)/g, '<li>$1</li>')
      .replace(/^\* (.*)/g, '<li>$1</li>')
      .replace(/^\+ (.*)/g, '<li>$1</li>')
      .replace(/^\d+\. (.*)/g, '<li>$1</li>')
      .replace(/^> (.*)/g, '<blockquote>$1</blockquote>')
      .replace(/^---$/g, '<hr>')

    return processedContent
  }

  const handleClick = (e) => {
    // Only handle single click to edit if we're not in a drag selection and no modifiers
    if (!isSelecting && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      e.stopPropagation()
      onEdit(canister.id)
    }
  }

  const handleDoubleClick = (e) => {
    e.preventDefault()
    onDoubleClick(canister.id)
  }

  const handleMouseDown = (e) => {
    onMouseDown(canister.id, e)
  }

  const handleMouseEnter = (e) => {
    onMouseEnter(canister.id, e)
  }

  const handleKeyDown = (e) => {
    const cursorPosition = e.target.selectionStart
    const textLength = editContent.length

    if (e.key === 'Enter') {
      e.preventDefault()
      onSave(canister.id, editContent)
      onCreateNew(canister.id)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onStopEditing()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      const newContent = editContent.substring(0, start) + '    ' + editContent.substring(end)
      setEditContent(newContent)

      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 4
      }, 0)
    } else if ((e.key === 'Backspace' || e.key === 'Delete') && editContent === '') {
      e.preventDefault()
      onDelete(canister.id, 'navigateToPrevious') // Pass navigation hint
    } else if (e.key === 'ArrowUp') {
      // Navigate to previous canister when at the beginning or if moving up
      e.preventDefault()
      onSave(canister.id, editContent)
      onNavigateToPrevious(canister.id)
    } else if (e.key === 'ArrowDown') {
      // Navigate to next canister when at the end or if moving down
      e.preventDefault()
      onSave(canister.id, editContent)
      onNavigateToNext(canister.id)
    } else if (e.key === 'ArrowLeft' && cursorPosition === 0) {
      // Navigate to previous canister when at the beginning and pressing left
      e.preventDefault()
      onSave(canister.id, editContent)
      onNavigateToPrevious(canister.id, 'end') // Position cursor at end
    } else if (e.key === 'ArrowRight' && cursorPosition === textLength) {
      // Navigate to next canister when at the end and pressing right
      e.preventDefault()
      onSave(canister.id, editContent)
      onNavigateToNext(canister.id, 'start') // Position cursor at start
    }
  }

  const handleBlur = () => {
    onSave(canister.id, editContent)
  }

  const handleChange = (e) => {
    setEditContent(e.target.value)
  }

  if (isEditing) {
    return (
      <div className="canister editing" ref={canisterRef}>
        <input
          ref={inputRef}
          type="text"
          value={editContent}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="canister-input"
          placeholder="Type your markdown here..."
        />
      </div>
    )
  }

  return (
    <div
      ref={canisterRef}
      className={`canister display ${isSelected ? 'selected' : ''} ${isDragSelecting ? 'selecting' : ''}`}
      data-canister-id={canister.id}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      dangerouslySetInnerHTML={{ __html: processLineMarkdown(canister.content) }}
    />
  )
}

// Main App Component
function App() {
  const [canisters, setCanisters] = useState([])
  const [editingCanisterIds, setEditingCanisterIds] = useState(new Set())
  const [selectedCanisterIds, setSelectedCanisterIds] = useState(new Set())
  const [isMultiLineEditing, setIsMultiLineEditing] = useState(false)
  const [showSaveBtn, setShowSaveBtn] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)
  const [dragSelectionIds, setDragSelectionIds] = useState(new Set())
  const [selectionStart, setSelectionStart] = useState(null)
  const containerRef = useRef(null)
  const lastScrollY = useRef(0)
  const undoStack = useRef([])
  const redoStack = useRef([])

  // Load initial content from localStorage or use default
  useEffect(() => {
    const savedContent = localStorage.getItem('jot-down-content')
    let initialContent = ''

    if (savedContent) {
      initialContent = savedContent
    } else {
      initialContent = `# Panel Area Calculation for Wall Coverage

All measurements are in **inches**.

---

## 🔹 Wall Dimensions and Areas

### ✅ Towel Wall

-   34 × 15 = **510 in²**
-   66 × 82 = **5,412 in²**  
    **Subtotal: 5,922 in²**

---

### ✅ Shower Wall

-   36 × 15 = **540 in²**

---

### ✅ Mirror Wall

-   28 × 82 = **2,296 in²**
-   34 × 15 = **510 in²**
-   6 × 51 = **306 in²**
-   36 × 15 = **540 in²**  
    **Subtotal: 3,652 in²**

---

### ✅ Door Wall

-   35 × 4 = **140 in²**
-   24 × 51 = **1,224 in²**
-   4 × 82 = **328 in²**  
    **Subtotal: 1,692 in²**

---

## 🔹 Total Area Required

| Wall        | Area (in²) |
| ----------- | ---------- |
| Towel Wall  | 5,922      |
| Shower Wall | 540        |
| Mirror Wall | 3,652      |
| Door Wall   | 1,692      |
| **Total**   | **11,806** |

---

## 📝 Notes

This is a ==highlighted== section to show the highlighting feature.

Click any line to edit that specific content!`
    }

    // Convert content to canisters (split by lines)
    const lines = initialContent.split('\n')
    const initialCanisters = lines.map((line, index) => ({
      id: `canister-${index}`,
      content: line,
      isEditing: false
    }))

    setCanisters(initialCanisters)
  }, [])

  // Auto-save to localStorage when canisters change
  useEffect(() => {
    if (canisters.length > 0) {
      const content = canisters.map(canister => canister.content).join('\n')
      localStorage.setItem('jot-down-content', content)
      setHasUnsavedChanges(false)
    }
  }, [canisters])

  // Handle scroll to show/hide save button
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY.current && currentScrollY > 40) {
        setShowSaveBtn(true)
      } else if (currentScrollY < lastScrollY.current || currentScrollY <= 40) {
        setShowSaveBtn(false)
      }
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Add to undo stack
  const addToUndoStack = useCallback((canistersState) => {
    undoStack.current.push(JSON.parse(JSON.stringify(canistersState)))
    if (undoStack.current.length > 50) {
      undoStack.current.shift()
    }
    redoStack.current = []
  }, [])

  // Handle mouse selection for multi-select - document level
  const handleDocumentMouseDown = useCallback((e) => {
    // Allow drag selection to start from anywhere in the document
    if (!e.shiftKey && !e.metaKey && !e.ctrlKey && !isMultiLineEditing) {
      // Don't start selection if clicking on buttons, inputs, or other interactive elements
      if (!e.target.closest('button') &&
        !e.target.closest('input') &&
        !e.target.closest('textarea') &&
        !e.target.closest('.multi-line-editor')) {
        setIsSelecting(true)
        setDragSelectionIds(new Set())
        setEditingCanisterIds(new Set()) // Clear current editing
        setSelectedCanisterIds(new Set()) // Clear current selection
      }
    }
  }, [isMultiLineEditing])

  // Handle mouse selection for multi-select - container level (keep for backwards compatibility)
  const handleContainerMouseDown = (e) => {
    // This is now handled by the document-level handler
    // Keep this function to avoid breaking existing props
  }

  // Handle mouse selection when clicking on canisters
  const handleCanisterMouseDown = (canisterId, e) => {
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      e.preventDefault()
      e.stopPropagation()

      if (e.metaKey || e.ctrlKey) {
        // Toggle single canister in selection
        const newSelectedIds = new Set(selectedCanisterIds)
        if (newSelectedIds.has(canisterId)) {
          newSelectedIds.delete(canisterId)
        } else {
          newSelectedIds.add(canisterId)
        }
        setSelectedCanisterIds(newSelectedIds)
        setEditingCanisterIds(new Set()) // Clear editing when selecting

        // If multiple canisters are now selected, open multi-line editor
        if (newSelectedIds.size > 1) {
          setTimeout(() => {
            setIsMultiLineEditing(true)
          }, 50)
        }
      } else if (e.shiftKey && selectedCanisterIds.size > 0) {
        // Select range
        const firstSelectedId = Array.from(selectedCanisterIds)[0]
        const startIndex = canisters.findIndex(c => c.id === firstSelectedId)
        const endIndex = canisters.findIndex(c => c.id === canisterId)
        const rangeStart = Math.min(startIndex, endIndex)
        const rangeEnd = Math.max(startIndex, endIndex)

        const newSelectedIds = new Set()
        for (let i = rangeStart; i <= rangeEnd; i++) {
          newSelectedIds.add(canisters[i].id)
        }
        setSelectedCanisterIds(newSelectedIds)
        setEditingCanisterIds(new Set()) // Clear editing when selecting

        // If multiple canisters are selected, open multi-line editor
        if (newSelectedIds.size > 1) {
          setTimeout(() => {
            setIsMultiLineEditing(true)
          }, 50)
        }
      }
    }
    // For normal clicks without modifier keys, let the document handler manage the drag selection
    // The click handler will still work for single clicks to edit
  }

  const handleCanisterMouseEnter = (canisterId, e) => {
    if (isSelecting) {
      if (selectionStart) {
        // Drag selection from a specific canister
        const startIndex = canisters.findIndex(c => c.id === selectionStart)
        const currentIndex = canisters.findIndex(c => c.id === canisterId)
        const rangeStart = Math.min(startIndex, currentIndex)
        const rangeEnd = Math.max(startIndex, currentIndex)

        const newSelectionIds = new Set()
        for (let i = rangeStart; i <= rangeEnd; i++) {
          newSelectionIds.add(canisters[i].id)
        }
        setDragSelectionIds(newSelectionIds)
      } else {
        // Free-form drag selection - add this canister to selection
        setDragSelectionIds(prev => new Set([...prev, canisterId]))
      }
    }
  }

  // Handle mouse up to end selection
  useEffect(() => {
    const handleMouseUp = () => {
      if (isSelecting && dragSelectionIds.size > 0) {
        // Commit the drag selection to selected (not editing)
        setSelectedCanisterIds(new Set(dragSelectionIds))
        setEditingCanisterIds(new Set()) // Clear editing

        // If multiple canisters are selected, automatically open multi-line editor
        if (dragSelectionIds.size > 1) {
          setTimeout(() => {
            setIsMultiLineEditing(true)
          }, 50) // Small delay to ensure state is updated
        }
      }
      setIsSelecting(false)
      setSelectionStart(null)
      setDragSelectionIds(new Set())
    }

    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [isSelecting, dragSelectionIds])

  // Add document-level mouse down listener for drag selection
  useEffect(() => {
    document.addEventListener('mousedown', handleDocumentMouseDown)
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown)
  }, [handleDocumentMouseDown])

  // Update body class when selecting
  useEffect(() => {
    if (isSelecting) {
      document.body.classList.add('selecting')
    } else {
      document.body.classList.remove('selecting')
    }

    // Cleanup on unmount
    return () => document.body.classList.remove('selecting')
  }, [isSelecting])

  // Handle canister operations
  const editCanister = (canisterId, cursorPosition = 'end') => {
    addToUndoStack(canisters)
    setEditingCanisterIds(new Set([canisterId]))
    setSelectedCanisterIds(new Set()) // Clear selection when editing
    setHasUnsavedChanges(true)

    // Set cursor position after component updates
    setTimeout(() => {
      const input = document.querySelector('.canister.editing input')
      if (input) {
        if (cursorPosition === 'start') {
          input.setSelectionRange(0, 0)
        } else if (cursorPosition === 'end') {
          input.setSelectionRange(input.value.length, input.value.length)
        }
      }
    }, 0)
  }

  const saveCanister = (canisterId, newContent) => {
    setCanisters(prev => prev.map(canister =>
      canister.id === canisterId
        ? { ...canister, content: newContent }
        : canister
    ))
    setEditingCanisterIds(new Set())
    setSelectedCanisterIds(new Set())
    setHasUnsavedChanges(false)
  }

  const stopEditingCanister = () => {
    setEditingCanisterIds(new Set())
    setSelectedCanisterIds(new Set())
  }

  const createNewCanister = (afterCanisterId) => {
    const afterIndex = canisters.findIndex(c => c.id === afterCanisterId)
    const newCanister = {
      id: `canister-${Date.now()}`,
      content: '',
      isEditing: false
    }

    setCanisters(prev => {
      const newCanisters = [...prev]
      newCanisters.splice(afterIndex + 1, 0, newCanister)
      return newCanisters
    })

    // Start editing the new canister
    setTimeout(() => {
      setEditingCanisterIds(new Set([newCanister.id]))
      setSelectedCanisterIds(new Set())
    }, 0)
  }

  const deleteCanister = (canisterId, navigationHint = null) => {
    if (canisters.length <= 1) return // Don't delete the last canister

    addToUndoStack(canisters)

    // Find the previous canister before deletion if we need to navigate to it
    const currentIndex = canisters.findIndex(c => c.id === canisterId)
    const previousCanister = currentIndex > 0 ? canisters[currentIndex - 1] : null

    setCanisters(prev => prev.filter(canister => canister.id !== canisterId))

    // Navigate to previous canister if hint is provided
    if (navigationHint === 'navigateToPrevious' && previousCanister) {
      setTimeout(() => {
        setEditingCanisterIds(new Set([previousCanister.id]))
        setSelectedCanisterIds(new Set())
      }, 0)
    } else {
      setEditingCanisterIds(new Set())
      setSelectedCanisterIds(new Set())
    }
  }

  const navigateToPrevious = (currentCanisterId, cursorPosition = 'end') => {
    const currentIndex = canisters.findIndex(c => c.id === currentCanisterId)
    if (currentIndex > 0) {
      const previousCanister = canisters[currentIndex - 1]
      editCanister(previousCanister.id, cursorPosition)
    }
  }

  const navigateToNext = (currentCanisterId, cursorPosition = 'start') => {
    const currentIndex = canisters.findIndex(c => c.id === currentCanisterId)
    if (currentIndex < canisters.length - 1) {
      const nextCanister = canisters[currentIndex + 1]
      editCanister(nextCanister.id, cursorPosition)
    }
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle shortcuts if multi-line editor is open
      if (isMultiLineEditing) return

      // Enter to edit selected canisters
      if (e.key === 'Enter' && selectedCanisterIds.size > 0) {
        e.preventDefault()
        if (selectedCanisterIds.size === 1) {
          // Single selection - normal edit
          const firstSelectedId = Array.from(selectedCanisterIds)[0]
          editCanister(firstSelectedId)
        } else {
          // Multi-selection - open multi-line editor
          setIsMultiLineEditing(true)
        }
        return
      }

      // Cmd+A to select all canisters
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        const allCanisterIds = new Set(canisters.map(c => c.id))
        setSelectedCanisterIds(allCanisterIds)
        setEditingCanisterIds(new Set()) // Clear editing when selecting all

        // Automatically open multi-line editor for select all
        if (allCanisterIds.size > 1) {
          setTimeout(() => {
            setIsMultiLineEditing(true)
          }, 50)
        }
        return
      }

      // Cmd+S to save as markdown file (works globally)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSaveAsMarkdown()
        return
      }

      // Undo/Redo (works globally)
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          if (undoStack.current.length > 0) {
            redoStack.current.push(JSON.parse(JSON.stringify(canisters)))
            const previousState = undoStack.current.pop()
            setCanisters(previousState)
            setEditingCanisterIds(new Set())
            setSelectedCanisterIds(new Set())
            setHasUnsavedChanges(true)
          }
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault()
          if (redoStack.current.length > 0) {
            undoStack.current.push(JSON.parse(JSON.stringify(canisters)))
            const nextState = redoStack.current.pop()
            setCanisters(nextState)
            setEditingCanisterIds(new Set())
            setSelectedCanisterIds(new Set())
            setHasUnsavedChanges(true)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canisters, isMultiLineEditing, selectedCanisterIds])

  // Handle multi-line editing
  const handleMultiLineSave = (selectedCanisters, newLines) => {
    addToUndoStack(canisters)

    // Create new canisters array with updated content
    const updatedCanisters = [...canisters]
    const firstSelectedIndex = canisters.findIndex(c => c.id === selectedCanisters[0].id)

    // Remove the old selected canisters
    selectedCanisters.forEach(canister => {
      const index = updatedCanisters.findIndex(c => c.id === canister.id)
      if (index !== -1) {
        updatedCanisters.splice(index, 1)
      }
    })

    // Insert new canisters at the position of the first selected canister
    const newCanisters = newLines.map((line, index) => ({
      id: `canister-${Date.now()}-${index}`,
      content: line,
      isEditing: false
    }))

    updatedCanisters.splice(firstSelectedIndex, 0, ...newCanisters)

    setCanisters(updatedCanisters)
    setIsMultiLineEditing(false)
    setSelectedCanisterIds(new Set())
    setEditingCanisterIds(new Set())
    setHasUnsavedChanges(true)
  }

  const handleMultiLineCancel = () => {
    setIsMultiLineEditing(false)
  }

  // Handle double-click on canisters
  const handleCanisterDoubleClick = (canisterId) => {
    if (selectedCanisterIds.size > 1 && selectedCanisterIds.has(canisterId)) {
      // If this canister is part of a multi-selection, open multi-line editor
      setIsMultiLineEditing(true)
    } else {
      // Normal single edit
      editCanister(canisterId)
    }
  }

  // Handle file operations
  const handleSaveAsMarkdown = () => {
    const content = canisters.map(canister => canister.content).join('\n')
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'notes.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Also save to localStorage
    localStorage.setItem('jot-down-content', content)
    setHasUnsavedChanges(false)
  }

  const handleOpenFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md,text/markdown'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file && file.name.endsWith('.md')) {
        const reader = new FileReader()
        reader.onload = (evt) => {
          addToUndoStack(canisters)
          const content = evt.target.result
          const lines = content.split('\n')
          const newCanisters = lines.map((line, index) => ({
            id: `canister-${Date.now()}-${index}`,
            content: line,
            isEditing: false
          }))
          setCanisters(newCanisters)
          setEditingCanisterIds(new Set())
          setSelectedCanisterIds(new Set())
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleNewFile = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to create a new file?')
      if (!confirmed) return
    }
    addToUndoStack(canisters)
    setCanisters([{
      id: `canister-${Date.now()}`,
      content: '',
      isEditing: false
    }])
    setEditingCanisterIds(new Set())
    setSelectedCanisterIds(new Set())
    setHasUnsavedChanges(false)
  }

  const handleSave = () => {
    setEditingCanisterIds(new Set())
    setSelectedCanisterIds(new Set())
    const content = canisters.map(canister => canister.content).join('\n')
    localStorage.setItem('jot-down-content', content)
    setHasUnsavedChanges(false)
  }

  return (
    <div className="app">
      {/* Top bar */}
      <div className="top-bar">
        <button onClick={handleOpenFile} title="Open Markdown File">
          📂 Open
        </button>
        <button onClick={handleNewFile} title="New Markdown File">
          🆕 New
        </button>
        <button onClick={handleSaveAsMarkdown} title="Save as Markdown File (Cmd+S)">
          💾 Save
        </button>
      </div>

      {/* Canisters */}
      <div
        className={`canisters-container ${isSelecting ? 'selecting' : ''}`}
        onMouseDown={handleContainerMouseDown}
        style={{ position: 'relative' }} // Make container relative for absolute positioning of editor
      >
        {canisters.map((canister) => (
          <Canister
            key={canister.id}
            canister={canister}
            isEditing={editingCanisterIds.has(canister.id)}
            isSelected={selectedCanisterIds.has(canister.id)}
            isDragSelecting={dragSelectionIds.has(canister.id)}
            isSelecting={isSelecting}
            onEdit={editCanister}
            onSave={saveCanister}
            onCreateNew={createNewCanister}
            onDelete={deleteCanister}
            onStopEditing={stopEditingCanister}
            onNavigateToPrevious={navigateToPrevious}
            onNavigateToNext={navigateToNext}
            onMouseDown={handleCanisterMouseDown}
            onMouseEnter={handleCanisterMouseEnter}
            onDoubleClick={handleCanisterDoubleClick}
            totalCanisters={canisters.length}
          />
        ))}

        {/* Multi-line editor positioned inline */}
        {isMultiLineEditing && (
          <MultiLineEditor
            canisters={canisters}
            selectedIds={selectedCanisterIds}
            onSave={handleMultiLineSave}
            onCancel={handleMultiLineCancel}
          />
        )}
      </div>

      {/* Save button */}
      <div className="save-btn-wrapper">
        <button
          className={`save-btn ${showSaveBtn ? 'visible' : 'hidden'}`}
          onClick={handleSave}
        >
          Hard Save & Format
        </button>
      </div>
    </div>
  )
}

export default App
