/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState} from "react"
import {useThemeSelector, useInteractionActions, useMiscDialogSelector, useMiscDialogActions,
useFlagSelector, useFlagActions, useCacheSelector, useSearchSelector} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

const DownloadDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {showDownloadDialog} = useMiscDialogSelector()
    const {setShowDownloadDialog} = useMiscDialogActions()
    const {postAmount} = useFlagSelector()
    const {posts} = useCacheSelector()
    const {sizeType} = useSearchSelector()
    const {setDownloadIDs, setDownloadFlag} = useFlagActions()
    const [offsetField, setOffsetField] = useState("")
    const [amountField, setAmountField] = useState("")
    const controls = useDragControls()

    useEffect(() => {
        setTimeout(() => {
            let offset = Math.floor(functions.util.round(postAmount * functions.dom.getScrollPercentAdjusted(sizeType), functions.render.getImagesPerRow(sizeType)))
            if (offset < 0) offset = 0
            let amount = postAmount - offset
            if (amount < 0) amount = 0
            setOffsetField(String(offset))
            setAmountField(String(amount))
        }, 500)
        const scrollHandler = () => {
            let offset = functions.util.round(postAmount * functions.dom.getScrollPercentAdjusted(sizeType), functions.render.getImagesPerRow(sizeType))
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
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [showDownloadDialog])

    const downloadImages = () => {
        if (!showDownloadDialog) return
        let start = Number(offsetField)
        let end = start + Math.min(Number(amountField), 50)
        if (Number.isNaN(start)) start = 0
        if (Number.isNaN(end)) end = 0
        if (start < 0) start = 0
        if (end < 0) end = 0
        const postArray = posts.slice(start, end)
        const newDownloadIDs = [] as string[]
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
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "250px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.buttons.download}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.offset}: </span>
                            <input className="dialog-input-taller" type="number" spellCheck={false} value={offsetField} onChange={(event) => setOffsetField(event.target.value)}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.amount}: </span>
                            <input className="dialog-input-taller" type="number" spellCheck={false} value={amountField} onChange={(event) => setAmountField(event.target.value)}/>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.download}</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }
    return null
}

export default DownloadDialog