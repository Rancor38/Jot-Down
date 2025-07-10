import React, { useState, useEffect, useRef, useCallback } from 'react'

// Individual Canister Component
function Canister({
  canister,
  isEditing,
  onEdit,
  onSave,
  onCreateNew,
  onDelete,
  onStopEditing,
  onNavigateToPrevious,
  onNavigateToNext,
  totalCanisters,
  onMouseDown,
  onMouseEnter
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
    e.preventDefault()
    onEdit(canister.id)
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
      className="canister display"
      onClick={handleClick}
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
  const [showSaveBtn, setShowSaveBtn] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState(null)
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

  // Handle mouse selection for multi-select
  const handleMouseDown = (canisterId, e) => {
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      e.preventDefault()
      setIsSelecting(true)
      setSelectionStart(canisterId)

      if (e.metaKey || e.ctrlKey) {
        // Toggle single canister
        const newEditingIds = new Set(editingCanisterIds)
        if (newEditingIds.has(canisterId)) {
          newEditingIds.delete(canisterId)
        } else {
          newEditingIds.add(canisterId)
        }
        setEditingCanisterIds(newEditingIds)
      } else if (e.shiftKey && editingCanisterIds.size > 0) {
        // Select range
        const firstEditingId = Array.from(editingCanisterIds)[0]
        const startIndex = canisters.findIndex(c => c.id === firstEditingId)
        const endIndex = canisters.findIndex(c => c.id === canisterId)
        const rangeStart = Math.min(startIndex, endIndex)
        const rangeEnd = Math.max(startIndex, endIndex)

        const newEditingIds = new Set()
        for (let i = rangeStart; i <= rangeEnd; i++) {
          newEditingIds.add(canisters[i].id)
        }
        setEditingCanisterIds(newEditingIds)
      }
    }
  }

  const handleMouseEnter = (canisterId, e) => {
    if (isSelecting && (e.buttons === 1)) { // Left mouse button is pressed
      const startIndex = canisters.findIndex(c => c.id === selectionStart)
      const currentIndex = canisters.findIndex(c => c.id === canisterId)
      const rangeStart = Math.min(startIndex, currentIndex)
      const rangeEnd = Math.max(startIndex, currentIndex)

      const newEditingIds = new Set()
      for (let i = rangeStart; i <= rangeEnd; i++) {
        newEditingIds.add(canisters[i].id)
      }
      setEditingCanisterIds(newEditingIds)
    }
  }

  // Handle mouse up to end selection
  useEffect(() => {
    const handleMouseUp = () => {
      setIsSelecting(false)
      setSelectionStart(null)
    }

    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [])

  // Handle canister operations
  const editCanister = (canisterId, cursorPosition = 'end') => {
    addToUndoStack(canisters)
    setEditingCanisterIds(new Set([canisterId]))
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
    setHasUnsavedChanges(false)
  }

  const stopEditingCanister = () => {
    setEditingCanisterIds(new Set())
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
      }, 0)
    } else {
      setEditingCanisterIds(new Set())
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
      // Cmd+A to select all canisters
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        const allCanisterIds = new Set(canisters.map(c => c.id))
        setEditingCanisterIds(allCanisterIds)
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
            setHasUnsavedChanges(true)
          }
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault()
          if (redoStack.current.length > 0) {
            undoStack.current.push(JSON.parse(JSON.stringify(canisters)))
            const nextState = redoStack.current.pop()
            setCanisters(nextState)
            setEditingCanisterIds(new Set())
            setHasUnsavedChanges(true)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canisters])

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
    setHasUnsavedChanges(false)
  }

  const handleSave = () => {
    setEditingCanisterIds(new Set())
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
      <div className="canisters-container">
        {canisters.map((canister) => (
          <Canister
            key={canister.id}
            canister={canister}
            isEditing={editingCanisterIds.has(canister.id)}
            onEdit={editCanister}
            onSave={saveCanister}
            onCreateNew={createNewCanister}
            onDelete={deleteCanister}
            onStopEditing={stopEditingCanister}
            onNavigateToPrevious={navigateToPrevious}
            onNavigateToNext={navigateToNext}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            totalCanisters={canisters.length}
          />
        ))}
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
