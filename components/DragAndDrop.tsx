import React, {useContext, useEffect, useRef, useState, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchDropFilesContext, UploadDropFilesContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import "./styles/draganddrop.less"

let showDrag = false
let timeout = null as any

const DragAndDrop: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {searchDropFiles, setSearchDropFiles} = useContext(SearchDropFilesContext)
    const {uploadDropFiles, setUploadDropFiles} = useContext(UploadDropFilesContext)
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

    
    useEffect(() => {
        if (!searchHover && !uploadHover) {
            showDrag = false
            setVisible(false)
        }
    }, [searchHover, uploadHover])

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

    const searchDrop = (event: React.DragEvent) => {
        event.preventDefault()
        setSearchHover(false)
        setUploadHover(false)
        const files = event.dataTransfer.files 
        if (!files?.[0]) return
        setSearchDropFiles(Array.from(files))
    }

    const uploadDrop = (event: React.DragEvent) => {
        event.preventDefault()
        setSearchHover(false)
        setUploadHover(false)
        const files = event.dataTransfer.files 
        if (!files?.[0]) return
        if (history.location.pathname !== "/upload") history.push("/upload")
        setUploadDropFiles(Array.from(files))
    }

    return (
        <div className="dragdrop" style={{display: visible ? "flex" : "none"}}>
            <div className="dragdrop-container">
                <div className={`dragdrop-box ${searchHover ? "dragdrop-hover" : ""}`} onDrop={searchDrop}
                onDragEnter={(event) => dragEnter(event, "search")} 
                onDragLeave={(event) => dragLeave(event, "search")}>
                    Search
                </div>
                <div className={`dragdrop-box ${uploadHover ? "dragdrop-hover" : ""}`} onDrop={uploadDrop}
                onDragEnter={(event) => dragEnter(event, "upload")} 
                onDragLeave={(event) => dragLeave(event, "upload")}>
                    Upload
                </div>
            </div>
        </div>
    )
}

export default DragAndDrop