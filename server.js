const express = require("express")
const { marked } = require("marked")
const fs = require("fs")
const WebSocket = require("ws")
const bodyParser = require("body-parser")

const app = express()

app.use(express.static("public/static"))
app.use(bodyParser.json())

const wss = new WebSocket.Server({ noServer: true })

let lastModified = fs.statSync("./notes.md").mtime

wss.on("connection", (ws) => {
    fs.watch("./notes.md", (eventType, filename) => {
        if (eventType === "change") {
            const currentModified = fs.statSync("./notes.md").mtime
            if (currentModified > lastModified) {
                ws.send("refresh")
                lastModified = currentModified
            }
        }
    })
})

app.get("/", (req, res) => {
    fs.readFile("./public/index.html", "utf8", (err, htmlTemplate) => {
        if (err) {
            res.sendStatus(500)
            return
        }

        fs.readFile("./notes.md", "utf8", (err, notesContent) => {
            if (err) {
                res.sendStatus(500)
                return
            }

            // Check if notes content is empty or only whitespace
            const isEmpty = !notesContent || notesContent.trim().length === 0
            let contentToProcess = isEmpty
                ? '<span class="placeholder-text">double-click to type something here</span>'
                : notesContent

            if (!isEmpty) {
                // Define a regular expression to match '==' globally
                const regex = /==/g
                let count = 0

                // Replace '==' with <mark> or </mark> based on the count
                contentToProcess = notesContent.replace(regex, () => {
                    count++
                    return count % 2 === 1 ? "<mark>" : "</mark>"
                })
                contentToProcess = marked(contentToProcess)
            }

            const htmlWithNotes = htmlTemplate.replace(
                "{marked}",
                contentToProcess
            )

            res.send(htmlWithNotes)
        })
    })
})

app.get("/saved", (req, res) => {
    fs.readFile("./notes.md", "utf8", (err, notesContent) => {
        if (err) {
            res.sendStatus(500)
            return
        }

        // Check if notes content is empty or only whitespace
        const isEmpty = !notesContent || notesContent.trim().length === 0
        if (isEmpty) {
            res.send(
                '<span class="placeholder-text">type something here</span>'
            )
            return
        }

        // Define a regular expression to match '==' globally
        const regex = /==/g
        let count = 0

        // Replace '==' with <mark> or </mark> based on the count
        const markedNotesContent = notesContent.replace(regex, () => {
            count++
            return count % 2 === 1 ? "<mark>" : "</mark>"
        })

        res.send(marked(markedNotesContent))
    })
})

app.get("/fetch", (req, res) => {
    fs.readFile("./notes.md", "utf8", (err, data) => {
        if (err) {
            res.sendStatus(500)
            return
        }
        res.send(data)
    })
})

app.post("/save", (req, res) => {
    fs.writeFile("./notes.md", req.body.data, (err) => {
        if (err) {
            res.status(500).send("Error saving file")
        } else {
            res.status(200).send("File saved successfully")
        }
    })
})

const server = app.listen(3000, () => {
    console.log("Server is listening on port 3000")
    server.on("upgrade", (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit("connection", ws, request)
        })
    })
})
