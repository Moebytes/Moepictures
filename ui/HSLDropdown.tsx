/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React from "react"
import Slider from "react-slider"
import functions from "../functions/Functions"
import LightIcon from "../assets/svg/light.svg"
import DarkIcon from "../assets/svg/dark.svg"
import {useThemeSelector, useThemeActions, useLayoutSelector, useLayoutActions} from "../store"
import {Themes} from "../types/Types"
import "./styles/hsldropdown.less"

interface Props {
    active: boolean
    top?: number
}

const HSLDropdown: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n, theme} = useThemeSelector()
    const {setTheme, setSiteHue, setSiteSaturation, setSiteLightness} = useThemeActions()
    const {setHideNavbar} = useLayoutActions()
    const {mobile} = useLayoutSelector()

    const lightChange = () => {
        let newTheme = ""
        if (theme.includes("light")) {
            newTheme = "dark"
        } else {
            newTheme = "light"
        }
        setTheme(newTheme as Themes)
    }

    const resetFilters = () => {
        setSiteHue(180)
        setSiteSaturation(100)
        setSiteLightness(50)
    }

    let style = mobile ? {top: "428px"} : {top: "30px"}
    if (typeof window !== "undefined") {
        let navbarHeight = functions.dom.navbarHeight()
        if (navbarHeight) style = {top: `${navbarHeight}px`}
    }
    if (props.top) style = {top: `${props.top}px`}

    return (
        <div className={`hsl-dropdown ${props.active ? "" : "hide-hsl-dropdown"}`} style={style} onMouseEnter={() => setHideNavbar(false)} onMouseLeave={() => setHideNavbar(true)}>
            <div className="hsl-dropdown-row">
                <span className="hsl-dropdown-text">{i18n.filters.hue}</span>
                <Slider className="hsl-dropdown-slider" trackClassName="hsl-dropdown-slider-track" thumbClassName="hsl-dropdown-slider-thumb" onChange={(value) => setSiteHue(value)} min={60} max={272} step={1} value={siteHue}/>
            </div>
            <div className="hsl-dropdown-row">
                <span className="hsl-dropdown-text">{i18n.filters.saturation}</span>
                <Slider className="hsl-dropdown-slider" trackClassName="hsl-dropdown-slider-track" thumbClassName="hsl-dropdown-slider-thumb" onChange={(value) => setSiteSaturation(value)} min={30} max={100} step={1} value={siteSaturation}/>
            </div>
            <div className="hsl-dropdown-row">
                <span className="hsl-dropdown-text">{i18n.filters.lightness}</span>
                <Slider className="hsl-dropdown-slider" trackClassName="hsl-dropdown-slider-track" thumbClassName="hsl-dropdown-slider-thumb" onChange={(value) => setSiteLightness(value)} min={35} max={65} step={1} value={siteLightness}/>
            </div>
            <div className="hsl-dropdown-row" style={{justifyContent: "space-evenly"}}>
                <button className="hsl-dropdown-button" onClick={() => resetFilters()}>{i18n.filters.reset}</button>
                <button className="hsl-dropdown-button" onClick={() => lightChange()}>
                    {theme.includes("light") ? 
                    <DarkIcon className="hsl-dropdown-button-icon"/> : 
                    <LightIcon className="hsl-dropdown-button-icon"/>}
                </button>
            </div>
        </div>
    )
}

export default HSLDropdown