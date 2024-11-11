import React, {useContext, useEffect, useRef, useState, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {UploadDropFilesContext, ImageSearchFlagContext, SessionContext, SessionFlagContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import "./styles/draganddrop.less"

let showDrag = false
let timeout = null as any

const DragAndDrop: React.FunctionComponent = (props) => {
    const {uploadDropFiles, setUploadDropFiles} = useContext(UploadDropFilesContext)
    const {imageSearchFlag, setImageSearchFlag} = useContext(ImageSearchFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const [visible, setVisible] = useState(false)
    const [searchHover, setSearchHover] = useState(false)
    const [uploadHover, setUploadHover] = useState(false)
    const history = useHistory()

    const placebo = (event: any) => {
        event.preventDefault()
    }

    const dragOver = (event: any) => {
        event.preventDefault()
        setVisible(true)
    }

    const dragEnd = (event: any) => {
        event.preventDefault()
        clearTimeout(timeout)
        timeout = setTimeout(() => {
            if (!showDrag) setVisible(false) 
        }, 0)
    }

    useEffect(() => {
        window.addEventListener("dragover", placebo)
        window.addEventListener("dragenter", dragOver)
        window.addEventListener("dragleave", dragEnd)
        return () => {
            window.removeEventListener("dragover", placebo)
            window.removeEventListener("dragenter", dragOver)
            window.removeEventListener("dragleave", dragEnd)
        }
    }, [])

    const dragEnter = (event: React.DragEvent, type: string) => {
        event.preventDefault()
        // window.focus()
        showDrag = true
        if (type === "search") {
            setSearchHover(true)
        } else {
            setUploadHover(true)
        }
    }

    const dragLeave = (event: React.DragEvent, type: string) => {
        event.preventDefault()
        if (type === "search") {
            setSearchHover(false)
        } else {
            setUploadHover(false)
        }
    }

    const paste = (event: ClipboardEvent) => {
        const items = event.clipboardData?.items
        if (!items) return
        const files = [] as File[]
        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            if (item.type.startsWith("image")) {
                const file = item.getAsFile()
                if (file) files.push(file)
            }
        }

        if (history.location.pathname === "/upload" ||
        history.location.pathname === "/bulk-upload" ||
        history.location.pathname.includes("edit-post")) {
            uploadFiles(files)
        } else {
            searchFiles(files)
        }
    }

    useEffect(() => {
        if (!searchHover && !uploadHover) {
            showDrag = false
            setVisible(false)
        }
        window.addEventListener("paste", paste)
        return () => {
            window.removeEventListener("paste", paste)
        }
    }, [searchHover, uploadHover])

    const searchFiles = async (files: File[]) => {
        setSearchHover(false)
        setUploadHover(false)
        if (!files?.length) return
        let result = [] as any
        for (let i = 0; i < files.length; i++) {
            result.push(...await functions.imageSearch(files[i], session, setSessionFlag))
        }
        setImageSearchFlag(result)
        history.push("/posts")
    }

    const uploadFiles = (files: File[]) => {
        setSearchHover(false)
        setUploadHover(false)
        if (!files?.length) return
        if (history.location.pathname !== "/upload" &&
        history.location.pathname !== "/bulk-upload" &&
        !history.location.pathname.includes("edit-post")) history.push("/upload")
        setUploadDropFiles(files)
    }

    const searchDrop = async (event: React.DragEvent) => {
        event.preventDefault()
        const files = event.dataTransfer.files
        searchFiles(Array.from(files))
    }

    const uploadDrop = (event: React.DragEvent) => {
        event.preventDefault()
        const files = event.dataTransfer.files
        uploadFiles(Array.from(files))
    }

    return (
        <div className="dragdrop" style={{display: visible ? "flex" : "none"}}>
            <div className="dragdrop-container">
                <div className={`dragdrop-box ${searchHover ? "dragdrop-hover" : ""}`} onDrop={searchDrop}
                onDragEnter={(event) => dragEnter(event, "search")} 
                onDragLeave={(event) => dragLeave(event, "search")}>Search</div>
                <div className={`dragdrop-box ${uploadHover ? "dragdrop-hover" : ""}`} onDrop={uploadDrop}
                onDragEnter={(event) => dragEnter(event, "upload")} 
                onDragLeave={(event) => dragLeave(event, "upload")}>Upload</div>
            </div>
        </div>
    )
}

export default DragAndDrop