import React, {useContext, useEffect, useRef, useState} from "react"
import {ThemeContext, EnableDragContext, BrightnessContext, ContrastContext, HueContext, SaturationContext, LightnessContext,
BlurContext, SharpenContext, PixelateContext, SessionContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import Slider from "react-slider"
import star from "../assets/purple/star.png"
import starMagenta from "../assets/magenta/star.png"
import starFavorited from "../assets/purple/starFavorited.png"
import starFavoritedMagenta from "../assets/magenta/starFavorited.png"
import download from "../assets/purple/download.png"
import downloadMagenta from "../assets/magenta/download.png"
import filters from "../assets/purple/filters.png"
import filtersMagenta from "../assets/magenta/filters.png"
import brightnessIcon from "../assets/purple/brightness.png"
import brightnessMagentaIcon from "../assets/magenta/brightness.png"
import contrastIcon from "../assets/purple/contrast.png"
import contrastMagentaIcon from "../assets/magenta/contrast.png"
import hueIcon from "../assets/purple/hue.png"
import hueMagentaIcon from "../assets/magenta/hue.png"
import saturationIcon from "../assets/purple/saturation.png"
import saturationMagentaIcon from "../assets/magenta/saturation.png"
import lightnessIcon from "../assets/purple/lightness.png"
import lightnessMagentaIcon from "../assets/magenta/lightness.png"
import blurIcon from "../assets/purple/blur.png"
import blurMagentaIcon from "../assets/magenta/blur.png"
import sharpenIcon from "../assets/purple/sharpen.png"
import sharpenMagentaIcon from "../assets/magenta/sharpen.png"
import pixelateIcon from "../assets/purple/pixelate.png"
import pixelateMagentaIcon from "../assets/magenta/pixelate.png"
import nextIcon from "../assets/purple/next.png"
import prevIcon from "../assets/purple/prev.png"
import nextIconMagenta from "../assets/magenta/next.png"
import prevIconMagenta from "../assets/magenta/prev.png"
import "./styles/postimageoptions.less"
import axios from "axios"

interface Props {
    img: string
    post?: any
    comicPages?: any
    download: () => void
    previous?: () => void
    next?: () => void
}

const PostImageOptions: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {brightness, setBrightness} = useContext(BrightnessContext)
    const {contrast, setContrast} = useContext(ContrastContext)
    const {hue, setHue} = useContext(HueContext)
    const {saturation, setSaturation} = useContext(SaturationContext)
    const {lightness, setLightness} = useContext(LightnessContext)
    const {pixelate, setPixelate} = useContext(PixelateContext)
    const {blur, setBlur} = useContext(BlurContext)
    const {sharpen, setSharpen} = useContext(SharpenContext)
    const {session, setSession} = useContext(SessionContext)
    const [favorited, setFavorited] = useState(false)
    const [showFilterDropdown, setShowFilterDropdown] = useState(false)
    const [downloadText, setDownloadText] = useState("")
    const filterRef = useRef(null) as any

    useEffect(() => {
        const getDLText = async () => {
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
        }
        getDLText()
    }, [props.img, props.comicPages])

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
            if (theme.includes("magenta")) return starFavoritedMagenta
            return starFavorited
        } else {
            if (theme.includes("magenta")) return starMagenta
            return star
        }
    }

    const getDownload = () => {
        if (theme.includes("magenta")) return downloadMagenta
        return download
    }

    const getFilters = () => {
        if (theme.includes("magenta")) return filtersMagenta
        return filters
    }

    const getBrightness = () => {
        if (theme.includes("magenta")) return brightnessMagentaIcon
        return brightnessIcon
    }

    const getContrast = () => {
        if (theme.includes("magenta")) return contrastMagentaIcon
        return contrastIcon
    }

    const getHue = () => {
        if (theme.includes("magenta")) return hueMagentaIcon
        return hueIcon
    }

    const getSaturation = () => {
        if (theme.includes("magenta")) return saturationMagentaIcon
        return saturationIcon
    }

    const getLightness = () => {
        if (theme.includes("magenta")) return lightnessMagentaIcon
        return lightnessIcon
    }

    const getBlur = () => {
        if (theme.includes("magenta")) return blurMagentaIcon
        return blurIcon
    }

    const getSharpen = () => {
        if (theme.includes("magenta")) return sharpenMagentaIcon
        return sharpenIcon
    }

    const getPixelate = () => {
        if (theme.includes("magenta")) return pixelateMagentaIcon
        return pixelateIcon
    }

    const getNextIcon = () => {
        if (theme.includes("magenta")) return nextIconMagenta
        return nextIcon
    }

    const getPrevIcon = () => {
        if (theme.includes("magenta")) return prevIconMagenta
        return prevIcon
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
        return `${raw + offset}px`
    }

    const getFilterMarginTop = () => {
        if (typeof document === "undefined") return "0px"
        const bodyRect = document.querySelector(".post-image-box")?.getBoundingClientRect()
        const rect = filterRef.current?.getBoundingClientRect()
        if (!rect || !bodyRect) return "0px"
        const raw = bodyRect.bottom - rect.bottom
        let offset = -225
        return `${raw + offset}px`
    }

    const updateFavorite = async () => {
        if (!props.post) return
        await axios.post("/api/favorite", {postID: props.post.postID, favorited}, {withCredentials: true})
    }

    useEffect(() => {
        updateFavorite()
    }, [favorited])

    return (
        <div className="post-image-options-container">
            <div className="post-image-options">
                <div className="post-image-options-left">
                    <div className="post-image-options-box" onClick={() => props.previous?.()} style={{marginRight: "15px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <img className="post-image-icon-small" src={getPrevIcon()}/>
                        <div className="post-image-text-small">Prev</div>
                    </div>
                    {session.username ?
                    <div className="post-image-options-box" onClick={() => setFavorited((prev) => !prev)} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <img className="post-image-icon" src={getStar()}/>
                        <div className={`post-image-text ${favorited ? "favorited" : ""}`}>{favorited ? "Favorited" : "Favorite"}</div>
                    </div> : null}
                </div>
                <div className="post-image-options-right">
                    <div className="post-image-options-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="post-image-text-alt">{downloadText}</div>
                    </div>
                    <div className="post-image-options-box" onClick={() => props.download?.()} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <img className="post-image-icon" src={getDownload()}/>
                        <div className="post-image-text">Download</div>
                    </div>
                    <div className="post-image-options-box" ref={filterRef} onClick={() => setShowFilterDropdown((prev) => !prev)} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <img className="post-image-icon" src={getFilters()}/>
                        <div className="post-image-text">Filters</div>
                    </div>
                    <div className="post-image-options-box" onClick={() => props.next?.()} style={{marginLeft: "25px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="post-image-text-small">Next</div>
                        <img className="post-image-icon-small" src={getNextIcon()}/>
                    </div>
                    <div className={`post-dropdown ${showFilterDropdown ? "" : "hide-post-dropdown"}`}
                    style={{marginRight: getFilterMarginRight(), marginTop: getFilterMarginTop()}}>
                        <div className="post-dropdown-row filters-row">
                            <img className="post-dropdown-img" src={getBrightness()}/>
                            <span className="post-dropdown-text">Brightness</span>
                            <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setBrightness(value)} min={60} max={140} step={1} value={brightness}/>
                        </div>
                        <div className="post-dropdown-row filters-row">
                            <img className="post-dropdown-img" src={getContrast()} style={{marginLeft: "7px", marginRight: "-7px"}}/>
                            <span className="post-dropdown-text">Contrast</span>
                            <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setContrast(value)} min={60} max={140} step={1} value={contrast}/>
                        </div>
                        <div className="post-dropdown-row filters-row">
                            <img className="post-dropdown-img" src={getHue()} style={{marginLeft: "20px", marginRight: "-20px"}}/>
                            <span className="post-dropdown-text">Hue</span>
                            <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setHue(value)} min={150} max={210} step={1} value={hue}/>
                        </div>
                        <div className="post-dropdown-row filters-row">
                            <img className="post-dropdown-img" src={getSaturation()}/>
                            <span className="post-dropdown-text">Saturation</span>
                            <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setSaturation(value)} min={60} max={140} step={1} value={saturation}/>
                        </div>
                        <div className="post-dropdown-row filters-row">
                            <img className="post-dropdown-img" src={getLightness()}/>
                            <span className="post-dropdown-text">Lightness</span>
                            <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setLightness(value)} min={60} max={140} step={1} value={lightness}/>
                        </div>
                        <div className="post-dropdown-row filters-row">
                            <img className="post-dropdown-img" src={getBlur()} style={{marginLeft: "20px", marginRight: "-20px"}}/>
                            <span className="post-dropdown-text">Blur</span>
                            <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setBlur(value)} min={0} max={2} step={0.1} value={blur}/>
                        </div>
                        <div className="post-dropdown-row filters-row">
                            <img className="post-dropdown-img" src={getSharpen()} style={{marginLeft: "8px", marginRight: "-8px"}}/>
                            <span className="post-dropdown-text">Sharpen</span>
                            <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setSharpen(value)} min={0} max={5} step={0.1} value={sharpen}/>
                        </div>
                        <div className="post-dropdown-row filters-row">
                            <img className="post-dropdown-img" src={getPixelate()}/>
                            <span className="post-dropdown-text">Pixelate</span>
                            <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setPixelate(value)} min={1} max={10} step={0.1} value={pixelate}/>
                        </div>
                        <div className="post-dropdown-row filters-row">
                            <button className="filters-button" onClick={() => resetFilters()}>Reset</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PostImageOptions