import React, {useContext, useEffect, useState} from "react"
import {HashLink as Link} from "react-router-hash-link"
import {ThemeContext, HideSidebarContext, HideNavbarContext, HideSortbarContext} from "../App"
import leftArrow from "../assets/purple/leftArrow.png"
import leftArrowMagenta from "../assets/magenta/leftArrow.png"
import rightArrow from "../assets/purple/rightArrow.png"
import rightArrowMagenta from "../assets/magenta/rightArrow.png"
import upArrow from "../assets/purple/upArrow.png"
import upArrowMagenta from "../assets/magenta/upArrow.png"
import downArrow from "../assets/purple/downArrow.png"
import downArrowMagenta from "../assets/magenta/downArrow.png"
import upload from "../assets/purple/upload.png"
import uploadMagenta from "../assets/magenta/upload.png"
import download from "../assets/purple/download.png"
import downloadMagenta from "../assets/magenta/download.png"
import image from "../assets/purple/image.png"
import imageMagenta from "../assets/magenta/image.png"
import explicit from "../assets/purple/explicit.png"
import explicitMagenta from "../assets/magenta/explicit.png"
import $3d from "../assets/purple/3d.png"
import $3dMagenta from "../assets/magenta/3d.png"
import filters from "../assets/purple/filters.png"
import filtersMagenta from "../assets/magenta/filters.png"
import size from "../assets/purple/size.png"
import sizeMagenta from "../assets/magenta/size.png"
import sort from "../assets/purple/sort.png"
import sortMagenta from "../assets/magenta/sort.png"
import "../styles/sortbar.less"

const SortBar: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideSortbar, setHideSortbar} = useContext(HideSortbarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)

    const getLeftArrow = () => {
        if (theme.includes("magenta")) return hideSidebar ? rightArrowMagenta : leftArrowMagenta
        return hideSidebar ? rightArrow : leftArrow
    }

    const getUpArrow = () => {
        if (theme.includes("magenta")) return hideNavbar ? downArrowMagenta : upArrowMagenta
        return hideNavbar ? downArrow : upArrow
    }

    const getUpload = () => {
        if (theme.includes("magenta")) return uploadMagenta
        return upload
    }

    const getDownload = () => {
        if (theme.includes("magenta")) return downloadMagenta
        return download
    }

    const getImage = () => {
        if (theme.includes("magenta")) return imageMagenta
        return image
    }

    const getExplicit = () => {
        if (theme.includes("magenta")) return explicitMagenta
        return explicit
    }

    const get3D = () => {
        if (theme.includes("magenta")) return $3dMagenta
        return $3d
    }

    const getFilters = () => {
        if (theme.includes("magenta")) return filtersMagenta
        return filters
    }

    const getSize = () => {
        if (theme.includes("magenta")) return sizeMagenta
        return size
    }

    const getSort = () => {
        if (theme.includes("magenta")) return sortMagenta
        return sort
    }

    const hideTheSidebar = () => {
        setHideSidebar((prev: boolean) => !prev)
    }

    const hideTheNavbar = () => {
        setHideNavbar((prev: boolean) => !prev)
    }

    return (
        <div className={`sortbar ${hideSortbar ? "hide-sortbar" : ""} ${hideNavbar ? "sortbar-top" : ""} ${hideSortbar && hideNavbar && hideSidebar ? "translate-sortbar" : ""}`}>
            <div className="sortbar-left">
                <div className="sortbar-item">
                    <img className="sortbar-img" src={getLeftArrow()} onClick={() => hideTheSidebar()}/>
                </div>
                <div className="sortbar-item">
                    <img className="sortbar-img" src={getUpArrow()} onClick={() => hideTheNavbar()}/>
                </div>
                <div className="sortbar-item">
                    <img className="sortbar-img" src={getUpload()}/>
                    <span className="sortbar-text">Upload</span>
                </div>
                <div className="sortbar-item">
                    <img className="sortbar-img" src={getDownload()}/>
                    <span className="sortbar-text">Download</span>
                </div>
                <div className="sortbar-item">
                    <img className="sortbar-img" src={getImage()}/>
                    <span className="sortbar-text">Image</span>
                </div>
                <div className="sortbar-item">
                    <img className="sortbar-img" src={getExplicit()}/>
                    <span className="sortbar-text">Explicit</span>
                </div>
                <div className="sortbar-item">
                    <img className="sortbar-img" src={get3D()}/>
                    <span className="sortbar-text">3D</span>
                </div>
            </div>
            <div className="sortbar-right">
                <div className="sortbar-item">
                    <img className="sortbar-img" src={getFilters()}/>
                    <span className="sortbar-text">Filters</span>
                </div>
                <div className="sortbar-item">
                    <img className="sortbar-img" src={getSize()}/>
                    <span className="sortbar-text">Medium</span>
                </div>
                <div className="sortbar-item">
                    <img className="sortbar-img" src={getSort()}/>
                    <span className="sortbar-text">Cuteness</span>
                </div>
            </div>
        </div>
    )
}

export default SortBar