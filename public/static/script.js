// <==== Double Click to Fetch and Edit Text ====>
document.getElementById("text_edit").addEventListener("dblclick", () => {
    fetch("/fetch")
        .then((response) => response.text())
        .then((data) => {
            document
                .getElementById("text_edit")
                .setAttribute("contenteditable", "true")

            // Clear placeholder if data is empty
            const textContent = data.trim().length === 0 ? "" : data
            document.getElementById("text_edit").textContent = textContent

            // If the content was empty, focus on the element for immediate typing
            if (textContent === "") {
                document.getElementById("text_edit").focus()
            }

            console.log(data)
            // Push 'data' to the cookie stack
            pushToStack(data)
        })
})

// <==== Tab Key Functionality for Text Editing ====>
document.getElementById("text_edit").addEventListener("keydown", (event) => {
    const isTabKey = event.key === "Tab"
    const isContentEditable =
        document.getElementById("text_edit").getAttribute("contenteditable") ===
        "true"

    if (isTabKey && isContentEditable) {
        event.preventDefault()

        // Insert four spaces at the caret position
        const selection = window.getSelection()
        const range = selection.getRangeAt(0)
        const tabSpace = document.createTextNode("    ") // Four spaces
        range.deleteContents()
        range.insertNode(tabSpace)
        range.setStartAfter(tabSpace)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
    }
})

// <==== Handle Enter Key for Line Breaks ====>
document.getElementById("text_edit").addEventListener("keydown", (event) => {
    const isEnterKey = event.key === "Enter"
    const isContentEditable =
        document.getElementById("text_edit").getAttribute("contenteditable") ===
        "true"

    if (isEnterKey && isContentEditable) {
        event.preventDefault()

        // Use execCommand if available, otherwise fallback to manual insertion
        if (document.execCommand) {
            document.execCommand("insertText", false, "\n")
        } else {
            // Fallback for browsers that don't support execCommand
            const selection = window.getSelection()
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0)
                range.deleteContents()
                range.insertNode(document.createTextNode("\n"))
                range.collapse(false)
                selection.removeAllRanges()
                selection.addRange(range)
            }
        }
    }
})

// <==== Command + Z Undo ====>

document.addEventListener("keydown", (event) => {
    const isContentEditable =
        document.getElementById("text_edit").getAttribute("contenteditable") ===
        "true"
    const isZPressed = event.key === "z"
    const isMetaKey = event.metaKey

    if (!event.shiftKey && isZPressed && isMetaKey && isContentEditable) {
        const htmlContent = peekAtStack() // Retrieve HTML content from the stack
        if (htmlContent !== null) {
            const textEditElement = document.getElementById("text_edit")

            const tempElement = document.createElement("div")
            tempElement.innerHTML = htmlContent

            // Replace the content of textEditElement with the received HTML
            textEditElement.innerHTML = tempElement.innerHTML
            popFromStack()
        }
    }
})

// <==== Command + Shift + Z Redo ====>
document.addEventListener("keydown", (event) => {
    const isContentEditable =
        document.getElementById("text_edit").getAttribute("contenteditable") ===
        "true"
    const isZPressed = event.key === "z"
    const isShiftKey = event.shiftKey
    const isMetaKey = event.metaKey

    if (isZPressed && isShiftKey && isMetaKey && isContentEditable) {
        const htmlContent = peekAtRedoStack() // Retrieve HTML content from the RedoStack
        if (htmlContent !== null) {
            const textEditElement = document.getElementById("text_edit")

            const tempElement = document.createElement("div")
            tempElement.innerHTML = htmlContent

            // Replace the content of textEditElement with the received HTML
            textEditElement.innerHTML = tempElement.innerHTML

            // Push the htmlContent to the stack
            pushToStack(htmlContent)
            popFromRedoStack() // Remove the item from the RedoStack
        }
    }
})

// <==== Save on Edit (Every Key) ====>

document.addEventListener("keydown", (event) => {
    const isContentEditable =
        document.getElementById("text_edit").getAttribute("contenteditable") ===
        "true"
    const textEditElement = document.getElementById("text_edit")
    if (!textEditElement) {
        console.error("Element with ID 'text_edit' not found.")
        return
    }

    if (isContentEditable && !event.metaKey) {
        const editedContent = textEditElement.textContent
        pushToStack(editedContent)
    }
    if (isContentEditable) {
        const editedContent = textEditElement.textContent
        fetch("/save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ data: editedContent }),
        })
    }
})

// <==== Hard Save Text on Button Click && Clear Stacks ====>
document.getElementById("text_save").addEventListener("click", () => {
    const textEditElement = document.getElementById("text_edit")
    if (textEditElement.getAttribute("contenteditable") === "true") {
        const editedContent = textEditElement.textContent
        textEditElement.setAttribute("contenteditable", "false")

        fetch("/save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ data: editedContent }),
        }).then(() => {
            fetch("/saved", {
                method: "GET",
            })
                .then((response) => response.text())
                .then((htmlContent) => {
                    textEditElement.innerHTML = htmlContent
                    setTimeout(scrollToBottomElement, 700)
                })
                .catch((error) => {
                    console.error("Error making GET request to /saved:", error)
                })
        })
        // Clear both stack and RedoStack in localStorage
        localStorage.removeItem("stack")
        localStorage.removeItem("redoStack")
    }
})

// <==== Save Text on Keyboard Shortcut ====>
document.addEventListener("keydown", (event) => {
    const isCommandOrCtrlKey = event.metaKey || event.ctrlKey // 'Meta' key for Mac, 'Ctrl' key for Windows
    const isSKey = event.key === "s" || event.keyCode === 83 // Check for 's' key

    if (isCommandOrCtrlKey && isSKey) {
        const textEditElement = document.getElementById("text_edit")
        const isContentEditable =
            textEditElement.getAttribute("contenteditable") === "true"

        if (isContentEditable) {
            event.preventDefault()

            const editedContent = textEditElement.textContent
            // textEditElement.setAttribute("contenteditable", "false");

            fetch("/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ data: editedContent }),
            })
            // .then(() => {
            //   fetch("/saved", {
            //     method: "GET",
            //   })
            //     .then((response) => response.text())
            //     .then((htmlContent) => {
            //       const tempElement = document.createElement('div');
            //       tempElement.innerHTML = htmlContent;

            //       // Replace the content of textEditElement with the received HTML
            //       textEditElement.innerHTML = tempElement.innerHTML;
            //       setTimeout(scrollToBottomElement, 700);
            //     })
            //     .catch((error) => {
            //       console.error("Error making GET request to /saved:", error);
            //     });
            // });
        }
    }
})

// <==== Scroll to Element on DOM Load ====>
function scrollToBottomElement() {
    const bottomElement = document.getElementById("end")
    if (bottomElement) {
        bottomElement.scrollIntoView()
    }
}

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(scrollToBottomElement, 700)
})

// <===== LocalStorage Functionality for Ctrl + Z ====>
// Function to push an item onto the stack in localStorage
function pushToStack(item) {
    let stack = localStorage.getItem("stack")
    if (!stack) {
        stack = []
    } else {
        stack = JSON.parse(stack)
    }

    stack.push(item)

    // Limit the stack to store up to 20 items
    const stackLimit = 20
    if (stack.length > stackLimit) {
        stack = stack.slice(-stackLimit) // Keep only the last 20 items
    }

    localStorage.setItem("stack", JSON.stringify(stack))
}

// Function to initialize the stack in localStorage
function initializeStack() {
    const stack = []
    localStorage.setItem("stack", JSON.stringify(stack))
}

function popFromStack() {
    let stack = localStorage.getItem("stack")
    if (stack) {
        stack = JSON.parse(stack)
        if (stack.length > 0) {
            const poppedItem = stack.pop() // Remove the most recent item
            localStorage.setItem("stack", JSON.stringify(stack))

            // Add the popped item to the RedoStack
            pushToRedoStack(poppedItem)
        }
    }
}

function peekAtStack() {
    let stack = localStorage.getItem("stack")
    if (stack) {
        stack = JSON.parse(stack)
        if (stack.length > 0) {
            return stack[stack.length - 1] // Return the top item
        }
    }
    return null // Return null if stack is empty or doesn't exist
}

//<===== Redo Stack =====>
// Function to push an item onto the RedoStack in localStorage
function pushToRedoStack(item) {
    let redoStack = localStorage.getItem("redoStack")
    if (!redoStack) {
        redoStack = []
    } else {
        redoStack = JSON.parse(redoStack)
    }

    redoStack.push(item)

    // Limit the RedoStack to store up to 20 items
    const redoStackLimit = 20
    if (redoStack.length > redoStackLimit) {
        redoStack = redoStack.slice(-redoStackLimit) // Keep only the last 20 items
    }

    localStorage.setItem("redoStack", JSON.stringify(redoStack))
}

// Function to initialize the RedoStack in localStorage
function initializeRedoStack() {
    const redoStack = []
    localStorage.setItem("redoStack", JSON.stringify(redoStack))
}

function popFromRedoStack() {
    let redoStack = localStorage.getItem("redoStack")
    if (redoStack) {
        redoStack = JSON.parse(redoStack)
        if (redoStack.length > 0) {
            redoStack.pop() // Remove the most recent item
            localStorage.setItem("redoStack", JSON.stringify(redoStack))
        }
    }
}

function peekAtRedoStack() {
    let redoStack = localStorage.getItem("redoStack")
    if (redoStack) {
        redoStack = JSON.parse(redoStack)
        if (redoStack.length > 0) {
            return redoStack[redoStack.length - 1] // Return the top item
        }
    }
    return null // Return null if stack is empty or doesn't exist
}
