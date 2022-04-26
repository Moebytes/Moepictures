import React, {useEffect, useContext, useState} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, EditTagIDContext, EditTagFlagContext, 
EditTagKeyContext, EditTagAliasesContext, EditTagImageContext, EditTagDescriptionContext, HideTitlebarContext} from "../Context"
import functions from "../structures/Functions"
import uploadIcon from "../assets/purple/upload.png"
import "./styles/edittagdialog.less"
import fileType from "magic-bytes.js"
import axios from "axios"

const EditTagDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {editTagID, setEditTagID} = useContext(EditTagIDContext)
    const {editTagFlag, setEditTagFlag} = useContext(EditTagFlagContext)
    const {editTagKey, setEditTagKey} = useContext(EditTagKeyContext)
    const {editTagImage, setEditTagImage} = useContext(EditTagImageContext)
    const {editTagDescription, setEditTagDescription} = useContext(EditTagDescriptionContext)
    const {editTagAliases, setEditTagAliases} = useContext(EditTagAliasesContext)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Edit Tag"
    }, [])

    useEffect(() => {
        if (editTagID) {
            document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [editTagID])

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            setEditTagFlag(true)
        } else {
            setEditTagID(null)
        }
    }

    const uploadTagImg = async (event: any) => {
        const file = event.target.files?.[0]
        if (!file) return
        const fileReader = new FileReader()
        await new Promise<void>((resolve) => {
            fileReader.onloadend = async (f: any) => {
                let bytes = new Uint8Array(f.target.result)
                const result = fileType(bytes)?.[0]
                const jpg = result?.mime === "image/jpeg"
                const png = result?.mime === "image/png"
                const gif = result?.mime === "image/gif"
                if (jpg || png || gif) {
                    let url = URL.createObjectURL(file)
                    let croppedURL = ""
                    if (gif) {
                        const gifData = await functions.extractGIFFrames(url)
                        let frameArray = [] as any 
                        let delayArray = [] as any
                        for (let i = 0; i < gifData.length; i++) {
                            const canvas = gifData[i].frame as HTMLCanvasElement
                            const cropped = await functions.crop(canvas.toDataURL(), 1, true)
                            frameArray.push(cropped)
                            delayArray.push(gifData[i].delay)
                        }
                        const firstURL = await functions.crop(gifData[0].frame.toDataURL(), 1)
                        const {width, height} = await functions.imageDimensions(firstURL)
                        const buffer = await functions.encodeGIF(frameArray, delayArray, width, height)
                        const blob = new Blob([buffer])
                        croppedURL = URL.createObjectURL(blob)
                    } else {
                        croppedURL = await functions.crop(url, 1)
                    }
                    const arrayBuffer = await fetch(croppedURL).then((r) => r.arrayBuffer())
                    bytes = new Uint8Array(arrayBuffer)
                    const blob = new Blob([bytes])
                    url = URL.createObjectURL(blob)
                    setEditTagImage(url)
                }
                resolve()
            }
            fileReader.readAsArrayBuffer(file)
        })
        if (event.target) event.target.value = ""
    }

    if (editTagID) {
        return (
            <div className="edittag-dialog">
                <div className="edittag-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="edittag-container">
                        <span className="edittag-dialog-title">Edit Tag</span>
                        <div className="edittag-dialog-row">
                            <span className="edittag-dialog-text">Tag: </span>
                            <input className="edittag-dialog-input" type="text" spellCheck={false} value={editTagKey} onChange={(event) => setEditTagKey(event.target.value)}/>
                        </div>
                        <div className="edittag-dialog-row">
                            <span className="edittag-dialog-text">Image: </span>
                            <label htmlFor="tag-img" className="edittag-dialog-button">
                                <img className="edittag-button-img-small" src={uploadIcon}/>
                                <span className="edittag-button-text-small">Upload</span>
                            </label>
                            <input id="tag-img" type="file" onChange={(event) => uploadTagImg(event)}/>
                        </div>
                        {editTagImage ? 
                        <div className="edittag-dialog-row">
                            <img className="edittag-img" src={editTagImage}/>
                        </div>
                        : null}
                        <div className="edittag-dialog-row">
                            <span className="edittag-dialog-text">Description: </span>
                        </div>
                        <div className="edittag-dialog-row">
                            <textarea className="edittag-textarea" spellCheck={false} value={editTagDescription} onChange={(event) => setEditTagDescription(event.target.value)}></textarea>
                        </div>
                        <div className="edittag-dialog-row">
                            <span className="edittag-dialog-text">Aliases: </span>
                        </div>
                        <div className="edittag-dialog-row">
                            <textarea className="edittag-textarea" spellCheck={false} value={editTagAliases.join(" ")} onChange={(event) => setEditTagAliases(event.target.value.split(/ +/g))}></textarea>
                        </div>
                        <div className="edittag-dialog-row">
                            <button onClick={() => click("reject")} className="edittag-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="edittag-button">{"Edit"}</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    return null
}

export default EditTagDialog