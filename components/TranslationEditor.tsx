import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, EnableDragContext, SessionContext, BrightnessContext, ContrastContext, HueContext, SaturationContext, LightnessContext,
BlurContext, SharpenContext, PixelateContext, TranslationModeContext, EditTranslationIDContext, MobileContext, ShowSaveTranslationDialogContext,
EditTranslationFlagContext, EditTranslationTextContext, EditTranslationTranscriptContext, TranslationDrawingEnabledContext, ImageExpandContext,
SaveTranslationDataContext, SaveTranslationOrderContext, SiteHueContext, SiteLightnessContext, SiteSaturationContext, SessionFlagContext} from "../Context"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import {ShapeEditor, ImageLayer, DrawLayer, wrapShape} from "react-shape-editor"
import translationDelete from "../assets/icons/translation-delete.png"
import translationEdit from "../assets/icons/translation-edit.png"
import translationHistory from "../assets/icons/translation-history.png"
import translationSave from "../assets/icons/translation-save.png"
import translationText from "../assets/icons/translation-text.png"
import translationToggleOn from "../assets/icons/translation-toggle-on.png"
import translationToggleOff from "../assets/icons/translation-toggle-off.png"
import translationDeleteMagenta from "../assets/magenta/translation-delete.png"
import translationEditMagenta from "../assets/magenta/translation-edit.png"
import translationHistoryMagenta from "../assets/magenta/translation-history.png"
import translationSaveMagenta from "../assets/magenta/translation-save.png"
import translationTextMagenta from "../assets/magenta/translation-text.png"
import translationToggleOnMagenta from "../assets/magenta/translation-toggle-on.png"
import translationToggleOffMagenta from "../assets/magenta/translation-toggle-off.png"
import translationEN from "../assets/icons/translation-en.png"
import translationJA from "../assets/icons/translation-ja.png"
import translationENMagenta from "../assets/magenta/translation-en.png"
import translationJAMagenta from "../assets/magenta/translation-ja.png"
import "./styles/translationeditor.less"

interface Props {
    post?: any
    img: string
    order?: number
    unverified?: boolean
}

let isAnimatedWebP = false

const RectHandle = ({active, cursor, onMouseDown, scale, x, y}) => {
    const {translationDrawingEnabled, setTranslationDrawingEnabled} = useContext(TranslationDrawingEnabledContext)
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }
    const getBGColor = () => {
        return "rgba(89, 43, 255, 0.9)"
    }
    const getBGColorInactive = () => {
        return "rgba(89, 43, 255, 0.3)"
    }
    const size = Math.ceil(7/scale)
    return (
        <rect fill={active ? getBGColor() : getBGColorInactive()}
        width={size} height={size} x={x - size / 2} y={y - size / 2}
        stroke={active ? "rgba(53, 33, 140, 1)" : "rgba(53, 33, 140, 0.3)"} strokeWidth={1 / scale}
        style={{cursor, opacity: active && translationDrawingEnabled ? "1" : "0", filter: getFilter()}} onMouseDown={onMouseDown}/>
    )
}

const RectShape = wrapShape(({width, height, extraShapeProps, scale}) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }
    const getBGColor = () => {
        return "rgba(89, 43, 255, 0.1)"
    }
    const getStrokeColor = () => {
        return "rgba(89, 43, 255, 0.9)"
    }
    const strokeWidth = Math.ceil(1/scale)
    const strokeArray = `${Math.ceil(4/scale)},${Math.ceil(4/scale)}` 
    return (<rect width={width} height={height} fill={getBGColor()}  stroke={getStrokeColor()} stroke-width={strokeWidth} 
    stroke-dasharray={strokeArray} onMouseEnter={extraShapeProps.onMouseEnter} onMouseMove={extraShapeProps.onMouseMove} onMouseLeave={extraShapeProps.onMouseLeave} style={{filter: getFilter()}}
    onContextMenu={extraShapeProps.onContextMenu} onDoubleClick={extraShapeProps.onDoubleClick} onMouseDown={extraShapeProps.onMouseDown}/>)
})

const TranslationEditor: React.FunctionComponent<Props> = (props) => {
    const {mobile, setMobile} = useContext(MobileContext)
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {brightness, setBrightness} = useContext(BrightnessContext)
    const {contrast, setContrast} = useContext(ContrastContext)
    const {hue, setHue} = useContext(HueContext)
    const {saturation, setSaturation} = useContext(SaturationContext)
    const {lightness, setLightness} = useContext(LightnessContext)
    const {pixelate, setPixelate} = useContext(PixelateContext)
    const {blur, setBlur} = useContext(BlurContext)
    const {sharpen, setSharpen} = useContext(SharpenContext)
    const {translationMode, setTranslationMode} = useContext(TranslationModeContext)
    const {editTranslationFlag, setEditTranslationFlag} = useContext(EditTranslationFlagContext)
    const {editTranslationID, setEditTranslationID} = useContext(EditTranslationIDContext)
    const {editTranslationText, setEditTranslationText} = useContext(EditTranslationTextContext)
    const {editTranslationTranscript, setEditTranslationTranscript} = useContext(EditTranslationTranscriptContext)
    const {showSaveTranslationDialog, setShowSaveTranslationDialog} = useContext(ShowSaveTranslationDialogContext)
    const {saveTranslationData, setSaveTranslationData} = useContext(SaveTranslationDataContext)
    const {saveTranslationOrder, setSaveTranslationOrder} = useContext(SaveTranslationOrderContext)
    const {imageExpand, setImageExpand} = useContext(ImageExpandContext)
    const [imageWidth, setImageWidth] = useState(0)
    const [imageHeight, setImageHeight] = useState(0)
    const [img, setImg] = useState("")
    const [id, setID] = useState(0)
    const [items, setItems] = useState([]) as any
    const [activeIndex, setActiveIndex] = useState(-1)
    const {translationDrawingEnabled, setTranslationDrawingEnabled} = useContext(TranslationDrawingEnabledContext)
    const [buttonHover, setButtonHover] = useState(false)
    const filtersRef = useRef(null) as any
    const lightnessRef = useRef<HTMLImageElement>(null)
    const overlayRef = useRef<HTMLImageElement>(null)
    const pixelateRef = useRef<HTMLCanvasElement>(null)
    const [bubbleToggle, setBubbleToggle] = useState(false)
    const [bubbleData, setBubbleData] = useState({}) as any
    const [shiftKey, setShiftKey] = useState(false)
    const [showTranscript, setShowTranscript] = useState(false)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateTranslations = async () => {
        if (!props.post || props.unverified) return
        const translations = await functions.get("/api/translations", {postID: props.post.postID}, session, setSessionFlag)
        if (translations?.length) {
            const translation = translations.find((t: any) => t.order === (props.order || 1))
            if (translation?.data?.length) {
                let largestID = translation.data.reduce((prev: any, current: any) => {return Math.max(prev, current.id)}, -Infinity)
                setItems(translation.data)
                setID(largestID)
                setTranslationMode(true)
            } else {
                setItems([])
                setID(0)
            }
        }
    }

    useEffect(() => {
        updateTranslations()
    }, [props.img, props.order, session])

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

    const getTranslationShowTranscriptIcon = () => {
        return showTranscript ? translationJA : translationEN
    }

    useEffect(() => {
        const decryptImg = async () => {
            let url = props.img 
            isAnimatedWebP = false
            if (functions.isWebP(props.img)) {
                const arraybuffer = await fetch(props.img).then((r) => r.arrayBuffer())
                isAnimatedWebP = await functions.isAnimatedWebp(arraybuffer)
            }
            if (functions.isImage(props.img)) {
                url = await cryptoFunctions.decryptedLink(props.img)
            } else if (functions.isGIF(props.img) || isAnimatedWebP) {
                url = props.img
            } else if (functions.isVideo(props.img)) {
                url = await functions.videoThumbnail(props.img)
            } else if (functions.isAudio(props.img)) {
                url = await functions.songCover(props.img)
            } else if (functions.isModel(props.img)) {
                url = await functions.modelImage(props.img)
            }
            const base64 = await functions.linkToBase64(url)
            const img = await functions.createImage(base64)
            if (functions.isGIF(props.img) || isAnimatedWebP) {
                setImg(props.img)
                setImageWidth(img.width)
                setImageHeight(img.height)
            } else {
                setImg(base64)
                setImageWidth(img.width)
                setImageHeight(img.height)
            }
        }
        decryptImg()
    }, [props.img])

    useEffect(() => {
        if (!filtersRef.current) return
        const element = filtersRef.current
        let newContrast = contrast
        const image = img
        const sharpenOverlay = overlayRef.current
        const lightnessOverlay = lightnessRef.current
        if (!image || !sharpenOverlay || !lightnessOverlay) return
        if (sharpen !== 0) {
            const sharpenOpacity = sharpen / 5
            newContrast += 25 * sharpenOpacity
            sharpenOverlay.style.backgroundImage = `url(${image})`
            sharpenOverlay.style.filter = `blur(4px) invert(1) contrast(75%)`
            sharpenOverlay.style.mixBlendMode = "overlay"
            sharpenOverlay.style.opacity = `${sharpenOpacity}`
        } else {
            sharpenOverlay.style.backgroundImage = "none"
            sharpenOverlay.style.filter = "none"
            sharpenOverlay.style.mixBlendMode = "normal"
            sharpenOverlay.style.opacity = "0"
        }
        if (lightness !== 100) {
            const filter = lightness < 100 ? "brightness(0)" : "brightness(0) invert(1)"
            lightnessOverlay.style.filter = filter
            lightnessOverlay.style.opacity = `${Math.abs((lightness - 100) / 100)}`
        } else {
            lightnessOverlay.style.filter = "none"
            lightnessOverlay.style.opacity = "0"
        }
        element.style.filter = `brightness(${brightness}%) contrast(${newContrast}%) hue-rotate(${hue - 180}deg) saturate(${saturation}%) blur(${blur}px)`
    }, [brightness, contrast, hue, saturation, lightness, blur, sharpen])

    let maxWidth = mobile ? window.innerWidth - 20 : window.innerWidth - functions.sidebarWidth() - 70
    let maxHeight = 1000

    if (imageExpand) {
        maxHeight = 1797
    }

    let scale = imageWidth > imageHeight ? maxWidth / imageWidth : maxHeight / imageHeight
    if (mobile && imageWidth > maxWidth) scale =  maxWidth / imageWidth

    const imagePixelate = () => {
        if (!pixelateRef.current || !overlayRef.current) return
        const pixelateCanvas = pixelateRef.current
        const ctx = pixelateCanvas.getContext("2d") as any
        const imgWidth = Math.floor(imageWidth*scale)
        const imgHeight = Math.floor(imageHeight*scale)
        const landscape = imgWidth >= imgHeight
        ctx.clearRect(0, 0, pixelateCanvas.width, pixelateCanvas.height)
        pixelateCanvas.width = imgWidth
        pixelateCanvas.height = imgHeight
        const pixelWidth = imgWidth / pixelate 
        const pixelHeight = imgHeight / pixelate
        if (pixelate !== 1) {
            ctx.drawImage(overlayRef.current, 0, 0, pixelWidth, pixelHeight)
            if (landscape) {
                pixelateCanvas.style.width = `${imgWidth * pixelate}px`
                pixelateCanvas.style.height = "auto"
            } else {
                pixelateCanvas.style.width = "auto"
                pixelateCanvas.style.height = `${imgHeight * pixelate}px`
            }
            pixelateCanvas.style.opacity = "1"
        } else {
            pixelateCanvas.style.width = "none"
            pixelateCanvas.style.height = "none"
            pixelateCanvas.style.opacity = "0"
        }
    }

    useEffect(() => {
        setTimeout(() => {
            imagePixelate()
        }, 50)
    }, [img, pixelate])

    const deleteFocused = () => {
        if (!translationDrawingEnabled) return
        setItems((prev: any) => functions.insertAtIndex(prev, activeIndex, null).filter(Boolean))
    }

    const editTextDialog = () => {
        if (!translationDrawingEnabled) return
        if (editTranslationID === null) {
            setEditTranslationTranscript(items[activeIndex].transcript)
            setEditTranslationText(items[activeIndex].translation)
            setEditTranslationID(activeIndex)
        } else {
            setEditTranslationTranscript("")
            setEditTranslationText("")
            setEditTranslationID(null)
        }
    }

    const editText = (index: number, transcript: string, translation: string) => {
        setItems((prev: any) => {
            const item = prev[index]
            item.transcript = transcript
            item.translation = translation
            return prev
        })
    }

    useEffect(() => {
        if (editTranslationFlag) {
            editText(editTranslationID, editTranslationTranscript, editTranslationText)
            setEditTranslationText("")
            setEditTranslationTranscript("")
            setEditTranslationFlag(false)
            setEditTranslationID(null)
        }
    }, [editTranslationFlag])

    const saveTextDialog = () => {
        setSaveTranslationOrder(props.order || 1)
        setSaveTranslationData(items)
        setShowSaveTranslationDialog((prev: boolean) => !prev)
    }

    const getBubbleText = () => {
        if (shiftKey) return showTranscript ? bubbleData.translation : bubbleData.transcript
        return showTranscript ? bubbleData.transcript : bubbleData.translation
    }

    const showHistory = () => {
        history.push(`/translation/history/${props.post.postID}/${props.order || 1}`)
    }

    return (
        <div className="translation-editor" style={{display: translationMode ? "flex" : "none"}}>
            <div className="translation-editor-filters" ref={filtersRef} onMouseOver={() => {if (enableDrag) setEnableDrag(false)}}>
                <div className={`translation-editor-buttons ${buttonHover ? "show-translation-buttons" : ""}`} onMouseEnter={() => setButtonHover(true)} onMouseLeave={() => setButtonHover(false)}>
                    <img draggable={false} className="translation-editor-button" src={translationHistory} style={{filter: getFilter()}} onClick={() => showHistory()}/>
                    <img draggable={false} className="translation-editor-button" src={translationSave} style={{filter: getFilter()}} onClick={() => saveTextDialog()}/>
                    <img draggable={false} className="translation-editor-button" src={getTranslationShowTranscriptIcon()} style={{filter: getFilter()}} onClick={() => setShowTranscript((prev: boolean) => !prev)}/>
                    <img draggable={false} className="translation-editor-button" src={translationText} style={{filter: getFilter()}} onClick={() => editTextDialog()}/>
                    <img draggable={false} className="translation-editor-button" src={translationDelete} style={{filter: getFilter()}} onClick={() => deleteFocused()}/>
                    <img draggable={false} className="translation-editor-button" src={translationEdit} style={{filter: getFilter()}} onClick={() => setTranslationDrawingEnabled((prev: boolean) => !prev)}/>
                    <img draggable={false} className="translation-editor-button" src={translationToggleOff} style={{filter: getFilter()}} onClick={() => setTranslationMode(false)}/>
                </div>
                {bubbleToggle ? <div className="translation-bubble" style={{width: `${bubbleData.width}px`, minHeight: "25px", left: `${bubbleData.x}px`, top: `${bubbleData.y}px`}}>{getBubbleText()}</div> : null}
                <img draggable={false} className="post-lightness-overlay" ref={lightnessRef} src={img} style={{pointerEvents: "none", width: `${Math.floor(imageWidth*scale)}px`, height: `${Math.floor(imageHeight*scale)}px`}}/>
                <img draggable={false} className="post-sharpen-overlay" ref={overlayRef} src={img} style={{pointerEvents: "none", width: `${Math.floor(imageWidth*scale)}px`, height: `${Math.floor(imageHeight*scale)}px`}}/>
                <canvas draggable={false} className="post-pixelate-canvas" ref={pixelateRef} style={{pointerEvents: "none", width: `${Math.floor(imageWidth*scale)}px`, height: `${Math.floor(imageHeight*scale)}px`}}></canvas>
                <ShapeEditor vectorWidth={imageWidth} vectorHeight={imageHeight} scale={scale}>
                    <ImageLayer src={img}/>
                    <DrawLayer onAddShape={({x, y, width, height}) => {
                        if (!translationDrawingEnabled) return
                        setItems((prev: any) => {
                            setID(id + 1)
                            return [...prev, {id: id + 1, x, y, width, height, transcript: "", translation: ""}]
                        })
                    }} DrawPreviewComponent={RectShape}/>
                    {items.map((item: any, index: number) => {
                        const {id, height, width, x, y} = item

                        const insertItem = (newRect: any) => {
                            if (!translationDrawingEnabled) return
                            setItems((prev: any) => functions.insertAtIndex(prev, index, {...item, ...newRect}))
                        }

                        const deleteItem = () => {
                            if (!translationDrawingEnabled) return
                            setItems((prev: any) => functions.insertAtIndex(prev, index, null).filter(Boolean))
                        }

                        const onContextMenu = (event: React.MouseEvent) => {
                            event.preventDefault()
                            if (!translationDrawingEnabled) {
                                navigator.clipboard.writeText(item.transcript)
                            } else {
                                deleteItem()
                            }
                        }

                        const onDoubleClick = () => {
                            if (!translationDrawingEnabled) return
                            setEditTranslationTranscript(item.transcript)
                            setEditTranslationText(item.translation)
                            setEditTranslationID(index)
                        }

                        const onMouseEnter = (event: any) => {
                            if (!item.transcript && !item.translation) return setBubbleToggle(false)
                            const bounds = event.target.getBoundingClientRect()
                            let width = Math.floor(bounds.width * 2)
                            if (width > bounds.width) width = bounds.width
                            if (width < 125) width = 125
                            let height = Math.floor(bounds.height / 2)
                            if (height < 25) height = 25
                            setBubbleData({x: bounds.left, y: bounds.bottom+5, width, height, transcript: item.transcript, translation: item.translation})
                            setBubbleToggle(true)
                        }

                        const onMouseMove = (event: any) => {
                            if (!item.transcript && !item.translation) return setBubbleToggle(false)
                            const bounds = event.target.getBoundingClientRect()
                            let width = Math.floor(bounds.width * 2)
                            if (width > bounds.width) width = bounds.width
                            if (width < 125) width = 125
                            let height = Math.floor(bounds.height / 2)
                            if (height < 25) height = 25
                            setBubbleData({x: bounds.left, y: bounds.bottom+5, width, height, transcript: item.transcript, translation: item.translation})
                        }

                        const onMouseLeave = () => {
                            setBubbleToggle(false)
                        }

                        const onMouseDown = (event: React.MouseEvent) => {
                            if (!translationDrawingEnabled) {
                                event.stopPropagation()
                                if (event.shiftKey) {
                                    navigator.clipboard.writeText(item.transcript)
                                } else {
                                    navigator.clipboard.writeText(item.translation)
                                }
                            }
                        }

                        return (
                            <RectShape key={id} shapeId={id} x={x} y={y} width={width} height={height} onFocus={() => setActiveIndex(index)}
                            keyboardTransformMultiplier={30} onChange={insertItem} onDelete={deleteItem} ResizeHandleComponent={RectHandle}
                            extraShapeProps={{onContextMenu, onDoubleClick, onMouseEnter, onMouseMove, onMouseLeave, onMouseDown}}/>
                        )
                    })}
                </ShapeEditor>
            </div>
        </div>
    )
}

export default TranslationEditor