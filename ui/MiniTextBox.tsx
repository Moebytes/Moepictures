import React, {useState, useEffect, useRef, forwardRef, useImperativeHandle} from "react"
import {useInteractionActions, useThemeSelector, useLayoutSelector, useCacheSelector,
useSessionSelector, useSessionActions} from "../store"
import functions from "../functions/Functions"
import highlight from "../assets/svg/highlight.svg"
import bold from "../assets/svg/bold.svg"
import italic from "../assets/svg/italic.svg"
import underline from "../assets/svg/underline.svg"
import strikethrough from "../assets/svg/strikethrough.svg"
import spoiler from "../assets/svg/spoiler.svg"
import link from "../assets/svg/link.svg"
import details from "../assets/svg/details.svg"
import hexcolor from "../assets/svg/hash.svg"
import codeblock from "../assets/svg/codeblock.svg"
import "./styles/minitextbox.less"

export interface MiniTextBoxRef {
    resolveReplacements: () => Promise<string>
    toggleEmojiDropdown: () => void
    togglePreviewMode: () => void
    getPreviewMode: () => boolean
    showError: (msg: string) => void
    clearError: () => void
}

interface Props {
    type: "comment" | "reply" | "message"
    text: string
    setText: (text: string) => void
    textRef: React.RefObject<HTMLTextAreaElement | null>
    emojiRef: React.RefObject<HTMLButtonElement | null>
    height?: number
    bio?: boolean
}

const MiniTextBox = forwardRef<MiniTextBoxRef, Props>((props, ref) => {
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setEnableDrag} = useInteractionActions()
    const {mobile} = useLayoutSelector()
    const {emojis} = useCacheSelector()
    const [error, setError] = useState(false)
    const [showEmojiDropdown, setShowEmojiDropdown] = useState(false)
    const [previewMode, setPreviewMode] = useState(false)
    const [previewText, setPreviewText] = useState("")
    const errorRef = useRef<HTMLSpanElement>(null)

    useImperativeHandle(ref, () => ({
        resolveReplacements: async () => {
            const replaced = await functions.jsx.linkReplacements(props.text, session, setSessionFlag)
            props.setText(replaced)
            return replaced
        },
        toggleEmojiDropdown: () => {
            setShowEmojiDropdown((prev: boolean) => !prev)
        },
        togglePreviewMode: () => {
            setPreviewMode((prev: boolean) => !prev)
        },
        getPreviewMode: () => {
            return previewMode
        },
        showError: async (msg: string) => {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = msg
        },
        clearError: () => {
            setError(false)
        }
    }))

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})
    
    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--titleButtons")
    }

    useEffect(() => {
        const updatePreviewText = async () => {
            const replaced = await functions.jsx.linkReplacements(props.text, session, setSessionFlag)
            setPreviewText(replaced)
        }
        updatePreviewText()
    }, [previewMode])

    const getEmojiMarginRight = () => {
        if (typeof document === "undefined") return "0px"
        let elementName = ".minitextbox-textarea"
        const bodyRect = document.querySelector(elementName)?.getBoundingClientRect()
        const rect = props.emojiRef.current?.getBoundingClientRect()
        if (!rect || !bodyRect) return "0px"
        const raw = bodyRect.right - rect.right
        let offset = -100
        if (props.bio) offset = 525
        if (mobile) offset -= 0
        return `${raw + offset}px`
    }

    const getEmojiMarginBottom = () => {
        if (typeof document === "undefined") return "0px"
        let elementName = ".minitextbox-textarea"
        const bodyRect = document.querySelector(elementName)?.getBoundingClientRect()
        const rect = props.emojiRef.current?.getBoundingClientRect()
        if (!rect || !bodyRect) return "0px"
        const raw = bodyRect.bottom - rect.bottom
        let offset = props.type === "comment" ? 100 : 160
        if (props.bio) offset = 410
        if (mobile) offset += 0
        return `${raw + offset}px`
    }

    const emojiGrid = () => {
        let rows = [] as React.ReactElement[]
        let rowAmount = 7
        for (let i = 0; i < Object.keys(emojis).length; i++) {
            let items = [] as React.ReactElement[]
            for (let j = 0; j < rowAmount; j++) {
                const k = (i*rowAmount)+j
                const key = Object.keys(emojis)[k]
                if (!key) break
                const appendText = () => {
                    props.setText(props.text + ` :${key}:`)
                    setShowEmojiDropdown(false)
                }
                items.push(
                    <img draggable={false} src={emojis[key]} className="minitextbox-emoji-big" onClick={appendText}/>
                )
            }
            if (items.length) rows.push(<div className="minitextbox-emoji-row">{items}</div>)
        }
        return (
            <div className={`minitextbox-emoji-grid ${showEmojiDropdown ? "" : "hide-minitextbox-emoji-grid"}`}
            onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}
            style={{marginRight: getEmojiMarginRight(), marginBottom: getEmojiMarginBottom()}}>
                {rows}
            </div>
        )
    }

    const getTextBox = () => {
        return (
            <div className="minitextbox-container" style={{width: props.bio ? "50%" : ""}}>
                <div className="minitextbox-textarea-buttons" style={{marginLeft: props.bio ? "0px" : "10px"}}>
                    <button className="minitextbox-textarea-button"><img src={getIcon(highlight)} onClick={() => functions.render.triggerTextboxButton(props.textRef.current, props.setText, "highlight")} style={{filter}}/></button>
                    <button className="minitextbox-textarea-button"><img src={getIcon(bold)} onClick={() => functions.render.triggerTextboxButton(props.textRef.current, props.setText, "bold")} style={{filter}}/></button>
                    <button className="minitextbox-textarea-button"><img src={getIcon(italic)} onClick={() => functions.render.triggerTextboxButton(props.textRef.current, props.setText, "italic")} style={{filter}}/></button>
                    <button className="minitextbox-textarea-button"><img src={getIcon(underline)} onClick={() => functions.render.triggerTextboxButton(props.textRef.current, props.setText, "underline")} style={{filter}}/></button>
                    <button className="minitextbox-textarea-button"><img src={getIcon(strikethrough)} onClick={() => functions.render.triggerTextboxButton(props.textRef.current, props.setText, "strikethrough")} style={{filter}}/></button>
                    <button className="minitextbox-textarea-button"><img src={getIcon(spoiler)} onClick={() => functions.render.triggerTextboxButton(props.textRef.current, props.setText, "spoiler")} style={{filter}}/></button>
                    <button className="minitextbox-textarea-button"><img src={getIcon(link)} onClick={() => functions.render.triggerTextboxButton(props.textRef.current, props.setText, "link")} style={{filter}}/></button>
                    <button className="minitextbox-textarea-button"><img src={getIcon(details)} onClick={() => functions.render.triggerTextboxButton(props.textRef.current, props.setText, "details")} style={{filter}}/></button>
                    <button className="minitextbox-textarea-button"><img src={getIcon(hexcolor)} onClick={() => functions.render.triggerTextboxButton(props.textRef.current, props.setText, "color")} style={{filter}}/></button>
                    <button className="minitextbox-textarea-button"><img src={getIcon(codeblock)} onClick={() => functions.render.triggerTextboxButton(props.textRef.current, props.setText, "code")} style={{filter}}/></button>
                </div>
                {previewMode ? <div className="minitextbox-preview" style={{marginLeft: props.bio ? "0px" : "10px"}}>{functions.jsx.renderText(previewText, emojis, props.type)}</div> : 
                <div style={{marginTop: "0px"}} className="minitextbox-row-start" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <textarea ref={props.textRef} className="minitextbox-textarea" style={{resize: "vertical", height: `${props.height ?? 140}px`, marginLeft: props.bio ? "0px" : "10px"}} 
                    spellCheck={false} value={props.text} onChange={(event) => props.setText(event.target.value)} 
                    onKeyDown={(event) => event.stopPropagation()}></textarea>
                </div>}
                {error ? <div className="minitextbox-validation-container"><span className="minitextbox-validation" ref={errorRef}></span></div> : null}
            </div>
        )
    }

    return (
        <>
        {getTextBox()}
        {emojiGrid()}
        </>
    )
})

export default MiniTextBox