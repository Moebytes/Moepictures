import React from "react"
import Slider from "react-slider"
import filterImage from "../assets/svg/filter-image.svg"
import filterMusic from "../assets/svg/filter-music.svg"
import brightnessIcon from "../assets/svg/brightness.svg"
import contrastIcon from "../assets/svg/contrast.svg"
import hueIcon from "../assets/svg/hue.svg"
import saturationIcon from "../assets/svg/saturation.svg"
import lightnessIcon from "../assets/svg/lightness.svg"
import blurIcon from "../assets/svg/blur.svg"
import sharpenIcon from "../assets/svg/sharpen.svg"
import pixelateIcon from "../assets/svg/pixelate.svg"
import splatterIcon from "../assets/svg/splatter.svg"
import lowpassIcon from "../assets/svg/lowpass.svg"
import highpassIcon from "../assets/svg/highpass.svg"
import reverbIcon from "../assets/svg/reverb.svg"
import delayIcon from "../assets/svg/delay.svg"
import phaserIcon from "../assets/svg/phaser.svg"
import bitcrushIcon from "../assets/svg/bitcrush.svg"
import functions from "../functions/Functions"
import {useThemeSelector, useFilterActions, useFilterSelector, useSessionSelector, 
useActiveActions, useActiveSelector, useLayoutSelector} from "../store"
import "./styles/filters.less"

interface Props {
    active: boolean
    right: number
    top: number
    origin?: string
    useMargin?: boolean
}

const Filters: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {session} = useSessionSelector()
    const {mobile} = useLayoutSelector()
    const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate, splatter,
    lowpass, highpass, reverb, delay, phaser, bitcrush} = useFilterSelector()
    const {setBrightness, setContrast, setHue, setSaturation, setLightness, setBlur, setSharpen, setPixelate, setSplatter,
    setLowpass, setHighpass, setReverb, setDelay, setPhaser, setBitcrush, resetImageFilters, resetAudioFilters} = useFilterActions()
    const {showMusicFilters} = useActiveSelector()
    const {setShowMusicFilters} = useActiveActions()

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "#FF579D")
    }

    const imageFiltersJSX = () => {
        return (
            <>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={getIcon(brightnessIcon)} style={{filter}}/>
                <span className="filter-dropdown-text">{i18n.filters.brightness}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setBrightness(value)} min={60} max={140} step={1} value={brightness}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={getIcon(contrastIcon)} style={{marginLeft: "7px", marginRight: "-7px", filter}}/>
                <span className="filter-dropdown-text">{i18n.filters.contrast}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setContrast(value)} min={60} max={140} step={1} value={contrast}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={getIcon(hueIcon)} style={{marginLeft: "20px", marginRight: "-20px", filter}}/>
                <span className="filter-dropdown-text">{i18n.filters.hue}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setHue(value)} min={150} max={210} step={1} value={hue}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={getIcon(saturationIcon)} style={{filter}}/>
                <span className="filter-dropdown-text">{i18n.filters.saturation}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setSaturation(value)} min={60} max={140} step={1} value={saturation}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={getIcon(lightnessIcon)} style={{filter}}/>
                <span className="filter-dropdown-text">{i18n.filters.lightness}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setLightness(value)} min={60} max={140} step={1} value={lightness}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={getIcon(blurIcon)} style={{marginLeft: "20px", marginRight: "-20px", filter}}/>
                <span className="filter-dropdown-text">{i18n.filters.blur}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setBlur(value)} min={0} max={2} step={0.1} value={blur}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={getIcon(sharpenIcon)} style={{marginLeft: "8px", marginRight: "-8px", filter}}/>
                <span className="filter-dropdown-text">{i18n.filters.sharpen}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setSharpen(value)} min={0} max={5} step={0.1} value={sharpen}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={getIcon(pixelateIcon)} style={{filter}}/>
                <span className="filter-dropdown-text">{i18n.filters.pixelate}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setPixelate(value)} min={1} max={10} step={0.1} value={pixelate}/>
            </div>
            {session.showR18 ? 
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={getIcon(splatterIcon)} style={{filter}}/>
                <span className="filter-dropdown-text">{i18n.filters.splatter}</span>
                <Slider className="filter-slider" trackClassName="filter-slider-track" thumbClassName="filter-slider-thumb" onChange={(value) => setSplatter(value)} min={0} max={100} step={1} value={splatter}/>
            </div> : null}
            <div className="filter-dropdown-row filter-row">
                <button className="filter-button" onClick={() => resetImageFilters()}>{i18n.filters.reset}</button>
                <button style={{marginLeft: "20px"}} className="filter-button" onClick={() => setShowMusicFilters(!showMusicFilters)}>
                    <img src={filterImage}/>
                </button>
            </div>
            </>
        )
    }

    const musicFiltersJSX = () => {
        return (
            <>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={getIcon(lowpassIcon)} style={{filter}}/>
                <span className="audio-filter-dropdown-text">{i18n.filters.lowpass}</span>
                <Slider className="audio-filter-slider" trackClassName="audio-filter-slider-track" thumbClassName="audio-filter-slider-thumb" onChange={(value) => setLowpass(value)} min={0} max={100} step={1} value={lowpass}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={getIcon(highpassIcon)} style={{filter}}/>
                <span className="audio-filter-dropdown-text">{i18n.filters.highpass}</span>
                <Slider className="audio-filter-slider" trackClassName="audio-filter-slider-track" thumbClassName="audio-filter-slider-thumb" onChange={(value) => setHighpass(value)} min={0} max={100} step={1} value={highpass}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={getIcon(reverbIcon)} style={{filter}}/>
                <span className="audio-filter-dropdown-text">{i18n.filters.reverb}</span>
                <Slider className="audio-filter-slider" trackClassName="audio-filter-slider-track" thumbClassName="audio-filter-slider-thumb" onChange={(value) => setReverb(value)} min={0} max={1} step={0.01} value={reverb}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={getIcon(delayIcon)} style={{filter}}/>
                <span className="audio-filter-dropdown-text">{i18n.filters.delay}</span>
                <Slider className="audio-filter-slider" trackClassName="audio-filter-slider-track" thumbClassName="audio-filter-slider-thumb" onChange={(value) => setDelay(value)} min={0} max={1} step={0.01} value={delay}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={getIcon(phaserIcon)} style={{filter}}/>
                <span className="audio-filter-dropdown-text">{i18n.filters.phaser}</span>
                <Slider className="audio-filter-slider" trackClassName="audio-filter-slider-track" thumbClassName="audio-filter-slider-thumb" onChange={(value) => setPhaser(value)} min={0} max={1} step={0.01} value={phaser}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <img className="filter-dropdown-img" src={getIcon(bitcrushIcon)} style={{filter}}/>
                <span className="audio-filter-dropdown-text">{i18n.filters.bitcrush}</span>
                <Slider className="audio-filter-slider" trackClassName="audio-filter-slider-track" thumbClassName="audio-filter-slider-thumb" onChange={(value) => setBitcrush(value)} min={0} max={100} step={1} value={bitcrush}/>
            </div>
            <div className="filter-dropdown-row filter-row">
                <button className="audio-filter-button" onClick={() => resetAudioFilters()}>{i18n.filters.reset}</button>
                <button style={{marginLeft: "20px"}} className="audio-filter-button" onClick={() => setShowMusicFilters(!showMusicFilters)}>
                    <img src={filterMusic}/>
                </button>
            </div>
            </>
        )
    }

    const getMarginRight = () => {
        let raw = props.right
        let offset = 0
        if (showMusicFilters) offset += 5
        return `${raw + offset}px`
    }

    const getMarginTop = () => {
        let raw = props.top
        let offset = 0
        if (props.origin === "bottom" && showMusicFilters) offset += 100
        if (mobile) offset += props.origin === "bottom" ? 60 : 0
        return `${raw + offset}px`
    }

    return (
        <div className={`filter-dropdown ${props.active ? "" : "hide-filter-dropdown"}`} 
        style={{marginRight: getMarginRight(), marginTop: getMarginTop(), transformOrigin: props.origin === "bottom" ? "bottom" : "top"}}>
                {showMusicFilters ? musicFiltersJSX() : imageFiltersJSX()}
        </div>
    )
}

export default Filters