import React, {useEffect, useContext, useState} from "react"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, ShowDownloadDialogContext, ImageAmountContext, 
ImagesContext, SizeTypeContext, DownloadURLsContext, DownloadFlagContext} from "../App"
import functions from "../structures/Functions"
import "./styles/downloaddialog.less"

const DownloadDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {showDownloadDialog, setShowDownloadDialog} = useContext(ShowDownloadDialogContext)
    const {imageAmount, setImageAmount} = useContext(ImageAmountContext)
    const {images, setImages} = useContext(ImagesContext)
    const {sizeType, setSizeType} = useContext(SizeTypeContext)
    const {downloadURLs, setDownloadURLs} = useContext(DownloadURLsContext)
    const {downloadFlag, setDownloadFlag} = useContext(DownloadFlagContext)
    const [offsetField, setOffsetField] = useState("")
    const [amountField, setAmountField] = useState("")

    useEffect(() => {
        document.title = "Moebooru: Download"
    }, [])

    useEffect(() => {
        setTimeout(() => {
            let offset = Math.floor(functions.round(imageAmount * functions.getScrollPercentAdjusted(sizeType), functions.getImagesPerRow(sizeType)))
            if (offset < 0) offset = 0
            let amount = imageAmount - offset
            if (amount < 0) amount = 0
            setOffsetField(String(offset))
            setAmountField(String(amount))
        }, 500)
        const scrollHandler = () => {
            let offset = functions.round(imageAmount * functions.getScrollPercentAdjusted(sizeType), functions.getImagesPerRow(sizeType))
            if (offset < 0) offset = 0
            let amount = imageAmount - offset
            if (amount < 0) amount = 0
            setOffsetField(String(offset))
            setAmountField(String(amount))
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [imageAmount, sizeType])

    useEffect(() => {
        if (showDownloadDialog) {
            document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.overflowY = "visible"
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
        const downloadArray = images.slice(start, end)
        const newDownloadURLs = [] as any
        for (let i = 0; i < downloadArray.length; i++) {
            const img = downloadArray[i]
            newDownloadURLs.push(img)
        }
        setDownloadURLs(newDownloadURLs)
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
            <div className="download-dialog">
                <div className="download-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="download-container">
                        <span className="download-dialog-title">Download</span>
                        <div className="download-dialog-row">
                            <span className="download-dialog-text">Offset: </span>
                            <input className="download-dialog-input" type="number" spellCheck={false} value={offsetField} onChange={(event) => setOffsetField(event.target.value)}/>
                        </div>
                        <div className="download-dialog-row">
                            <span className="download-dialog-text">Amount: </span>
                            <input className="download-dialog-input" type="number" spellCheck={false} value={amountField} onChange={(event) => setAmountField(event.target.value)}/>
                        </div>
                        <div className="download-dialog-row">
                            <button onClick={() => click("reject")} className="download-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="download-button">{"Download"}</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    return null
}

export default DownloadDialog