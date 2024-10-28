import React, {useContext, useEffect, useRef, useState} from "react"
import {ThemeContext, EnableDragContext, BrightnessContext, ContrastContext, HueContext, SaturationContext, LightnessContext,
BlurContext, SharpenContext, PixelateContext, SessionContext, MobileContext, TranslationModeContext, SiteHueContext,
SiteLightnessContext, SiteSaturationContext, SessionFlagContext, FormatContext, PostsContext, FavGroupIDContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import Slider from "react-slider"
import star from "../assets/icons/star.png"
import starFavorited from "../assets/icons/starFavorited.png"
import starGroup from "../assets/icons/stargroup.png"
import starGroupFavorited from "../assets/icons/stargroup-favorited.png"
import download from "../assets/icons/download.png"
import filters from "../assets/icons/filters.png"
import brightnessIcon from "../assets/icons/brightness.png"
import contrastIcon from "../assets/icons/contrast.png"
import hueIcon from "../assets/icons/hue.png"
import saturationIcon from "../assets/icons/saturation.png"
import lightnessIcon from "../assets/icons/lightness.png"
import blurIcon from "../assets/icons/blur.png"
import sharpenIcon from "../assets/icons/sharpen.png"
import pixelateIcon from "../assets/icons/pixelate.png"
import nextIcon from "../assets/icons/next.png"
import prevIcon from "../assets/icons/prev.png"
import cryptoFunctions from "../structures/CryptoFunctions"
import "./styles/postimageoptions.less"

interface Props {
    img?: string
    model?: string
    audio?: string
    post?: any
    comicPages?: any
    download: () => void
    previous?: () => void
    next?: () => void
    noFavorite?: boolean
}

const PostImageOptions: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {brightness, setBrightness} = useContext(BrightnessContext)
    const {contrast, setContrast} = useContext(ContrastContext)
    const {hue, setHue} = useContext(HueContext)
    const {saturation, setSaturation} = useContext(SaturationContext)
    const {lightness, setLightness} = useContext(LightnessContext)
    const {pixelate, setPixelate} = useContext(PixelateContext)
    const {blur, setBlur} = useContext(BlurContext)
    const {sharpen, setSharpen} = useContext(SharpenContext)
    const {translationMode, setTranslationMode} = useContext(TranslationModeContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [favorited, setFavorited] = useState(false)
    const [favGrouped, setFavGrouped] = useState(false)
    const [showFilterDropdown, setShowFilterDropdown] = useState(false)
    const [showFormatDropdown, setShowFormatDropdown] = useState(false)
    const [downloadText, setDownloadText] = useState("")
    const {format, setFormat} = useContext(FormatContext)
    const {posts, setPosts} = useContext(PostsContext)
    const {favGroupID, setFavGroupID} = useContext(FavGroupIDContext)
    const filterRef = useRef(null) as any
    const formatRef = useRef(null) as any

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        getFavorite()
        const savedDownloadText = localStorage.getItem("downloadText")
        if (savedDownloadText) setDownloadText(savedDownloadText)
        const savedFormat = localStorage.getItem("format")
        if (savedFormat) setFormat(savedFormat)
    }, [])

    useEffect(() => {
        localStorage.setItem("downloadText", downloadText)
        localStorage.setItem("format", format)
    }, [downloadText, format])

    useEffect(() => {
        const getDLText = async () => {
            if (props.img) {
                if (props.comicPages) {
                    let sizeTotal = 0
                    for (let i = 0; i < props.comicPages.length; i++) {
                        let {size} = await functions.imageDimensions(props.comicPages[i])
                        sizeTotal += size
                    }
                    setDownloadText(`${props.comicPages.length} pages (${functions.readableFileSize(sizeTotal)})`)
                } else {
                    let {width, height, size} = await functions.imageDimensions(props.img)
                    setDownloadText(`${width}x${height} (${functions.readableFileSize(size)})`)
                }
            } else if (props.model) {
                let {polycount, size} = await functions.modelDimensions(props.model)
                setDownloadText(`${functions.readablePolycount(polycount)} (${functions.readableFileSize(size)})`)
            } else if (props.audio) {
                let {duration, size} = await functions.audioDimensions(props.audio)
                setDownloadText(`${functions.formatSeconds(duration)} (${functions.readableFileSize(size)})`)
            }
        }
        getDLText()
    }, [props.img, props.model, props.audio, props.comicPages])

    const getFavorite = async () => {
        if (!props.post || !session.username) return
        const favorite = await functions.get("/api/favorite", {postID: props.post.postID}, session, setSessionFlag)
        setFavorited(favorite ? true : false)
    }

    const getFavgroup = async () => {
        if (!props.post || !session.username) return
        const favgroups = await functions.get("/api/favgroups", {postID: props.post.postID}, session, setSessionFlag)
        setFavGrouped(favgroups?.length ? true : false)
    }

    useEffect(() => {
        getFavorite()
        getFavgroup()
    }, [props.post, session])

    useEffect(() => {
        localStorage.setItem("brightness", brightness)
        localStorage.setItem("contrast", contrast)
        localStorage.setItem("hue", hue)
        localStorage.setItem("saturation", saturation)
        localStorage.setItem("lightness", lightness)
        localStorage.setItem("blur", blur)
        localStorage.setItem("sharpen", sharpen)
        localStorage.setItem("pixelate", pixelate)
    }, [brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate])

    const getStar = () => {
        if (favorited) {
            return starFavorited
        } else {
            return star
        }
    }

    const getStarGroup = () => {
        if (favGrouped) {
            return starGroupFavorited
        } else {
            return starGroup
        }
    }

    const resetFilters = () => {
        setBrightness(100)
        setContrast(100)
        setHue(180)
        setSaturation(100)
        setLightness(100)
        setBlur(0)
        setSharpen(0)
        setPixelate(1)
    }

    const getFilterMarginRight = () => {
        if (typeof document === "undefined") return "0px"
        const rect = filterRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = -120
        if (mobile) offset += 80
        if (translationMode) offset += 10
        return `${raw + offset}px`
    }

    const getFilterMarginTop = () => {
        if (typeof document === "undefined") return "0px"
        let elementName = ".post-image-box"
        if (props.model) elementName = ".post-model-box"
        if (props.audio) elementName = ".post-song-box"
        if (translationMode) elementName = ".translation-editor"
        const bodyRect = document.querySelector(elementName)?.getBoundingClientRect()
        const rect = filterRef.current?.getBoundingClientRect()
        if (!rect || !bodyRect) return "0px"
        const raw = bodyRect.bottom - rect.bottom
        let offset = -250
        if (mobile) offset += 20
        return `${raw + offset}px`
    }

    const getFormatMarginRight = () => {
        if (typeof document === "undefined") return "0px"
        const rect = formatRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = -20
        if (format === "png") offset += 2
        if (format === "webp") offset += 8
        if (format === "avif") offset += 4
        if (format === "svg") offset += 1
        if (mobile) offset += 15
        return `${raw + offset}px`
    }

    const getFormatMarginTop = () => {
        if (typeof document === "undefined") return "0px"
        let elementName = ".post-image-box"
        if (props.model) elementName = ".post-model-box"
        if (props.audio) elementName = ".post-song-box"
        if (translationMode) elementName = ".translation-editor"
        const bodyRect = document.querySelector(elementName)?.getBoundingClientRect()
        const rect = formatRef.current?.getBoundingClientRect()
        if (!rect || !bodyRect) return "0px"
        const raw = bodyRect.bottom - rect.bottom
        let offset = -150
        if (mobile) offset += 25
        return `${raw + offset}px`
    }

    const updateFavorite = async (value: boolean) => {
        if (!props.post || !session.username) return
        await functions.post("/api/favorite/update", {postID: props.post.postID, favorited: value}, session, setSessionFlag)
        functions.updateLocalFavorite(props.post.postID, value, posts)
        setFavorited(value)
    }

    const closeDropdowns = () => {
        setShowFilterDropdown(false)
        setShowFormatDropdown(false)
    }

    const toggleDropdown = (dropdown: string) => {
        if (dropdown === "format") {
            if (showFormatDropdown) {
                setShowFormatDropdown(false)
            } else {
                closeDropdowns()
                setShowFormatDropdown(true)
            }
        }
        if (dropdown === "filter") {
            if (showFilterDropdown) {
                setShowFilterDropdown(false)
            } else {
                closeDropdowns()
                setShowFilterDropdown(true)
            }
        }
    }

    useEffect(() => {
        if (showFormatDropdown) setShowFilterDropdown(false)
        if (showFilterDropdown) setShowFormatDropdown(false)
    }, [showFormatDropdown, showFilterDropdown])

    return (
        <div className="post-image-options-container">
            {mobile ? <>
            <div className="post-image-options">
                <div className="post-image-options-box" onClick={() => props.previous?.()} style={{marginRight: "25px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <img className="post-image-icon-small" src={prevIcon} style={{filter: getFilter()}}/>
                    {!session.username ? <div className="post-image-text-small">Prev</div> : null}
                </div>
                {session.username ?
                <div className="post-image-options-box" onClick={() => updateFavorite(!favorited)} style={{marginLeft: "-10px"}}
                onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <img className="post-image-icon" src={getStar()} style={{filter: favorited ? "" : getFilter()}}/>
                    <div className={`post-image-text ${favorited ? "favorited" : ""}`}>{favorited ? "Favorited" : "Favorite"}</div>
                </div> : null}
                {session.username ?
                <div className="post-image-options-box" onClick={() => setFavGroupID(props.post.postID)}
                onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <img className="post-image-icon" src={getStarGroup()} style={{filter: favGrouped ? "" : getFilter()}}/>
                    <div className={`post-image-text ${favGrouped ? "favgrouped" : ""}`}>Favgroup</div>
                </div> : null}
                <div className="post-image-options-box" onClick={() => props.next?.()} style={{marginLeft: "25px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="post-image-text-small">Next</div>
                    {!session.username ? <img className="post-image-icon-small" src={nextIcon} style={{filter: getFilter()}}/> : null}
                </div>
            </div>
            <div className="post-image-options">
                <div className="post-image-options-box" onClick={() => props.download?.()} style={{marginRight: "25px"}}
                onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <img className="post-image-icon" src={download} style={{filter: getFilter()}}/>
                    <div className="post-image-text">Download</div>
                </div>
                {props.post.type === "image" ? 
                <button className="post-image-button" ref={formatRef} onClick={() => toggleDropdown("format")}>
                {String(format).toUpperCase()}</button> : null}
                <div className="post-image-options-box" ref={filterRef} onClick={() => toggleDropdown("filter")} style={{marginLeft: "25px"}}
                onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <img className="post-image-icon" src={filters} style={{filter: getFilter()}}/>
                    <div className="post-image-text">Filters</div>
                </div>
            </div> </>
             :
            <div className="post-image-options">
                <div className="post-image-options-left">
                    <div className="post-image-options-box" onClick={() => props.previous?.()} style={{marginRight: "15px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <img className="post-image-icon-small" src={prevIcon} style={{filter: getFilter()}}/>
                        <div className="post-image-text-small">Prev</div>
                    </div>
                    {session.username && !props.noFavorite ?
                    <div className="post-image-options-box" onClick={() => updateFavorite(!favorited)} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <img className="post-image-icon" src={getStar()} style={{filter: favorited ? "" : getFilter()}}/>
                        <div className={`post-image-text ${favorited ? "favorited" : ""}`}>{favorited ? "Favorited" : "Favorite"}</div>
                    </div> : null}
                    {session.username && !props.noFavorite ?
                    <div className="post-image-options-box" onClick={() => setFavGroupID(props.post.postID)} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <img className="post-image-icon" src={getStarGroup()} style={{filter: favGrouped ? "" : getFilter()}}/>
                        <div className={`post-image-text ${favGrouped ? "favgrouped" : ""}`}>Favgroup</div>
                    </div> : null}
                </div>
                <div className="post-image-options-right">
                    <div className="post-image-options-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="post-image-text-alt">{downloadText}</div>
                    </div>
                    <div className="post-image-options-box" onClick={() => props.download?.()} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <img className="post-image-icon" src={download} style={{filter: getFilter()}}/>
                        <div className="post-image-text">Download</div>
                    </div>
                    {props.post.type === "image" ? 
                    <button className="post-image-button" ref={formatRef} onClick={() => toggleDropdown("format")}>
                    {String(format).toUpperCase()}</button> : null}
                    <div className="post-image-options-box" ref={filterRef} onClick={() => toggleDropdown("filter")} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <img className="post-image-icon" src={filters} style={{filter: getFilter()}}/>
                        <div className="post-image-text">Filters</div>
                    </div>
                    <div className="post-image-options-box" onClick={() => props.next?.()} style={{marginLeft: "25px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="post-image-text-small">Next</div>
                        <img className="post-image-icon-small" src={nextIcon} style={{filter: getFilter()}}/>
                    </div>
                </div>
            </div>}
            <div className={`format-dropdown ${showFormatDropdown ? "" : "hide-format-dropdown"}`} style={{marginRight: getFormatMarginRight(), marginTop: getFormatMarginTop()}}
            onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <button className="format-dropdown-button" onClick={() => {setFormat("jpg"); setShowFormatDropdown(false)}}>JPG</button>
                <button className="format-dropdown-button" onClick={() => {setFormat("png"); setShowFormatDropdown(false)}}>PNG</button>
                <button className="format-dropdown-button" onClick={() => {setFormat("webp"); setShowFormatDropdown(false)}}>WEBP</button>
                <button className="format-dropdown-button" onClick={() => {setFormat("avif"); setShowFormatDropdown(false)}}>AVIF</button>
                <button className="format-dropdown-button" onClick={() => {setFormat("jxl"); setShowFormatDropdown(false)}}>JXL</button>
                <button className="format-dropdown-button" onClick={() => {setFormat("svg"); setShowFormatDropdown(false)}}>SVG</button>
            </div>
            <div className={`post-dropdown ${showFilterDropdown ? "" : "hide-post-dropdown"}`}
            style={{marginRight: getFilterMarginRight(), marginTop: getFilterMarginTop()}}>
                <div className="post-dropdown-row filters-row">
                    <img className="post-dropdown-img" src={brightnessIcon} style={{filter: getFilter()}}/>
                    <span className="post-dropdown-text">Brightness</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setBrightness(value)} min={60} max={140} step={1} value={brightness}/>
                </div>
                <div className="post-dropdown-row filters-row">
                    <img className="post-dropdown-img" src={contrastIcon} style={{marginLeft: "7px", marginRight: "-7px", filter: getFilter()}}/>
                    <span className="post-dropdown-text">Contrast</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setContrast(value)} min={60} max={140} step={1} value={contrast}/>
                </div>
                <div className="post-dropdown-row filters-row">
                    <img className="post-dropdown-img" src={hueIcon} style={{marginLeft: "20px", marginRight: "-20px", filter: getFilter()}}/>
                    <span className="post-dropdown-text">Hue</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setHue(value)} min={150} max={210} step={1} value={hue}/>
                </div>
                <div className="post-dropdown-row filters-row">
                    <img className="post-dropdown-img" src={saturationIcon} style={{filter: getFilter()}}/>
                    <span className="post-dropdown-text">Saturation</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setSaturation(value)} min={60} max={140} step={1} value={saturation}/>
                </div>
                <div className="post-dropdown-row filters-row">
                    <img className="post-dropdown-img" src={lightnessIcon} style={{filter: getFilter()}}/>
                    <span className="post-dropdown-text">Lightness</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setLightness(value)} min={60} max={140} step={1} value={lightness}/>
                </div>
                <div className="post-dropdown-row filters-row">
                    <img className="post-dropdown-img" src={blurIcon} style={{marginLeft: "20px", marginRight: "-20px", filter: getFilter()}}/>
                    <span className="post-dropdown-text">Blur</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setBlur(value)} min={0} max={2} step={0.1} value={blur}/>
                </div>
                <div className="post-dropdown-row filters-row">
                    <img className="post-dropdown-img" src={sharpenIcon} style={{marginLeft: "8px", marginRight: "-8px", filter: getFilter()}}/>
                    <span className="post-dropdown-text">Sharpen</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setSharpen(value)} min={0} max={5} step={0.1} value={sharpen}/>
                </div>
                <div className="post-dropdown-row filters-row">
                    <img className="post-dropdown-img" src={pixelateIcon} style={{filter: getFilter()}}/>
                    <span className="post-dropdown-text">Pixelate</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setPixelate(value)} min={1} max={10} step={0.1} value={pixelate}/>
                </div>
                <div className="post-dropdown-row filters-row">
                    <button className="filters-button" onClick={() => resetFilters()}>Reset</button>
                </div>
            </div>
        </div>
    )
}

export default PostImageOptions