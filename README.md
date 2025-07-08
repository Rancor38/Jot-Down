# Jot-Down Note-Taking App

A simple, collaborative note-taking web application inspired by Notion. This app allows you to edit, save, and view notes in Markdown, with real-time updates and basic highlighting features.

## Features

-   **Markdown Support:** Write notes in Markdown, rendered using the `marked` library.
-   **Highlighting:** Use `==highlight==` syntax to highlight text.
-   **Live Editing:** Double-click to edit notes. Changes are saved automatically.
-   **WebSocket Live Refresh:** Notes update in real-time across all connected clients.
-   **Placeholder Text:** When notes are empty, a placeholder prompts you to start typing.
-   **Undo/Redo:** Use `Cmd+Z`/`Cmd+Shift+Z` for undo/redo while editing.
-   **Tab Support:** Press Tab to insert spaces while editing.

## Usage

1. **Install dependencies:**
    ```sh
    npm install
    ```
2. **Start the server:**
    ```sh
    node server.js
    ```
3. **Open your browser:**
   Go to [http://localhost:3000](http://localhost:3000)

## File Structure

-   `server.js` - Express server with WebSocket support and Markdown rendering
-   `notes.md` - The main note file (Markdown)
-   `public/index.html` - Main HTML page
-   `public/static/script.js` - Frontend logic for editing, saving, and live updates
-   `public/static/styles.css` - App styling

## Editing Notes

-   **Double-click** the note area to start editing.
-   **Enter** creates a new line.
-   **Tab** inserts spaces.
-   **Cmd+Z / Cmd+Shift+Z** for undo/redo.
-   **Click "Hard Save & Format"** to save and re-render Markdown.

## Highlighting

Wrap text with `==` to highlight:  
`==this will be highlighted==`

## Placeholder

If `notes.md` is empty, a placeholder message appears:  
_"double-click to type something here"_

## License

MIT
