import React, {useEffect, useContext, useState} from "react"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, ShowDownloadDialogContext, PostAmountContext, 
PostsContext, SizeTypeContext, DownloadIDsContext, DownloadFlagContext, HideTitlebarContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/dialog.less"
import Draggable from "react-draggable"

const DownloadDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {showDownloadDialog, setShowDownloadDialog} = useContext(ShowDownloadDialogContext)
    const {postAmount, setPostAmount} = useContext(PostAmountContext)
    const {posts, setPosts} = useContext(PostsContext)
    const {sizeType, setSizeType} = useContext(SizeTypeContext)
    const {downloadIDs, setDownloadIDs} = useContext(DownloadIDsContext)
    const {downloadFlag, setDownloadFlag} = useContext(DownloadFlagContext)
    const [offsetField, setOffsetField] = useState("")
    const [amountField, setAmountField] = useState("")

    useEffect(() => {
        document.title = "Download"
    }, [])

    useEffect(() => {
        setTimeout(() => {
            let offset = Math.floor(functions.round(postAmount * functions.getScrollPercentAdjusted(sizeType), functions.getImagesPerRow(sizeType)))
            if (offset < 0) offset = 0
            let amount = postAmount - offset
            if (amount < 0) amount = 0
            setOffsetField(String(offset))
            setAmountField(String(amount))
        }, 500)
        const scrollHandler = () => {
            let offset = functions.round(postAmount * functions.getScrollPercentAdjusted(sizeType), functions.getImagesPerRow(sizeType))
            if (offset < 0) offset = 0
            let amount = postAmount - offset
            if (amount < 0) amount = 0
            setOffsetField(String(offset))
            setAmountField(String(amount))
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [postAmount, sizeType])

    useEffect(() => {
        if (showDownloadDialog) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [showDownloadDialog])

    const downloadImages = () => {
        if (!showDownloadDialog) return
        let start = Number(offsetField)
        let end = start + Number(amountField) 
        if (Number.isNaN(start)) start = 0
        if (Number.isNaN(end)) end = 0
        if (start < 0) start = 0
        if (end < 0) end = 0
        const postArray = posts.slice(start, end)
        const newDownloadIDs = [] as any
        for (let i = 0; i < postArray.length; i++) {
            const post = postArray[i]
            if (!post) continue 
            newDownloadIDs.push(post.postID)
        }
        setDownloadIDs(newDownloadIDs)
        setDownloadFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            downloadImages()
        }
        setShowDownloadDialog(false)
    }

    if (showDownloadDialog) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "250px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Download</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Offset: </span>
                            <input className="dialog-input-taller" type="number" spellCheck={false} value={offsetField} onChange={(event) => setOffsetField(event.target.value)}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Amount: </span>
                            <input className="dialog-input-taller" type="number" spellCheck={false} value={amountField} onChange={(event) => setAmountField(event.target.value)}/>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Download"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default DownloadDialog