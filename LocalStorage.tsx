/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect} from "react"
import {useThemeSelector, useThemeActions, useSearchSelector, useSearchActions, usePlaybackSelector, 
usePlaybackActions, useFilterSelector, useFilterActions, useLayoutSelector, useLayoutActions,
useCacheSelector, useCacheActions, useSessionSelector, useSessionActions} from "./store"
import {Themes, ImageFormat, PostType, PostRating, PostStyle, PostSize, PostSort} from "./types/Types"
import functions from "./functions/Functions"
import localforage from "localforage"

const lightColorList = {
    "--selection": "#ffe0f4",
    "--background": "#FFFFFF",

    "--titlebarBG": "#FFD6EB",
    "--moeTextA": "#FF5099",
    "--moeTextB": "#FF307F",
    "--titleText": "#FF579D",

    "--navbarBG": "#FFD6EB",
    "--navbarText": "#FF579D",

    "--sidebarBG": "#FFEFF7",
    "--sidebarText": "#000000",
    "--sidebarSearchBG": "#FFFFFF",
    "--sidebarSearchFocus": "#ff81c4",
    "--sidebarTitleText": "#FF2194",
    "--sidebarTextA": "#FF328B",
    "--sidebarTextB": "#ff4bb9",

    "--tagReadColor": "rgba(255, 87, 205, 0.5)",
    "--tagColor": "#ff57b9",
    "--text": "#000000",
    "--text-alt": "#ff3891",
    "--text-strong": "#FF16A6",
    "--inputBG": "#ffffff",
    "--inputBorder": "#000000",
    "--textBoxBorder": "#ff42b3",
    "--itemBorder": "rgba(255, 66, 179, 0.04)",
    "--bannerText": "#000000",

    "--sortbarBG": "rgba(255, 255, 255, 0.75)",
    "--sortbarText": "#000000",

    "--tooltipBG": "rgba(255, 240, 255, 0.7)",

    "--footerBG": "#FFD6EB",

    "--imageBorder": "#FF77CB",
    "--pageButton": "#FF93CB",
    "--drop-color1": "rgba(250, 112, 213, 0.7)",
    "--drop-color2": "rgba(252, 124, 194, 0.9)",
    "--binary": "#ffffff",
    "--selectBorder": "#ff73ce",
    "--r18BGColor": "#e2067f4a",

    "--progressText": "#000000",
    "--progressBG": "#ffffff",
    "--bubbleBG": "rgba(255, 171, 226, 0.8)",
    "--buttonBG": "#FF63BB",
    "--previewBG": "#AAABFF",
    "--editBG": "#f7afff",

    "--audioPlayerColor": "#FFEFF7",
    "--audioFilterColor": "#ff4d97"
}

const darkColorList = {
    "--selection": "#fc69bc",
    "--background": "#10030C",

    "--titlebarBG": "#1C0713",
    "--moeTextA": "#FF5099",
    "--moeTextB": "#FF307F",
    "--titleText": "#FF5099",

    "--navbarBG": "#1C0713",
    "--navbarText": "#FF3CA4",

    "--sidebarBG": "#16050F",
    "--sidebarText": "#ff54bc",
    "--sidebarSearchBG": "#2D0D1A",
    "--sidebarSearchFocus": "#e00882",
    "--sidebarTitleText": "#FF0CB2",
    "--sidebarTextA": "#FF3281",
    "--sidebarTextB": "#ff32b9",

    "--tagReadColor": "rgba(255, 31, 158, 0.5)",
    "--text": "#ffffff",
    "--text-alt": "#ff3891",
    "--text-strong": "#FF16A6",
    "--itemBorder": "rgba(255, 66, 179, 0.04)",
    "--textBoxBorder": "#ff42b3",
    "--inputBG": "#200014",
    "--bannerText": "#ff5fa2",

    "--sortbarBG": "rgba(14, 1, 10, 0.95)",
    "--sortbarText": "#FFFFFF",

    "--tooltipBG": "rgba(34, 3, 22, 0.85)",

    "--footerBG": "#1C0713",

    "--imageBorder": "#FF77CB",
    "--pageButton": "#FF4E92",
    "--drop-color1": "rgba(165, 13, 152, 0.7)",
    "--drop-color2": "rgba(226, 26, 173, 0.9)",
    "--binary": "#000000",
    "--selectBorder": "#e610a6",
    "--r18BGColor": "#5603383d",

    "--progressText": "#ffffff",
    "--progressBG": "#000000",
    "--bubbleBG": "rgba(255, 43, 188, 0.8)",
    "--buttonBG": "#FF41AC",
    "--previewBG": "#AAABFF",
    "--editBG": "#ff34e1",
    "--audioPlayerColor": "#1D0915",
    "--audioFilterColor": "#ff4d97"
}

const LocalStorage: React.FunctionComponent = () => {
    const {theme, language, siteHue, siteSaturation, siteLightness, particles, 
    particleAmount, particleSize, particleSpeed} = useThemeSelector()
    const {setTheme, setLanguage, setSiteHue, setSiteSaturation, setSiteLightness, 
    setParticles, setParticleAmount, setParticleSize, setParticleSpeed} = useThemeActions()
    const {imageExpand, noteDrawingEnabled, scroll, format, saveSearch, favSearch, square, imageType, 
    ratingType, styleType, sizeType, sortType, sortReverse, pageMultiplier, showChildren, readerHorizontal,
    readerInvert, readerThumbnails, readerZoom, showTranscript} = useSearchSelector()
    const {setImageExpand, setNoteDrawingEnabled, setScroll, setFormat, setSaveSearch, setFavSearch, setImageType, setRatingType, 
    setStyleType, setSizeType, setSortType, setSortReverse, setPageMultiplier, setSquare, setShowChildren, setReaderHorizontal,
    setReaderInvert, setReaderThumbnails, setReaderZoom, setShowTranscript} = useSearchActions()
    const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate, splatter,
    lowpass, highpass, reverb, delay, phaser, bitcrush} = useFilterSelector()
    const {setBrightness, setContrast, setHue, setSaturation, setLightness, setBlur, setSharpen, setPixelate, setSplatter,
    setLowpass, setHighpass, setReverb, setDelay, setPhaser, setBitcrush} = useFilterActions()
    const {hideSortbar, hideSidebar, hideTitlebar, hideNavbar} = useLayoutSelector()
    const {setHideSortbar, setHideSidebar, setHideTitlebar, setHideNavbar} = useLayoutActions()
    const {posts, navigationPosts, tags, bannerTags, post, tagCategories, tagGroupCategories, order, related, artists, characters, series} = useCacheSelector()
    const {setPosts, setNavigationPosts, setTags, setBannerTags, setPost, setTagCategories, setTagGroupCategories, setOrder, setRelated, setArtists, setCharacters, setSeries} = useCacheActions()
    const {disableZoom, showBigPlayer} = usePlaybackSelector()
    const {setDisableZoom, setShowBigPlayer} = usePlaybackActions()
    const {session, userImg} = useSessionSelector()
    const {setSession, setUserImg} = useSessionActions()

    useEffect(() => {
        if (typeof window === "undefined") return
        const colorList = theme.includes("light") ? lightColorList : darkColorList
        let targetLightness = siteLightness
        if (theme.includes("light") && siteLightness > 50) targetLightness = 50
        let noRotation = [
            "--buttonBG",
            "--previewBG",
            "--r18BGColor"
        ]
        for (let i = 0; i < Object.keys(colorList).length; i++) {
            const key = Object.keys(colorList)[i]
            const color = Object.values(colorList)[i]
            if (noRotation.includes(key)) {
                document.documentElement.style.setProperty(key, color)
            } else {
                document.documentElement.style.setProperty(key, functions.color.rotateColor(color, siteHue, siteSaturation, targetLightness))
            }
        }
    }, [theme, siteHue, siteSaturation, siteLightness])

    const initLanguage = () => {
        const savedLanguage = localStorage.getItem("language")
        const browserLang = window.navigator.language.split("-")[0]
        const langPref = savedLanguage || browserLang
        if (langPref === "ja") {
            setLanguage("ja")
        } else {
            setLanguage("en")
        }
    }

    const initAsync = async () => {
        const savedPosts = await localforage.getItem("savedPosts") as string
        const savedNavigationPosts = await localforage.getItem("savedNavigationPosts") as string
        const savedTags = await localforage.getItem("savedTags") as string
        const savedRelated = await localforage.getItem("savedRelated") as string
        const savedArtists = await localforage.getItem("savedArtists") as string
        const savedCharacters = await localforage.getItem("savedCharacters") as string
        const savedSeries = await localforage.getItem("savedSeries") as string
        if (savedPosts) setPosts(JSON.parse(savedPosts))
        if (savedNavigationPosts) setNavigationPosts(JSON.parse(savedNavigationPosts))
        if (savedTags) setTags(JSON.parse(savedTags))
        if (savedRelated) setRelated(JSON.parse(savedRelated))
        if (savedArtists) setArtists(JSON.parse(savedArtists))
        if (savedCharacters) setCharacters(JSON.parse(savedCharacters))
        if (savedSeries) setSeries(JSON.parse(savedSeries))
    }

    useEffect(() => {
        initLanguage()
        initAsync()
        const savedTheme = localStorage.getItem("theme")
        const savedSiteHue = localStorage.getItem("siteHue")
        const savedSiteSaturation = localStorage.getItem("siteSaturation")
        const savedSiteLightness = localStorage.getItem("siteLightness")
        const savedScroll = localStorage.getItem("scroll")
        const savedDisableZoom = localStorage.getItem("disableZoom")
        const savedImageExpand = localStorage.getItem("imageExpand")
        const savedNoteDrawing = localStorage.getItem("noteDrawingEnabled")
        const savedShowTranscript = localStorage.getItem("showTranscript")
        const savedFormat = localStorage.getItem("format")
        const savedBrightness = localStorage.getItem("brightness")
        const savedContrast = localStorage.getItem("contrast")
        const savedHue = localStorage.getItem("hue")
        const savedSaturation = localStorage.getItem("saturation")
        const savedLightness = localStorage.getItem("lightness")
        const savedBlur = localStorage.getItem("blur")
        const savedSharpen = localStorage.getItem("sharpen")
        const savedPixelate = localStorage.getItem("pixelate")
        const savedSplatter = localStorage.getItem("splatter")
        const savedLowpass = localStorage.getItem("lowpass")
        const savedHighpass = localStorage.getItem("highpass")
        const savedReverb = localStorage.getItem("reverb")
        const savedDelay = localStorage.getItem("delay")
        const savedPhaser = localStorage.getItem("phaser")
        const savedBitcrush = localStorage.getItem("bitcrush")
        const savedParticles = localStorage.getItem("particles")
        const savedParticleAmount = localStorage.getItem("particleAmount")
        const savedParticleSize = localStorage.getItem("particleSize")
        const savedParticleSpeed = localStorage.getItem("particleSpeed")
        const savedSaveSearch = localStorage.getItem("saveSearch")
        const savedFavSearch = localStorage.getItem("favSearch")
        const savedType = localStorage.getItem("type")
        const savedRating = localStorage.getItem("rating")
        const savedStyle = localStorage.getItem("style")
        const savedSize = localStorage.getItem("size")
        const savedSort = localStorage.getItem("sort")
        const savedSortReverse = localStorage.getItem("sortReverse")
        const savedSquare = localStorage.getItem("square")
        const savedMultiplier = localStorage.getItem("pageMultiplier")
        const savedShowChildren = localStorage.getItem("showChildren")
        const savedHideTitlebar = localStorage.getItem("titlebar")
        const savedHideSidebar = localStorage.getItem("sidebar")
        const savedHideNavbar = localStorage.getItem("navbar")
        const savedHideSortbar = localStorage.getItem("sortbar")
        const savedOrder = localStorage.getItem("order")
        const savedBannerTags = localStorage.getItem("savedBannerTags")
        const savedSession = localStorage.getItem("savedSession")
        const savedPost = localStorage.getItem("savedPost")
        const savedTagCategories = localStorage.getItem("savedTagCategories")
        const savedTagGroupCategories = localStorage.getItem("savedTagGroupCategories")
        const savedShowBigPlayer = localStorage.getItem("showBigPlayer")
        const savedReaderHorizontal = localStorage.getItem("readerHorizontal")
        const savedReaderThumbnails = localStorage.getItem("readerThumbnails")
        const savedReaderZoom = localStorage.getItem("readerZoom")
        const savedReaderInvert = localStorage.getItem("readerInvert")
        const savedUserImg = localStorage.getItem("userImg")
        if (savedTheme) setTheme(savedTheme as Themes)
        if (savedSiteSaturation) setSiteSaturation(Number(savedSiteSaturation))
        if (savedSiteHue) setSiteHue(Number(savedSiteHue))
        if (savedSiteLightness) setSiteLightness(Number(savedSiteLightness))
        if (savedScroll) setScroll(savedScroll === "true")
        if (savedDisableZoom) setDisableZoom(savedDisableZoom === "true")
        if (savedImageExpand) setImageExpand(savedImageExpand === "true")
        if (savedNoteDrawing) setNoteDrawingEnabled(savedNoteDrawing === "true")
        if (savedShowTranscript) setShowTranscript(savedShowTranscript === "true")
        if (savedFormat) setFormat(savedFormat as ImageFormat)
        if (savedBrightness) setBrightness(Number(savedBrightness))
        if (savedContrast) setContrast(Number(savedContrast))
        if (savedHue) setHue(Number(savedHue))
        if (savedSaturation) setSaturation(Number(savedSaturation))
        if (savedLightness) setLightness(Number(savedLightness))
        if (savedBlur) setBlur(Number(savedBlur))
        if (savedSharpen) setSharpen(Number(savedSharpen))
        if (savedPixelate) setPixelate(Number(savedPixelate))
        if (savedSplatter) setSplatter(Number(savedSplatter))
        if (savedLowpass) setLowpass(Number(savedLowpass))
        if (savedHighpass) setHighpass(Number(savedHighpass))
        if (savedReverb) setReverb(Number(savedReverb))
        if (savedDelay) setDelay(Number(savedDelay))
        if (savedPhaser) setPhaser(Number(savedPhaser))
        if (savedBitcrush) setBitcrush(Number(savedBitcrush))
        if (savedParticles) setParticles(savedParticles === "true")
        if (savedParticleAmount) setParticleAmount(Number(savedParticleAmount))
        if (savedParticleSize) setParticleSize(Number(savedParticleSize))
        if (savedParticleSpeed) setParticleSpeed(Number(savedParticleSpeed))
        if (savedSaveSearch) setSaveSearch(savedSaveSearch === "true")
        if (savedFavSearch) setFavSearch(savedFavSearch === "true")
        if (savedType) setImageType(savedType as PostType)
        if (savedRating) setRatingType(savedRating as PostRating)
        if (savedStyle) setStyleType(savedStyle as PostStyle)
        if (savedSize) setSizeType(savedSize as PostSize)
        if (savedSort) setSortType(savedSort as PostSort)
        if (savedSortReverse) setSortReverse(savedSortReverse === "true")
        if (savedSquare) setSquare(savedSquare === "true")
        if (savedMultiplier) setPageMultiplier(Number(savedMultiplier))
        if (savedShowChildren) setShowChildren(savedShowChildren === "true")
        if (savedHideTitlebar) setHideTitlebar(savedHideTitlebar === "true")
        if (savedHideNavbar) setHideNavbar(savedHideNavbar === "true")
        if (savedHideSidebar) setHideSidebar(savedHideSidebar === "true")
        if (savedHideSortbar) setHideSortbar(savedHideSortbar === "true")
        if (savedBannerTags) setBannerTags(JSON.parse(savedBannerTags))
        if (savedSession) setSession(JSON.parse(savedSession))
        if (savedPost) setPost(JSON.parse(savedPost))
        if (savedTagCategories) setTagCategories(JSON.parse(savedTagCategories))
        if (savedTagGroupCategories) setTagGroupCategories(JSON.parse(savedTagGroupCategories))
        if (savedOrder) setOrder(Number(savedOrder))
        if (savedShowBigPlayer) setShowBigPlayer(savedShowBigPlayer === "true")
        if (savedReaderHorizontal) setReaderHorizontal(savedReaderHorizontal === "true")
        if (savedReaderThumbnails) setReaderThumbnails(savedReaderThumbnails === "true")
        if (savedReaderZoom && Number(savedReaderZoom) !== 100) setReaderZoom(Number(savedReaderZoom))
        if (savedReaderInvert) setReaderInvert(savedReaderInvert === "true")
        if (savedUserImg) setUserImg(savedUserImg)
    }, [])

    useEffect(() => {
        localStorage.setItem("siteHue", String(siteHue))
        localStorage.setItem("siteSaturation", String(siteSaturation))
        localStorage.setItem("siteLightness", String(siteLightness))
    }, [siteHue, siteSaturation, siteLightness])

    useEffect(() => {
        localStorage.setItem("theme", theme)
        localStorage.setItem("language", language)
        localStorage.setItem("particles", String(particles))
        localStorage.setItem("particleAmount", String(particleAmount))
        localStorage.setItem("particleSize", String(particleSize))
        localStorage.setItem("particleSpeed", String(particleSpeed))
    }, [theme, language, particles, particleAmount, particleSize, particleSpeed])

    useEffect(() => {
        localStorage.setItem("scroll", String(scroll))
        localStorage.setItem("type", imageType)
        localStorage.setItem("rating", ratingType)
        localStorage.setItem("style", styleType)
        localStorage.setItem("size", sizeType)
        localStorage.setItem("sort", sortType)
        localStorage.setItem("sortReverse", String(sortReverse))
        localStorage.setItem("pageMultiplier", String(pageMultiplier))
        localStorage.setItem("square", String(square))
        localStorage.setItem("showChildren", String(showChildren))
    }, [scroll, imageType, ratingType, styleType, sizeType, sortType, sortReverse, 
        pageMultiplier, square, showChildren])

    useEffect(() => {
        localStorage.setItem("brightness", String(brightness))
        localStorage.setItem("contrast", String(contrast))
        localStorage.setItem("hue", String(hue))
        localStorage.setItem("saturation", String(saturation))
        localStorage.setItem("lightness", String(lightness))
        localStorage.setItem("blur", String(blur))
        localStorage.setItem("sharpen", String(sharpen))
        localStorage.setItem("pixelate", String(pixelate))
        localStorage.setItem("splatter", String(splatter))
    }, [brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate, splatter])

    useEffect(() => {
        localStorage.setItem("lowpass", String(lowpass))
        localStorage.setItem("highpass", String(highpass))
        localStorage.setItem("reverb", String(reverb))
        localStorage.setItem("delay", String(delay))
        localStorage.setItem("phaser", String(phaser))
        localStorage.setItem("bitcrush", String(bitcrush))
    }, [lowpass, highpass, reverb, delay, phaser, bitcrush])

    useEffect(() => {
        localStorage.setItem("disableZoom", String(disableZoom))
        localStorage.setItem("imageExpand", String(imageExpand))
        localStorage.setItem("noteDrawingEnabled", String(noteDrawingEnabled))
        localStorage.setItem("showTranscript", String(showTranscript))
        localStorage.setItem("format", format)
        localStorage.setItem("saveSearch", String(saveSearch))
        localStorage.setItem("favSearch", String(favSearch))
        localStorage.setItem("showBigPlayer", String(showBigPlayer))
        localStorage.setItem("userImg", userImg)
    }, [disableZoom, imageExpand, noteDrawingEnabled, showTranscript, format, saveSearch, favSearch, showBigPlayer, userImg])

    useEffect(() => {
        localStorage.setItem("readerHorizontal", String(readerHorizontal))
        localStorage.setItem("readerInvert", String(readerInvert))
        localStorage.setItem("readerThumbnails", String(readerThumbnails))
        localStorage.setItem("readerZoom", String(readerZoom))
    }, [readerHorizontal, readerInvert, readerThumbnails, readerZoom])

    useEffect(() => {
        localStorage.setItem("sidebar", String(hideSidebar))
        localStorage.setItem("titlebar", String(hideTitlebar))
        localStorage.setItem("navbar", String(hideNavbar))
        localStorage.setItem("sortbar", String(hideSortbar))
    }, [hideSidebar, hideTitlebar, hideNavbar, hideSortbar])

    useEffect(() => {
        if (posts.length) localforage.setItem("savedPosts", JSON.stringify(posts))
        if (navigationPosts.length) localforage.setItem("savedNavigationPosts", JSON.stringify(navigationPosts))
        if (tags.length) localforage.setItem("savedTags", JSON.stringify(tags))
        if (bannerTags.length) localStorage.setItem("savedBannerTags", JSON.stringify(bannerTags))
        localStorage.setItem("savedSession", JSON.stringify(session))
    }, [posts, navigationPosts, tags, bannerTags, session])

    useEffect(() => {
        localStorage.setItem("order", String(order))
        localStorage.setItem("savedPost", JSON.stringify(post))
        localStorage.setItem("savedTagCategories", JSON.stringify(tagCategories))
        localStorage.setItem("savedTagGroupCategories", JSON.stringify(tagGroupCategories))
        localforage.setItem("savedRelated", JSON.stringify(related))
    }, [order, tagCategories, tagGroupCategories, post, related])


    useEffect(() => {
        localforage.setItem("savedArtists", JSON.stringify(artists))
        localforage.setItem("savedCharacters", JSON.stringify(characters))
        localforage.setItem("savedSeries", JSON.stringify(series))
    }, [artists, characters, series])

    return null
}

export default LocalStorage