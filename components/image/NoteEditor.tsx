/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useReducer, useEffect, useRef, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useFilterSelector, useInteractionActions, useLayoutSelector,  
useThemeSelector, useSearchSelector, useSessionSelector, useSearchActions, 
useSessionActions, useActiveActions, useFlagActions, useNoteDialogSelector, 
useNoteDialogActions, useInteractionSelector, useFlagSelector} from "../../store"
import functions from "../../functions/Functions"
import {ShapeEditor, DrawLayer, wrapShape} from "react-shape-editor"
import NoteHistoryIcon from "../../assets/svg/history.svg"
import NoteOCRIcon from "../../assets/svg/ocr.svg"
import NoteSaveIcon from "../../assets/svg/save.svg"
import NoteClearIcon from "../../assets/svg/clear-all.svg"
import NoteCopyIcon from "../../assets/svg/copy-notes.svg"
import NotePasteIcon from "../../assets/svg/paste-notes.svg"
import TranslationENIcon from "../../assets/svg/english.svg"
import TranslationJAIcon from "../../assets/svg/japanese.svg"
import NoteEditIcon from "../../assets/svg/edit-note.svg"
import NoteViewIcon from "../../assets/svg/view-note.svg"
import NoteToggleOffIcon from "../../assets/svg/note-toggle-off.svg"
import {PostFull, PostHistory, UnverifiedPost, Note, BubbleData} from "../../types/Types"
import "./styles/noteeditor.less"

interface Props {
    post?: PostFull | PostHistory | UnverifiedPost
    img: string
    order?: number
    unverified?: boolean
    noteID?: string | null
    imageWidth: number
    imageHeight: number
    reader?: boolean
}

const CircleHandle = ({active, cursor, onMouseDown, onDoubleClick, scale, x, y}) => {
    const {noteDrawingEnabled} = useSearchSelector()
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const getBGColor = () => {
        return "rgba(255, 43, 188, 0.9)"
    }
    const getBGColorInactive = () => {
        return "rgba(255, 43, 188, 0.3)"
    }
    const size = Math.ceil(4 / scale)
    return (
        <circle fill={active ? getBGColor() : getBGColorInactive()}
        stroke={active ? "rgba(140, 33, 103, 1)" : "rgba(140, 33, 103, 0.3)"} strokeWidth={1 / scale}
        style={{cursor, opacity: active && noteDrawingEnabled ? "1" : "0", filter}} 
        cx={x} cy={-size*5} r={size} onMouseDown={onMouseDown} onDoubleClick={onDoubleClick}/>
    )
}

const RectHandle = ({active, cursor, onMouseDown, scale, x, y}) => {
    const {noteDrawingEnabled} = useSearchSelector()
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    
    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const getBGColor = () => {
        return "rgba(255, 43, 188, 0.9)"
    }
    const getBGColorInactive = () => {
        return "rgba(255, 43, 188, 0.3)"
    }
    const size = Math.ceil(7/scale)
    return (
        <rect fill={active ? getBGColor() : getBGColorInactive()}
        width={size} height={size} x={x - size / 2} y={y - size / 2}
        stroke={active ? "rgba(140, 33, 103, 1)" : "rgba(140, 33, 103, 0.3)"} strokeWidth={1 / scale}
        style={{cursor, opacity: active && noteDrawingEnabled ? "1" : "0", filter}} onMouseDown={onMouseDown}/>
    )
}

const splitTextIntoLines = (text: string, maxWidth: number, fontSize = 100, splitByWord = true) => {
    if (!text) return []
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")!
    context.font = `${fontSize}px sans-serif`

    let lines = [] as string[]
    let currentLine = ""
    const segments = splitByWord ? text.split(" ") : text.split("")

    for (let i = 0; i < segments.length; i++) {
        const testLine = currentLine ? (splitByWord ? `${currentLine} ${segments[i]}` : `${currentLine}${segments[i]}`) : segments[i]
        const testWidth = context.measureText(testLine).width
        if (testWidth <= maxWidth) {
            currentLine = testLine
        } else {
            if (currentLine) {
                lines.push(currentLine)
            }
            currentLine = segments[i]
        }
    }
    if (currentLine) {
        lines.push(currentLine)
    }
    return lines
}

const RectShape = wrapShape(({width, height, scale, onMouseEnter, onMouseMove, onMouseLeave, onDoubleClick, onMouseDown, onContextMenu,
    text, showTranscript, breakWord, overlay, fontSize, backgroundColor, textColor, backgroundAlpha,
    fontFamily, bold, italic, strokeColor, strokeWidth, borderRadius}) => {
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {session} = useSessionSelector()

    let filter = functions.color.filter({siteHue, siteSaturation, siteLightness})
    if (overlay && !session.forceNoteBubbles) filter = ""

    const getBGColor = () => {
        if (overlay && !session.forceNoteBubbles) return backgroundColor || "#ffffff"
        return "rgba(255, 43, 170, 0.1)"
    }
    const getStrokeColor = () => {
        if (overlay && !session.forceNoteBubbles) return backgroundColor || "#ffffff"
        return "rgba(255, 43, 170, 0.9)"
    }
    const getTextColor = () => {
        return textColor || "#000000"
    }
    const rectStrokeWidth = Math.ceil(1/scale)
    const rectStrokeArray = `${Math.ceil(4/scale)},${Math.ceil(4/scale)}` 

    let padding = ((fontSize || 100) / 5)
    const maxTextWidth = width - padding
    let lines = [] as string[]
    if (overlay && !session.forceNoteBubbles) {
        let size = (fontSize || 100) - (showTranscript ? Math.floor(fontSize / 4) : 0)
        lines = splitTextIntoLines(text, maxTextWidth, size, breakWord && !showTranscript)
    }
    const lineHeight = (fontSize || 100) + padding
    const totalTextHeight = lines.length * lineHeight
    const textStartY = (height - totalTextHeight) / 2 + lineHeight - padding

    return (
        <svg width={width} height={height} onMouseEnter={onMouseEnter} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} 
        onContextMenu={onContextMenu} onDoubleClick={onDoubleClick} onMouseDown={onMouseDown} style={{pointerEvents: "all"}}>
            <rect width={width} height={height} fill={getBGColor()} opacity={(backgroundAlpha ?? 100) / 100} stroke={getStrokeColor()} 
            strokeWidth={rectStrokeWidth} strokeDasharray={rectStrokeArray} style={{filter}} rx={borderRadius} ry={borderRadius}/>
            {lines.map((line, index) => (
                <text key={index} x="50%" y={textStartY + index * lineHeight} textAnchor="middle" fill={getTextColor()} fontSize={fontSize || 100}
                fontFamily={fontFamily || "Tahoma"} fontWeight={bold ? "bold" : "normal"} fontStyle={italic ? "italic" : "normal"}
                stroke={strokeColor || "#ffffff"} strokeWidth={strokeWidth ?? 0} paintOrder="stroke">
                    {line}
                </text>
            ))}
        </svg>
    )
})

const EmptyHandle = (props: any) => {
    return (<></>)
}

const CharacterRectHandle = ({active, cursor, onMouseDown, scale, x, y}) => {
    const {noteDrawingEnabled} = useSearchSelector()
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const [visible, setVisible] = useState(false)
    const [init, setInit] = useState(false)

    useEffect(() => {
        setTimeout(() => {
            if (init) {
                setVisible(active && noteDrawingEnabled)
            } else {
                setInit(true)
            }
        }, 500)
    }, [active, noteDrawingEnabled])

    let filter = functions.color.filter({siteHue, siteSaturation, siteLightness})
    const getBGColor = () => {
        return "rgba(0, 0, 0, 0)"
    }
    const getBGColorInactive = () => {
        return "rgba(255, 43, 170, 0.3)"
    }
    const size = Math.ceil(7/scale)
    return (
        <rect fill={active ? getBGColor() : getBGColorInactive()}
        width={size} height={size} x={x - size / 2} y={y - size / 2}
        stroke={active ? "rgba(245, 20, 132, 1)" : "rgba(245, 20, 132, 0.3)"} strokeWidth={1 / scale}
        style={{cursor, opacity:visible ? "1" : "0", filter}} onMouseDown={onMouseDown}/>
    )
}
const CharacterRectShape = wrapShape(({width, height, scale, onMouseEnter, onMouseMove, onMouseLeave, 
    onDoubleClick, onMouseDown, onContextMenu, bubbleToggle}) => {
    const {noteDrawingEnabled} = useSearchSelector()
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const [focus, setFocus] = useState(false)

    let filter = functions.color.filter({siteHue, siteSaturation, siteLightness})
    const getBGColor = () => {
        return "rgba(0, 0, 0, 0)"
    }
    const getStrokeColor = () => {
        let condition = bubbleToggle || (noteDrawingEnabled && focus)
        return condition ? "rgba(255, 43, 170, 0.9)" : "rgba(0, 0, 0, 0)"
    }

    const rectStrokeWidth = Math.ceil(1/scale)
    const rectStrokeArray = `${Math.ceil(4/scale)},${Math.ceil(4/scale)}` 

    return (
        <svg width={width} height={height} onMouseEnter={onMouseEnter} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} 
        onContextMenu={onContextMenu} onDoubleClick={onDoubleClick} onMouseDown={onMouseDown} onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)} tabIndex={0} style={{pointerEvents: "all"}}>
            <rect width={width} height={height} fill={getBGColor()} stroke={getStrokeColor()} 
            strokeWidth={rectStrokeWidth} strokeDasharray={rectStrokeArray} style={{filter}}/>
        </svg>
    )
})

const NoteEditor: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {enableDrag} = useInteractionSelector()
    const {setEnableDrag} = useInteractionActions()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setSidebarText, setActionBanner} = useActiveActions()
    const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate} = useFilterSelector()
    const {noteMode, noteDrawingEnabled, imageExpand, showTranscript} = useSearchSelector()
    const {setNoteMode, setNoteDrawingEnabled, setShowTranscript} = useSearchActions()
    const {pasteNoteFlag} = useFlagSelector()
    const {setRedirect, setPasteNoteFlag} = useFlagActions()
    const {editNoteFlag, editNoteID, editNoteData, saveNoteID, noteOCRDialog, noteOCRFlag} = useNoteDialogSelector()
    const {setEditNoteFlag, setEditNoteID, setEditNoteData, setSaveNoteID,
    setSaveNoteData, setSaveNoteOrder, setNoteOCRDialog, setNoteOCRFlag} = useNoteDialogActions()
    const [targetHash, setTargetHash] = useState("")
    const [img, setImg] = useState("")
    const [id, setID] = useState(0)
    const [items, setItems] = useState([] as Note[])
    const [activeIndex, setActiveIndex] = useState(-1)
    const [buttonHover, setButtonHover] = useState(false)
    const filtersRef = useRef<HTMLDivElement>(null)
    const lightnessRef = useRef<HTMLImageElement>(null)
    const overlayRef = useRef<HTMLImageElement>(null)
    const pixelateRef = useRef<HTMLCanvasElement>(null)
    const [bubbleToggle, setBubbleToggle] = useState(false)
    const [bubbleData, setBubbleData] = useState({} as BubbleData)
    const [shiftKey, setShiftKey] = useState(false)
    const [bubbleWidth, setBubbleWidth] = useState(bubbleData.width)
    const bubbleRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()

    const updateNotes = async () => {
        if (!props.post) return
        let notes = [] as Note[]
        if (props.unverified) {
            notes = await functions.http.get("/api/notes/unverified", {postID: props.post.postID}, session, setSessionFlag)
        } else if (props.noteID) {
            const history = await functions.http.get("/api/note/history", {postID: props.post.postID, historyID: props.noteID}, session, setSessionFlag)
            notes = history.flatMap((h) => h.notes)
        } else {
            notes = await functions.http.get("/api/notes", {postID: props.post.postID}, session, setSessionFlag, true)
        }
        notes = notes?.filter((n) => n.order === undefined || n.order === (props.order || 1))
        if (notes?.length) {
            let largestID = notes.reduce((prev, current) => {return Math.max(prev, current.id || 1)}, -Infinity)
            setItems(notes)
            setID(largestID)
            setNoteMode(true)
        } else {
            setItems([])
            setID(0)
            setNoteMode(false)
        }
    }

    useEffect(() => {
        updateNotes()
    }, [props.img, props.order, props.noteID, session])

    useEffect(() => {
        const keyDownListener = (event: KeyboardEvent) => {
            if (event.shiftKey) setShiftKey(true)
        }
        const keyUpListener = (event: KeyboardEvent) => {
            if (!event.shiftKey) setShiftKey(false)
        }
        const savedShowTranscript = localStorage.getItem("showTranscript")
        if (savedShowTranscript) setShowTranscript(savedShowTranscript === "true")
        window.addEventListener("keydown", keyDownListener)
        window.addEventListener("keyup", keyUpListener)
        return () => {
            window.removeEventListener("keydown", keyDownListener)
            window.removeEventListener("keyup", keyUpListener)
        }
    }, [])

    useEffect(() => {
        localStorage.setItem("showTranscript", String(showTranscript))
    }, [showTranscript])

    useEffect(() => {
        const getHash = async () => {
            if (!props.post) return
            let index = (props.order || 1) - 1
            const currentImg = props.post.images[index]
            if (typeof currentImg === "string") {
                const imgLink = await functions.link.getPostThumbnail(props.post, index, "massive", session)
                const decrypted = await functions.crypto.decryptThumb(imgLink, session)
                const arrayBuffer = await functions.http.getBuffer(decrypted)
                const hash = await functions.http.post("/api/misc/imghash", Object.values(new Uint8Array(arrayBuffer)), session, setSessionFlag)
                setTargetHash(hash)
            } else {
                setTargetHash(currentImg.hash)
            }
        }
        getHash()
    }, [props.post, props.order, session])

    let maxWidth = 1000
    let maxHeight = 1000

    if (typeof window !== "undefined") {
        maxWidth = mobile ? window.innerWidth - 20 : window.innerWidth - functions.dom.sidebarWidth() - 70
    }

    if (imageExpand) {
        maxHeight = 3740
    }

    let targetWidth = props.imageWidth
    let targetHeight = props.imageHeight

    let scale = targetWidth > targetHeight ? maxWidth / targetWidth : maxHeight / targetHeight
    if (mobile && targetWidth > maxWidth) scale =  maxWidth / targetWidth
    if (targetWidth * scale > maxWidth) scale = maxWidth / targetWidth

    const clearNotes = () => {
        if (!noteDrawingEnabled) return
        setItems([])
    }

    const copyNotes = () => {
        navigator.clipboard.writeText(JSON.stringify(items))
        setActionBanner("copy-notes")
    }

    const pasteNotes = async () => {
        const text = await navigator.clipboard.readText()
        const parsedNotes = JSON.parse(text)
        if (parsedNotes?.[0]) {
            const note = parsedNotes[0]
            if ("x" in note && "y" in note && 
                "width" in note && "height" in note) {
                setPasteNoteFlag(parsedNotes)
            }
        }
        setActionBanner("paste-notes")
    }

    useEffect(() => {
        if (pasteNoteFlag?.length) {
            setItems(pasteNoteFlag)
            setPasteNoteFlag(null)
        }
    }, [pasteNoteFlag])

    const deleteFocused = () => {
        if (!noteDrawingEnabled) return
        setItems((prev) => functions.util.insertAtIndex(prev, activeIndex, null).filter(Boolean))
    }

    const editTextDialog = () => {
        if (!noteDrawingEnabled) return
        if (editNoteID === null) {
            const item = items[activeIndex]
            setEditNoteData({
                translation: item.translation,
                transcript: item.transcript,
                overlay: item.overlay ?? editNoteData.overlay,
                fontSize: item.fontSize ?? editNoteData.fontSize,
                textColor: item.textColor ?? editNoteData.textColor,
                backgroundColor: item.backgroundColor ?? editNoteData.backgroundColor,
                backgroundAlpha: item.backgroundAlpha ?? editNoteData.backgroundAlpha,
                fontFamily: item.fontFamily ?? editNoteData.fontFamily,
                bold: item.bold ?? editNoteData.bold,
                italic: item.italic ?? editNoteData.italic,
                strokeColor: item.strokeColor ?? editNoteData.strokeColor,
                strokeWidth: item.strokeWidth ?? editNoteData.strokeWidth,
                breakWord: item.breakWord ?? editNoteData.breakWord,
                borderRadius: item.borderRadius ?? editNoteData.borderRadius,
                character: item.character ?? editNoteData.character,
                characterTag: item.characterTag ?? editNoteData.characterTag
            })
            setEditNoteID(activeIndex)
        } else {
            setEditNoteID(null)
        }
    }

    const editText = (index: number) => {
        setItems((prev) => {
            const item = {...prev[index]}
            item.imageWidth = item?.imageWidth || targetWidth
            item.imageHeight = item?.imageHeight || targetHeight
            item.imageHash = targetHash
            item.translation = editNoteData.translation
            item.transcript = editNoteData.transcript
            item.overlay = editNoteData.overlay
            item.fontSize = editNoteData.fontSize
            item.backgroundColor = editNoteData.backgroundColor
            item.textColor = editNoteData.textColor
            item.backgroundAlpha = editNoteData.backgroundAlpha
            item.fontFamily = editNoteData.fontFamily
            item.bold = editNoteData.bold
            item.italic = editNoteData.italic
            item.strokeColor = editNoteData.strokeColor
            item.strokeWidth = editNoteData.strokeWidth
            item.breakWord = editNoteData.breakWord
            item.borderRadius = editNoteData.borderRadius
            item.character = editNoteData.character
            item.characterTag = editNoteData.characterTag
            return functions.util.insertAtIndex(prev, index, item)
        })
    }

    useEffect(() => {
        if (editNoteID === null) return
        if (editNoteFlag) {
            editText(editNoteID)
            setEditNoteFlag(false)
            setEditNoteID(null)
        }
    }, [editNoteFlag])

    const saveTextDialog = () => {
        if (!props.post) return
        if (!session.username) {
            return setActionBanner("login-required")
        }
        if (!session.emailVerified) {
            return setActionBanner("verification-required")
        }
        setSaveNoteOrder(props.order || 1)
        setSaveNoteData(items)
        setSaveNoteID({post: props.post, unverified: props.unverified})
    }

    const getCurrentLink = async () => {
        if (!props.post) return props.img
        let index = (props.order || 1) - 1
        const image = props.post.images[index]
        const upscaledImage = props.post.upscaledImages?.[index] || image
        let currentImage = session.upscaledImages ? upscaledImage : image
        let img = ""
        if (typeof currentImage === "string") {
            img = await functions.link.getPostImage(props.post, index, session, session.upscaledImages)
        } else {
            img = functions.link.getImageLink(currentImage, session.upscaledImages)
        }
        return img
    }

    const ocrPage = async () => {
        const img = await getCurrentLink()
        const jpgURL = await functions.image.convertToFormat(img, "jpg")
        const arrayBuffer = await functions.http.getBuffer(jpgURL)
        const bytes = new Uint8Array(arrayBuffer)
        let result = await functions.http.post(`/api/misc/ocr`, Object.values(bytes), session, setSessionFlag).catch(() => null)
        if (Array.isArray(result)) {
            const copy = structuredClone(result)
            setItems(() => {
                let currentID = id
                const notes = copy.map((item) => {
                    currentID += 1
                    return {...item, id: currentID, imageHash: targetHash} as Note
                })
                setID(currentID)
                return notes
            })
        }
    }

    useEffect(() => {
        if (noteOCRFlag) {
            ocrPage().then(() => {
                setNoteOCRFlag(false)
                setNoteOCRDialog(false)
            })
        }
    }, [noteOCRFlag])

    const ocrDialog = () => {
        if (!session.username) {
            return setActionBanner("login-required")
        }
        if (!session.emailVerified) {
            return setActionBanner("verification-required")
        }
        setNoteOCRDialog(!noteOCRDialog)
    }

    const showHistory = () => {
        if (!props.post) return
        if (!session.username) {
            return setActionBanner("login-required")
        }
        if (!session.emailVerified) {
            return setActionBanner("verification-required")
        }
        navigate(`/note/history/${props.post.postID}/${props.post.slug}/${props.order || 1}`)
    }

    useEffect(() => {
        if (!bubbleToggle || !bubbleRef.current) return

        const bubble = bubbleRef.current

        const updateWidth = () => {
            const currentWidth = bubble.offsetWidth
            const requiredWidth = bubble.scrollWidth

            if (requiredWidth > currentWidth && requiredWidth !== bubbleWidth) {
                setBubbleWidth(requiredWidth)
            } else if (requiredWidth <= bubbleData.width && bubbleWidth !== bubbleData.width) {
                setBubbleWidth(bubbleData.width)
            }
        }

        const scrollHandler = () => {
            if (bubbleToggle) setBubbleToggle(false)
        }

        const observer = new ResizeObserver(updateWidth)
        observer.observe(bubble)
        updateWidth()
        window.addEventListener("scroll", scrollHandler)
        return () => {
            observer.disconnect()
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [bubbleToggle, bubbleData.width, bubbleWidth])

    const getBubbleText = () => {
        if (shiftKey) return showTranscript ? bubbleData.translation : bubbleData.transcript
        return showTranscript ? bubbleData.transcript : bubbleData.translation
    }

    const bubbleJSX = () => {
        if (bubbleToggle) {
            if (bubbleData.character) {
                return (
                    <div className="note-character-bubble" ref={bubbleRef} style={{width: `${bubbleWidth}px`, 
                    minHeight: "25px", left: `${bubbleData.x}px`, top: `${bubbleData.y}px`}}>
                        {bubbleData.characterTag?.replaceAll("-", " ")}
                    </div>
                )
            } else {
                return (
                    <div className="note-bubble" ref={bubbleRef} style={{width: `${bubbleWidth}px`, minHeight: "25px", left: `${bubbleData.x}px`, 
                        top: `${bubbleData.y}px`, fontFamily: bubbleData.fontFamily || "Tahoma", fontSize: `${(bubbleData.fontSize || 100) / 5}px`,
                        fontWeight: bubbleData.bold ? "bold" : "normal", fontStyle: bubbleData.italic ? "italic" : "normal"}}>
                        {getBubbleText()}
                    </div>
                )
            }
        }
    }

    if (!targetWidth || !targetHeight) return null

    return (
        <div className="note-editor" style={{display: noteMode ? "flex" : "none", marginTop: props.reader ? "0px" : "20px", marginBottom: props.reader ? "0px" : "20px"}}>
            <div className="note-editor-filters" ref={filtersRef} onMouseDown={() => {if (enableDrag) setEnableDrag(false)}}>
                <div className={`note-editor-buttons ${buttonHover ? "show-note-buttons" : ""}`} onMouseEnter={() => setButtonHover(true)} onMouseLeave={() => setButtonHover(false)}>
                    {!props.unverified ? <NoteHistoryIcon className="note-editor-button" onClick={() => showHistory()}/> : null}
                    <NoteOCRIcon className="note-editor-button" onClick={() => ocrDialog()}/>
                    <NoteSaveIcon className="note-editor-button" onClick={() => saveTextDialog()}/>
                    <NoteClearIcon className="note-editor-button" onClick={() => clearNotes()}/>
                    <NoteCopyIcon className="note-editor-button" onClick={() => copyNotes()}/>
                    <NotePasteIcon className="note-editor-button" onClick={() => pasteNotes()}/>
                    {showTranscript ?
                    <TranslationJAIcon className="note-editor-button" style={{height: "22px"}} onClick={() => setShowTranscript(!showTranscript)}/> :
                    <TranslationENIcon className="note-editor-button" style={{height: "22px"}} onClick={() => setShowTranscript(!showTranscript)}/>}
                    {noteDrawingEnabled ?
                    <NoteEditIcon className="note-editor-button" onClick={() => setNoteDrawingEnabled(!noteDrawingEnabled)}/> :
                    <NoteViewIcon className="note-editor-button" onClick={() => setNoteDrawingEnabled(!noteDrawingEnabled)}/>}
                    <NoteToggleOffIcon className="note-editor-button" onClick={() => setNoteMode(false)}/>
                </div>
                {bubbleJSX()}
                <ShapeEditor vectorWidth={targetWidth} vectorHeight={targetHeight} scale={scale} style={{pointerEvents: noteDrawingEnabled ? "all" : "none"}}>
                    <DrawLayer onAddShape={({x, y, width, height}) => {
                        if (!noteDrawingEnabled) return
                        setItems((prev) => {
                            setID(id + 1)
                            return [...prev, {id: id + 1, x, y, width, height, imageWidth: targetWidth, rotation: 0,
                            imageHeight: targetHeight, imageHash: targetHash, transcript: "", translation: ""} as Note]
                        })
                    }} DrawPreviewComponent={RectShape}/>
                    {items.map((item: Note, index: number) => {
                        let {id, height, width, x, y, fontSize, strokeWidth, borderRadius} = item

                        const imageWidth = item.imageWidth || targetWidth
                        const imageHeight = item.imageHeight || targetHeight

                        const newWidth = (width / imageWidth) * targetWidth
                        const newHeight = (height / imageHeight) * targetHeight
                        const newX = (x / imageWidth) * targetWidth
                        const newY = (y / imageHeight) * targetHeight

                        const newFontSize = (fontSize / imageHeight) * targetHeight
                        const newStrokeWidth = (strokeWidth / imageHeight) * targetHeight
                        const newBorderRadius = (borderRadius / imageHeight) * targetHeight

                        let rotationSpeed = targetWidth / 2000
                        if (session.upscaledImages) rotationSpeed *= 10

                        const insertItem = (newRect: BubbleData) => {
                            if (!noteDrawingEnabled) return

                            const storedWidth = item.imageWidth || targetWidth
                            const storedHeight = item.imageHeight || targetHeight

                            let scaledRect = {
                                x: (newRect.x / targetWidth) * storedWidth,
                                y: (newRect.y / targetHeight) * storedHeight,
                                width: (newRect.width / targetWidth) * storedWidth,
                                height: (newRect.height / targetHeight) * storedHeight
                            }

                            setItems((prev) => functions.util.insertAtIndex(prev, index, {...item, ...scaledRect}))
                        }

                        const deleteItem = () => {
                            if (!noteDrawingEnabled) return
                            setItems((prev) => functions.util.insertAtIndex(prev, index, null))
                        }

                        const onContextMenu = (event: React.MouseEvent) => {
                            event.preventDefault()
                            if (!noteDrawingEnabled) {
                                if (item.character) return navigator.clipboard.writeText(item.characterTag)
                                navigator.clipboard.writeText(item.transcript)
                            } else {
                                deleteItem()
                            }
                        }

                        const onDoubleClick = () => {
                            if (!noteDrawingEnabled) return
                            setEditNoteData({
                                translation: item.translation,
                                transcript: item.transcript,
                                overlay: item.overlay ?? editNoteData.overlay,
                                fontSize: item.fontSize ?? editNoteData.fontSize,
                                textColor: item.textColor ?? editNoteData.textColor,
                                backgroundColor: item.backgroundColor ?? editNoteData.backgroundColor,
                                backgroundAlpha: item.backgroundAlpha ?? editNoteData.backgroundAlpha,
                                fontFamily: item.fontFamily ?? editNoteData.fontFamily,
                                bold: item.bold ?? editNoteData.bold,
                                italic: item.italic ?? editNoteData.italic,
                                strokeColor: item.strokeColor ?? editNoteData.strokeColor,
                                strokeWidth: item.strokeWidth ?? editNoteData.strokeWidth,
                                breakWord: item.breakWord ?? editNoteData.breakWord,
                                borderRadius: item.borderRadius ?? editNoteData.borderRadius,
                                character: item.character ?? editNoteData.character,
                                characterTag: item.characterTag ?? editNoteData.characterTag
                            })
                            setEditNoteID(index)
                        }

                        const onMouseEnter = (event: React.MouseEvent<SVGRectElement>) => {
                            if (item.overlay && !session.forceNoteBubbles) return
                            if (item.character) {
                                if (!item.characterTag) return setBubbleToggle(false)
                            } else {
                                if (!item.transcript && !item.translation) return setBubbleToggle(false)
                            }
                            const bounds = (event.target as SVGRectElement).getBoundingClientRect()
                            
                            let width = Math.floor(bounds.width * 2)
                            if (width > bounds.width) width = bounds.width
                            if (width < 125) width = 125

                            let height = Math.floor(bounds.height / 2)
                            if (height < 25) height = 25

                            let yTop = bounds.top - 30
                            let yBottom = bounds.bottom + 5

                            const id = item.id ?? Number(item.noteID)
                            if (item.character) {
                                setBubbleData({id, x: bounds.left, y: yTop, width, height, character: item.character, characterTag: item.characterTag})
                            } else {
                                setBubbleData({id, x: bounds.left, y: yBottom, width, height, transcript: item.transcript, translation: item.translation,
                                fontFamily: item.fontFamily, fontSize: item.fontSize, bold: item.bold, italic: item.italic})
                            }
                            setBubbleWidth(width)
                            setBubbleToggle(true)
                        }

                        const onMouseMove = (event: React.MouseEvent<SVGRectElement>) => {
                            if (item.overlay && !session.forceNoteBubbles) return
                            if (item.character) {
                                if (!item.characterTag) return setBubbleToggle(false)
                            } else {
                                if (!item.transcript && !item.translation) return setBubbleToggle(false)
                            }
                            const bounds = (event.target as SVGRectElement).getBoundingClientRect()

                            let width = Math.floor(bounds.width * 2)
                            if (width > bounds.width) width = bounds.width
                            if (width < 125) width = 125

                            let height = Math.floor(bounds.height / 2)
                            if (height < 25) height = 25

                            let yTop = bounds.top - 30
                            let yBottom = bounds.bottom + 5

                            const id = item.id ?? Number(item.noteID)
                            if (item.character) {
                                setBubbleData({id, x: bounds.left, y: yTop, width, height, character: item.character, characterTag: item.characterTag})
                            } else {
                                setBubbleData({id, x: bounds.left, y: yBottom, width, height, transcript: item.transcript, translation: item.translation,
                                fontFamily: item.fontFamily, fontSize: item.fontSize, bold: item.bold, italic: item.italic})
                            }
                            setBubbleWidth(width)
                        }

                        const onMouseLeave = () => {
                            setBubbleToggle(false)
                        }

                        const onMouseDown = (event: React.MouseEvent) => {
                            if (!noteDrawingEnabled) {
                                event.stopPropagation()
                                if (item.character) {
                                    navigator.clipboard.writeText(item.characterTag)
                                } else {
                                    if (event.shiftKey) {
                                        navigator.clipboard.writeText(item.transcript)
                                    } else {
                                        navigator.clipboard.writeText(item.translation)
                                    }
                                }
                            }
                        }

                        const text = showTranscript ? item.transcript : item.translation

                        if (item.character) {
                            return (
                                <CharacterRectShape key={id} shapeId={String(id)} x={newX} y={newY} width={newWidth} height={newHeight}
                                onFocus={() => setActiveIndex(index)} keyboardTransformMultiplier={30} onChange={insertItem as any} 
                                onDelete={deleteItem} ResizeHandleComponent={CharacterRectHandle} RotateHandleComponent={EmptyHandle} onContextMenu={onContextMenu} 
                                onDoubleClick={onDoubleClick} onMouseEnter={onMouseEnter} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} 
                                onMouseDown={onMouseDown} bubbleToggle={bubbleToggle && (bubbleData.id === (item.id ?? Number(item.noteID)))}
                                />
                            )
                        } else {
                            return (
                                <RectShape key={id} shapeId={String(id)} x={newX} y={newY} width={newWidth} height={newHeight} rotation={item.rotation}
                                rotationSpeed={rotationSpeed} onFocus={() => setActiveIndex(index)} keyboardTransformMultiplier={30} onChange={insertItem as any} 
                                onDelete={deleteItem} ResizeHandleComponent={RectHandle} RotateHandleComponent={CircleHandle} onContextMenu={onContextMenu} 
                                onDoubleClick={onDoubleClick} onMouseEnter={onMouseEnter} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} 
                                onMouseDown={onMouseDown} text={text} showTranscript={showTranscript} overlay={item.overlay} fontSize={newFontSize} 
                                backgroundColor={item.backgroundColor} textColor={item.textColor} backgroundAlpha={item.backgroundAlpha} 
                                fontFamily={item.fontFamily} bold={item.bold} italic={item.italic} strokeColor={item.strokeColor} strokeWidth={newStrokeWidth} 
                                breakWord={item.breakWord} borderRadius={newBorderRadius}
                                />
                            )
                        }
                    })}
                </ShapeEditor>
            </div>
        </div>
    )
}

export default NoteEditor