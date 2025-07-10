# Jot-Down Note-Taking App

A simple, modern note-taking React application inspired by Notion. This app allows you to edit, save, and view notes in Markdown, with local storage persistence and beautiful highlighting features.

## Features

-   **Markdown Support:** Write notes in Markdown, rendered using the `marked` library.
-   **Highlighting:** Use `==highlight==` syntax to highlight text.
-   **Live Editing:** Double-click to edit notes. Changes are saved automatically to localStorage.
-   **Local Storage:** Notes persist in your browser's local storage.
-   **Placeholder Text:** When notes are empty, a placeholder prompts you to start typing.
-   **Undo/Redo:** Use `Cmd+Z`/`Cmd+Shift+Z` for undo/redo while editing.
-   **Tab Support:** Press Tab to insert spaces while editing.
-   **File Operations:** Open and create new markdown files.

## Usage

1. **Install dependencies:**
    ```sh
    npm install
    ```
2. **Start the development server:**
    ```sh
    npm run dev
    ```
3. **Open your browser:**
   Go to [http://localhost:3000](http://localhost:3000)

## File Structure

-   `src/App.jsx` - Main React component with all note-taking functionality
-   `src/main.jsx` - React app entry point
-   `src/index.css` - App styling and Markdown CSS
-   `index.html` - Main HTML template
-   `vite.config.js` - Vite build configuration

## Build

To build for production:

```sh
npm run build
```

To preview the built app:

```sh
npm run preview
```

## Editing Notes

-   **Double-click** the note area to start editing.
-   **Enter** creates a new line.
-   **Tab** inserts spaces.
-   **Cmd+Z / Cmd+Shift+Z** for undo/redo.
-   **Click "Hard Save & Format"** to save and re-render Markdown.
-   **Click outside** the editing area to auto-save.

## Data Persistence

Notes are automatically saved to your browser's localStorage, so your work persists between sessions. You can also:

-   **Open** markdown files from your computer
-   **Create** new notes that will be saved locally

## Technology Stack

-   **React 18** - Modern React with hooks
-   **Vite** - Fast build tool and development server
-   **Marked** - Markdown parsing and rendering
-   **Local Storage** - Client-side data persistence

## Highlighting

Wrap text with `==` to highlight:  
`==this will be highlighted==`

## Placeholder

If your notes are empty, a placeholder message appears:  
_"double-click to type something here"_

## License

MIT
