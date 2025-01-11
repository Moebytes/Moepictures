import React, {useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector,
useActiveSelector} from "../../store"
import mainImg from "../../assets/images/mainimg.png"
import imagefiltersImg from "../../assets/images/imagefilters.png"
import gifPlayerImg from "../../assets/images/gifplayer.png"
import videoPlayerImg from "../../assets/images/videoplayer.png"
import musicPlayerImg from "../../assets/images/musicplayer.png"
import $3dPlayerImg from "../../assets/images/3dplayer.png"
import favoritesImg from "../../assets/images/favorites.png"
import favgroupsImg from "../../assets/images/favgroups.png"
import groupsImg from "../../assets/images/groups.png"
import cutenessMeterImg from "../../assets/images/cutenessmeter.png"
import notesImg from "../../assets/images/notes.png"
import overlayNotesImg from "../../assets/images/overlaynotes.png"
import characterNotesImg from "../../assets/images/characternotes.png"
import uploadImg from "../../assets/images/upload.png"
import taggingImg from "../../assets/images/tagging.png"
import searchingImg from "../../assets/images/searching.png"
import imageSearchingImg from "../../assets/images/imagesearching.png"
import upscalingImg from "../../assets/images/upscaling.png"
import emojisImg from "../../assets/images/emojis.png"
import compressingImg from "../../assets/images/compressing.png"
import variationsImg from "../../assets/images/variations.png"
import childrenImg from "../../assets/images/children.png"
import aliasesImg from "../../assets/images/aliases.png"
import implicationsImg from "../../assets/images/implications.png"
import captchaImg from "../../assets/images/captcha.png"
import languageImg from "../../assets/images/language.png"
import pixivDownloaderImg from "../../assets/images/pixiv-downloader.png"
import setAvatarImg from "../../assets/images/set-avatar.png"
import musicImg from "../../assets/images/music.png"
import CaptchaDialog from "../../dialogs/misc/CaptchaDialog"
import bookmarkletImg from "../../assets/icons/bookmarklet.png"
import tooltipsImg from "../../assets/images/tooltips.png"
import functions from "../../structures/Functions"
import "./styles/helppage.less"

const HelpPage: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {helpTab} = useActiveSelector()
    const {setHelpTab} = useActiveActions()
    const history = useHistory()

    const urlState = () => {
        if (window.location.hash) setHelpTab(window.location.hash.replace("#", ""))
    }

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        window.scrollTo(0, 0)
        urlState()
    }, [])

    useEffect(() => {
        document.title = i18n.navbar.help
    }, [i18n])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        if (helpTab === "help") {
            window.history.pushState(null, document.title, window.location.pathname + window.location.search)
        } else {
            window.location.hash = helpTab
        }
    }, [helpTab])

    const openLink = (url: string) => {
        window.open(url, "_blank", "noreferrer")
    }

    const getBookmarklet = () => {
        return `javascript:location.href="${functions.getDomain()}/upload?link="+encodeURIComponent(location.href)`
    }

    const getContainerJSX = () => {
        if (helpTab === "help") {
            return (
                <><span className="help-heading">{i18n.navbar.help}</span>
                <span className="help-text">{i18n.help.help.welcome}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.help.line1}<br/><br/>

                    {i18n.help.help.line2}
                </span>
                <div className="help-img-container"><img className="help-img" src={mainImg}/></div></>
            )
        }
        if (helpTab === "searching") {
            return (
                <><span className="help-heading">{i18n.help.searching.title}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.searching.header}<br/>
                    <span className="help-alt">
                    {i18n.help.searching.example1}<br/>
                    {i18n.help.searching.example2}<br/><br/>
                    </span>

                    {i18n.help.searching.specialModifiers.header}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialModifiers.items)[0]}</span>{Object.values(i18n.help.searching.specialModifiers.items)[0]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialModifiers.items)[1]}</span>{Object.values(i18n.help.searching.specialModifiers.items)[1]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialModifiers.items)[2]}</span>{Object.values(i18n.help.searching.specialModifiers.items)[2]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialModifiers.items)[3]}</span>{Object.values(i18n.help.searching.specialModifiers.items)[3]}<br/><br/>

                    {i18n.help.searching.specialSearches.header}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialSearches.items)[0]}</span>{Object.values(i18n.help.searching.specialSearches.items)[0]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialSearches.items)[1]}</span>{Object.values(i18n.help.searching.specialSearches.items)[1]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialSearches.items)[2]}</span>{Object.values(i18n.help.searching.specialSearches.items)[2]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialSearches.items)[3]}</span>{Object.values(i18n.help.searching.specialSearches.items)[3]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialSearches.items)[4]}</span>{Object.values(i18n.help.searching.specialSearches.items)[4]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialSearches.items)[5]}</span>{Object.values(i18n.help.searching.specialSearches.items)[5]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialSearches.items)[6]}</span>{Object.values(i18n.help.searching.specialSearches.items)[6]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialSearches.items)[7]}</span>{Object.values(i18n.help.searching.specialSearches.items)[7]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialSearches.items)[8]}</span>{Object.values(i18n.help.searching.specialSearches.items)[8]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialSearches.items)[9]}</span>{Object.values(i18n.help.searching.specialSearches.items)[9]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialSearches.items)[10]}</span>{Object.values(i18n.help.searching.specialSearches.items)[10]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialSearches.items)[11]}</span>{Object.values(i18n.help.searching.specialSearches.items)[11]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialSearches.items)[12]}</span>{Object.values(i18n.help.searching.specialSearches.items)[12]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialSearches.items)[13]}</span>{Object.values(i18n.help.searching.specialSearches.items)[13]}<br/><br/>

                    {i18n.help.searching.specialUses.header}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialUses.items)[0]}</span>{Object.values(i18n.help.searching.specialUses.items)[0]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialUses.items)[1]}</span>{Object.values(i18n.help.searching.specialUses.items)[1]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialUses.items)[2]}</span>{Object.values(i18n.help.searching.specialUses.items)[2]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialUses.items)[3]}</span>{Object.values(i18n.help.searching.specialUses.items)[3]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialUses.items)[4]}</span>{Object.values(i18n.help.searching.specialUses.items)[4]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialUses.items)[5]}</span>{Object.values(i18n.help.searching.specialUses.items)[5]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialUses.items)[6]}</span>{Object.values(i18n.help.searching.specialUses.items)[6]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialUses.items)[7]}</span>{Object.values(i18n.help.searching.specialUses.items)[7]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialUses.items)[8]}</span>{Object.values(i18n.help.searching.specialUses.items)[8]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialUses.items)[9]}</span>{Object.values(i18n.help.searching.specialUses.items)[9]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialUses.items)[10]}</span>{Object.values(i18n.help.searching.specialUses.items)[10]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialUses.items)[11]}</span>{Object.values(i18n.help.searching.specialUses.items)[11]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialUses.items)[12]}</span>{Object.values(i18n.help.searching.specialUses.items)[12]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialUses.items)[13]}</span>{Object.values(i18n.help.searching.specialUses.items)[13]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialUses.items)[14]}</span>{Object.values(i18n.help.searching.specialUses.items)[14]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialUses.items)[15]}</span>{Object.values(i18n.help.searching.specialUses.items)[15]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialUses.items)[16]}</span>{Object.values(i18n.help.searching.specialUses.items)[16]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialUses.items)[17]}</span>{Object.values(i18n.help.searching.specialUses.items)[17]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialUses.items)[18]}</span>{Object.values(i18n.help.searching.specialUses.items)[18]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialUses.items)[19]}</span>{Object.values(i18n.help.searching.specialUses.items)[19]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialUses.items)[20]}</span>{Object.values(i18n.help.searching.specialUses.items)[20]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.specialUses.items)[21]}</span>{Object.values(i18n.help.searching.specialUses.items)[21]}<br/><br/>

                    {i18n.help.searching.borderColors.header}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.borderColors.items)[0]}</span>{Object.values(i18n.help.searching.borderColors.items)[0]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.borderColors.items)[1]}</span>{Object.values(i18n.help.searching.borderColors.items)[1]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.borderColors.items)[2]}</span>{Object.values(i18n.help.searching.borderColors.items)[2]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.borderColors.items)[3]}</span>{Object.values(i18n.help.searching.borderColors.items)[3]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.borderColors.items)[4]}</span>{Object.values(i18n.help.searching.borderColors.items)[4]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.borderColors.items)[5]}</span>{Object.values(i18n.help.searching.borderColors.items)[5]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.searching.borderColors.items)[6]}</span>{Object.values(i18n.help.searching.borderColors.items)[6]}<br/>
                </span>
                <div className="help-img-container"><img className="help-img" src={searchingImg}/></div></>
            )
        }
        if (helpTab === "image-searching") {
            return (
                <><span className="help-heading">{i18n.help.imageSearching.title}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.imageSearching.line1}<br/><br/>

                    {i18n.help.imageSearching.line2}<br/><br/>

                    {i18n.help.imageSearching.line3}
                </span>
                <div className="help-img-container"><img className="help-img" src={imageSearchingImg}/></div></>
            )
        }
        if (helpTab === "filters") {
            return (
                <><span className="help-heading">{i18n.filters.filters}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.filters.line1}<br/><br/>

                    {i18n.help.filters.line2}
                </span>
                <div className="help-img-container"><img className="help-img" src={imagefiltersImg}/></div></>
            )
        }
        if (helpTab === "custom-players") {
            return (
                <><span className="help-heading">{i18n.help.customPlayers.title}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.customPlayers.line1}<br/><br/>

                    {i18n.help.customPlayers.line2}
                </span>
                <div className="help-img-container"><img className="help-img" src={videoPlayerImg}/></div></>
            )
        }
        if (helpTab === "music") {
            return (
                <><span className="help-heading">{i18n.help.music.title}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.music.line1}
                </span>
                <div className="help-img-container"><img className="help-img" src={musicImg}/></div></>
            )
        }
        if (helpTab === "notes") {
            return (
                <><span className="help-heading">{i18n.navbar.notes}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.notes.line1}<br/><br/>

                    {i18n.help.notes.line2}
                    <a className="help-link" onClick={() => openLink("https://www.kanjitomo.net/")} style={{marginLeft: "10px"}}>KanjiTomo{i18n.period}</a><br/><br/>

                    {i18n.help.notes.line3}
                    <a className="help-link" onClick={() => openLink("https://github.com/dmMaze/comic-text-detector")} style={{marginLeft: "10px", marginRight: "10px"}}>Comic Text Detector</a> 
                    {i18n.help.notes.line4}
                    <a className="help-link" onClick={() => openLink("https://github.com/kha-white/manga-ocr")} style={{marginLeft: "10px", marginRight: "10px"}}>Manga OCR</a> 
                    {i18n.help.notes.line5}
                    <a className="help-link" onClick={() => openLink("https://translate.google.com/")} style={{marginLeft: "10px", marginRight: "10px"}}>Google Translate</a> 
                    {i18n.help.notes.line6}<br/><br/>
                    {i18n.help.notes.line7}
                </span>
                <div className="help-img-container"><img className="help-img" src={notesImg}/></div></>
            )
        }
        if (helpTab === "overlay-notes") {
            return (
                <><span className="help-heading">{i18n.help.overlayNotes.title}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.overlayNotes.line1}<br/><br/>

                    {i18n.help.overlayNotes.customization.header}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.overlayNotes.customization.items)[0]}</span>{Object.values(i18n.help.overlayNotes.customization.items)[0]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.overlayNotes.customization.items)[1]}</span>{Object.values(i18n.help.overlayNotes.customization.items)[1]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.overlayNotes.customization.items)[2]}</span>{Object.values(i18n.help.overlayNotes.customization.items)[2]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.overlayNotes.customization.items)[3]}</span>{Object.values(i18n.help.overlayNotes.customization.items)[3]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.overlayNotes.customization.items)[4]}</span>{Object.values(i18n.help.overlayNotes.customization.items)[4]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.overlayNotes.customization.items)[5]}</span>{Object.values(i18n.help.overlayNotes.customization.items)[5]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.overlayNotes.customization.items)[6]}</span>{Object.values(i18n.help.overlayNotes.customization.items)[6]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.overlayNotes.customization.items)[7]}</span>{Object.values(i18n.help.overlayNotes.customization.items)[7]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.overlayNotes.customization.items)[8]}</span>{Object.values(i18n.help.overlayNotes.customization.items)[8]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.overlayNotes.customization.items)[9]}</span>{Object.values(i18n.help.overlayNotes.customization.items)[9]}<br/>
                </span>
                <div className="help-img-container"><img className="help-img" src={overlayNotesImg}/></div></>
            )
        }
        if (helpTab === "character-notes") {
            return (
                <><span className="help-heading">{i18n.help.characterNotes.title}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.characterNotes.line1}<br/>
                </span>
                <div className="help-img-container"><img className="help-img" src={characterNotesImg}/></div></>
            )
        }
        if (helpTab === "favorites") {
            return (
                <><span className="help-heading">{i18n.sort.favorites}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.favorites.line1}<br/><br/>

                    {i18n.help.favorites.line2}
                </span>
                <div className="help-img-container"><img className="help-img" src={favoritesImg}/></div></>
            )
        }
        if (helpTab === "favgroups") {
            return (
                <><span className="help-heading">{i18n.help.favoriteGroups.title}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.favoriteGroups.line1}
                    <span className="help-alt">{i18n.help.favoriteGroups.search1}</span>.
                </span>
                <div className="help-img-container"><img className="help-img" src={favgroupsImg}/></div></>
            )
        }
        if (helpTab === "cuteness") {
            return (
                <><span className="help-heading">{i18n.sort.cuteness}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.cuteness.line1}
                </span>
                <div className="help-img-container"><img className="help-img" src={cutenessMeterImg}/></div></>
            )
        }
        if (helpTab === "uploading") {
            return (
                <><span className="help-heading">{i18n.help.uploading.title}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.uploading.line1}<br/><br/>
                    {i18n.help.uploading.uploadGuidelines.header}<br/>
                    <span className="help-alt">
                    {i18n.help.uploading.uploadGuidelines.guide1}<br/>
                    {i18n.help.uploading.uploadGuidelines.guide2}<br/>
                    {i18n.help.uploading.uploadGuidelines.guide3}<br/>
                    {i18n.help.uploading.uploadGuidelines.guide4}<br/>
                    {i18n.help.uploading.uploadGuidelines.guide5}<br/>
                    {i18n.help.uploading.uploadGuidelines.guide6}<br/>
                    {i18n.help.uploading.uploadGuidelines.guide7}<br/>
                    {i18n.help.uploading.uploadGuidelines.guide8}<br/>
                    {i18n.help.uploading.uploadGuidelines.guide9}<br/>
                    {i18n.help.uploading.uploadGuidelines.guide10}<br/>
                    {i18n.help.uploading.uploadGuidelines.guide11}<br/>
                    {i18n.help.uploading.uploadGuidelines.guide12}<br/>
                    {i18n.help.uploading.uploadGuidelines.guide13}<br/>
                    {i18n.help.uploading.uploadGuidelines.guide14}<br/>
                    {i18n.help.uploading.uploadGuidelines.guide15}<br/>
                    {i18n.help.uploading.uploadGuidelines.guide16}<br/>
                    {i18n.help.uploading.uploadGuidelines.guide17}<br/><br/>
                    </span>

                    {i18n.help.uploading.categorization.header}<br/>
                    <span className="help-alt">{i18n.sidebar.type}</span>{i18n.help.uploading.categorization.type.line1}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.categorization.type.items)[0]}</span>{Object.values(i18n.help.uploading.categorization.type.items)[0]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.categorization.type.items)[1]}</span>{Object.values(i18n.help.uploading.categorization.type.items)[1]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.categorization.type.items)[2]}</span>{Object.values(i18n.help.uploading.categorization.type.items)[2]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.categorization.type.items)[3]}</span>{Object.values(i18n.help.uploading.categorization.type.items)[3]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.categorization.type.items)[4]}</span>{Object.values(i18n.help.uploading.categorization.type.items)[4]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.categorization.type.items)[5]}</span>{Object.values(i18n.help.uploading.categorization.type.items)[5]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.categorization.type.items)[6]}</span>{Object.values(i18n.help.uploading.categorization.type.items)[6]}<br/><br/>

                    <span className="help-alt">{i18n.sidebar.rating}</span>{i18n.help.uploading.categorization.rating.line1}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.categorization.rating.items)[0]}</span>{Object.values(i18n.help.uploading.categorization.rating.items)[0]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.categorization.rating.items)[1]}</span>{Object.values(i18n.help.uploading.categorization.rating.items)[1]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.categorization.rating.items)[2]}</span>{Object.values(i18n.help.uploading.categorization.rating.items)[2]}<br/><br/>

                    <span className="help-alt">{i18n.sidebar.style}</span>{i18n.help.uploading.categorization.style.line1}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.categorization.style.items)[0]}</span>{Object.values(i18n.help.uploading.categorization.style.items)[0]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.categorization.style.items)[1]}</span>{Object.values(i18n.help.uploading.categorization.style.items)[1]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.categorization.style.items)[2]}</span>{Object.values(i18n.help.uploading.categorization.style.items)[2]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.categorization.style.items)[3]}</span>{Object.values(i18n.help.uploading.categorization.style.items)[3]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.categorization.style.items)[4]}</span>{Object.values(i18n.help.uploading.categorization.style.items)[4]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.categorization.style.items)[5]}</span>{Object.values(i18n.help.uploading.categorization.style.items)[5]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.categorization.style.items)[6]}</span>{Object.values(i18n.help.uploading.categorization.style.items)[6]}<br/><br/>

                    {i18n.help.uploading.categorization.parentID}<br/><br/>

                    {i18n.help.uploading.sourceInformation.header}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.sourceInformation.items)[0]}</span>{Object.values(i18n.help.uploading.sourceInformation.items)[0]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.sourceInformation.items)[1]}</span>{Object.values(i18n.help.uploading.sourceInformation.items)[1]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.sourceInformation.items)[2]}</span>{Object.values(i18n.help.uploading.sourceInformation.items)[2]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.sourceInformation.items)[3]}</span>{Object.values(i18n.help.uploading.sourceInformation.items)[3]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.sourceInformation.items)[4]}</span>{Object.values(i18n.help.uploading.sourceInformation.items)[4]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.sourceInformation.items)[5]}</span>{Object.values(i18n.help.uploading.sourceInformation.items)[5]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.sourceInformation.items)[6]}</span>{Object.values(i18n.help.uploading.sourceInformation.items)[6]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.sourceInformation.items)[7]}</span>{Object.values(i18n.help.uploading.sourceInformation.items)[7]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.sourceInformation.items)[8]}</span>{Object.values(i18n.help.uploading.sourceInformation.items)[8]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.uploading.sourceInformation.items)[9]}</span>{Object.values(i18n.help.uploading.sourceInformation.items)[9]}<br/><br/>

                    {i18n.help.uploading.appeals}<br/><br/>
                </span>
                <div className="help-img-container"><img className="help-img" src={uploadImg}/></div></>
            )
        }
        if (helpTab === "tagging") {
            return (
                <><span className="help-heading">{i18n.help.tagging.title}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.tagging.line1}<br/><br/>

                    {i18n.help.tagging.tagGuidelines.header}<br/>
                    <span className="help-alt">
                    {i18n.help.tagging.tagGuidelines.guide1}<br/>
                    {i18n.help.tagging.tagGuidelines.guide2}<br/>
                    {i18n.help.tagging.tagGuidelines.guide3}<br/>
                    {i18n.help.tagging.tagGuidelines.guide4}<br/>
                    {i18n.help.tagging.tagGuidelines.guide5}<br/>
                    {i18n.help.tagging.tagGuidelines.guide6}<br/>
                    {i18n.help.tagging.tagGuidelines.guide7}<br/>
                    {i18n.help.tagging.tagGuidelines.guide8}<br/>
                    {i18n.help.tagging.tagGuidelines.guide9}<br/>
                    {i18n.help.tagging.tagGuidelines.guide10}<br/>
                    {i18n.help.tagging.tagGuidelines.guide11}<br/><br/>
                    </span>

                    {i18n.help.tagging.line2}<br/><br/>

                    {i18n.help.tagging.categories.header}<br/>
                    <span className="help-alt artist-tag-color">{Object.keys(i18n.help.tagging.categories.items)[0]}</span>{Object.values(i18n.help.tagging.categories.items)[0]}<br/>
                    <span className="help-alt character-tag-color">{Object.keys(i18n.help.tagging.categories.items)[1]}</span>{Object.values(i18n.help.tagging.categories.items)[1]}<br/>
                    <span className="help-alt series-tag-color">{Object.keys(i18n.help.tagging.categories.items)[2]}</span>{Object.values(i18n.help.tagging.categories.items)[2]}<br/>
                    <span className="help-alt meta-tag-color">{Object.keys(i18n.help.tagging.categories.items)[3]}</span>{Object.values(i18n.help.tagging.categories.items)[3]}<br/>
                    <span className="help-alt appearance-tag-color">{Object.keys(i18n.help.tagging.categories.items)[4]}</span>{Object.values(i18n.help.tagging.categories.items)[4]}<br/>
                    <span className="help-alt outfit-tag-color">{Object.keys(i18n.help.tagging.categories.items)[5]}</span>{Object.values(i18n.help.tagging.categories.items)[5]}<br/>
                    <span className="help-alt accessory-tag-color">{Object.keys(i18n.help.tagging.categories.items)[6]}</span>{Object.values(i18n.help.tagging.categories.items)[6]}<br/>
                    <span className="help-alt action-tag-color">{Object.keys(i18n.help.tagging.categories.items)[7]}</span>{Object.values(i18n.help.tagging.categories.items)[7]}<br/>
                    <span className="help-alt scenery-tag-color">{Object.keys(i18n.help.tagging.categories.items)[8]}</span>{Object.values(i18n.help.tagging.categories.items)[8]}<br/>
                    <span className="help-alt tag-color">{Object.keys(i18n.help.tagging.categories.items)[9]}</span>{Object.values(i18n.help.tagging.categories.items)[9]}<br/><br/>

                    {i18n.help.tagging.fields.header}<br/><br/>

                    <span className="help-alt">{Object.keys(i18n.help.tagging.fields.items)[0]}</span>{Object.values(i18n.help.tagging.fields.items)[0]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.tagging.fields.items)[1]}</span>{Object.values(i18n.help.tagging.fields.items)[1]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.tagging.fields.items)[2]}</span>{Object.values(i18n.help.tagging.fields.items)[2]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.tagging.fields.items)[3]}</span>{Object.values(i18n.help.tagging.fields.items)[3]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.tagging.fields.items)[4]}</span>{Object.values(i18n.help.tagging.fields.items)[4]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.tagging.fields.items)[5]}</span>{Object.values(i18n.help.tagging.fields.items)[5]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.tagging.fields.items)[6]}</span>{Object.values(i18n.help.tagging.fields.items)[6]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.tagging.fields.items)[7]}</span>{Object.values(i18n.help.tagging.fields.items)[7]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.tagging.fields.items)[8]}</span>{Object.values(i18n.help.tagging.fields.items)[8]}<br/>
                    <span className="help-alt">{Object.keys(i18n.help.tagging.fields.items)[9]}</span>{Object.values(i18n.help.tagging.fields.items)[9]}<br/>
                </span>
                <div className="help-img-container"><img className="help-img" src={taggingImg}/></div></>
            )
        }
        if (helpTab === "self-uploads") {
            return (
                <><span className="help-heading">{i18n.help.selfUploads.title}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.selfUploads.line1}<br/><br/>

                    {i18n.help.selfUploads.shouldTag}<span className="help-alt">self-upload{i18n.period}</span>
                    {i18n.help.selfUploads.line2}<br/><br/> 

                    {i18n.help.selfUploads.line3}<br/><br/>

                    {i18n.help.selfUploads.contactUs}<span style={{marginRight: "10px"}} className="help-alt">moepictures.moe@gmail.com</span> 
                    {i18n.help.selfUploads.changeName}
                </span>
                </>
            )
        }
        if (helpTab === "upscaling") {
            return (
                <><span className="help-heading">{i18n.help.upscaling.title}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.upscaling.line1}<br/><br/>

                    {i18n.help.upscaling.line2}<br/>
                    <a className="help-link" onClick={() => openLink("https://github.com/Moebits/Waifu2x-GUI/releases")}>{mobile ? "Waifu2x GUI" : "https://github.com/Moebits/Waifu2x-GUI/releases"}</a><br/><br/>

                    {i18n.help.upscaling.line3}<br/>
                </span>
                <div className="help-img-container"><img className="help-img" src={upscalingImg}/></div></>
            )
        }
        if (helpTab === "compressing") {
            return (
                <><span className="help-heading">{i18n.help.compressing.title}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.compressing.line1}<br/><br/>

                    {i18n.help.compressing.line2}<br/>
                    <a className="help-link" onClick={() => openLink("https://github.com/Moebits/Image-Compressor/releases")}>{mobile ? "Image Compressor" : "https://github.com/Moebits/Image-Compressor/releases"}</a><br/><br/>

                    {i18n.help.compressing.recommendedFormats.header}<br/>
                    <span className="help-alt">
                    {i18n.help.compressing.recommendedFormats.format1}<br/>
                    {i18n.help.compressing.recommendedFormats.format2}<br/>
                    {i18n.help.compressing.recommendedFormats.format3}<br/>
                    {i18n.help.compressing.recommendedFormats.format4}<br/>
                    {i18n.help.compressing.recommendedFormats.format5}<br/>
                    {i18n.help.compressing.recommendedFormats.format6}<br/><br/>
                    </span>

                    {i18n.help.compressing.line3}<br/>
                </span>
                <div className="help-img-container"><img className="help-img" src={compressingImg}/></div></>
            )
        }
        if (helpTab === "pixiv-downloads") {
            return (
                <><span className="help-heading">{i18n.help.pixivDownloads.title}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.pixivDownloads.line1}<a className="help-link" onClick={() => openLink("https://www.pixiv.net/")}>Pixiv{i18n.period}</a><br/><br/>

                    {i18n.help.pixivDownloads.line2}<br/>

                    <a className="help-link" onClick={() => openLink("https://github.com/Moebits/Pixiv-Downloader/releases")}>{mobile ? "Pixiv Downloader" : "https://github.com/Moebits/Pixiv-Downloader/releases"}</a><br/><br/>
                </span>
                <div className="help-img-container"><img className="help-img" src={pixivDownloaderImg}/></div></>
            )
        }
        if (helpTab === "bookmarklet") {
            return (
                <><span className="help-heading">{i18n.help.bookmarklet.title}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.bookmarklet.line1}<br/><br/>

                    <a style={{width: "auto", height: "60px"}} className="help-link" href={getBookmarklet()}
                    onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <img src={bookmarkletImg} alt="Upload to Moepictures"/>
                    </a><br/><br/>

                    {i18n.help.bookmarklet.line2}<br/>
                    <a className="help-link" onClick={() => openLink("https://www.pixiv.net/")}>Pixiv</a><br/>
                    <a className="help-link" onClick={() => openLink("https://www.deviantart.com/")}>Deviantart</a><br/>
                    <a className="help-link" onClick={() => openLink("https://www.artstation.com/")}>Artstation</a><br/>
                    <a className="help-link" onClick={() => openLink("https://www.reddit.com/")}>Reddit</a><br/>
                    <a className="help-link" onClick={() => openLink("https://www.tumblr.com/")}>Tumblr</a><br/>
                    <a className="help-link" onClick={() => openLink("https://imgur.com/")}>Imgur</a><br/>
                    <a className="help-link" onClick={() => openLink("https://www.pinterest.com/")}>Pinterest</a><br/>
                    <a className="help-link" onClick={() => openLink("https://medibang.com/")}>ARTStreet</a><br/>
                    <a className="help-link" onClick={() => openLink("https://newgrounds.com/")}>Newgrounds</a><br/>
                    <a className="help-link" onClick={() => openLink("https://danbooru.donmai.us/")}>Danbooru</a><br/>
                    <a className="help-link" onClick={() => openLink("https://gelbooru.com/")}>Gelbooru</a><br/>
                    <a className="help-link" onClick={() => openLink("https://safebooru.org/")}>Safebooru</a><br/>
                    <a className="help-link" onClick={() => openLink("https://yande.re/")}>Yandere</a><br/>
                    <a className="help-link" onClick={() => openLink("https://konachan.com/")}>Konachan</a><br/>
                    <a className="help-link" onClick={() => openLink("https://www.zerochan.net/")}>Zerochan</a><br/>
                    <a className="help-link" onClick={() => openLink("https://e-shuushuu.net/")}>E-Shuushuu</a><br/>
                    <a className="help-link" onClick={() => openLink("https://anime-pictures.net/")}>Anime-Pictures</a><br/>
                </span>
                <div className="help-img-container"><img className="help-img" src={""}/></div></>
            )
        }
        if (helpTab === "variations") {
            return (
                <><span className="help-heading">{i18n.sort.variations}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.variations.line1}<br/><br/>

                    {i18n.help.variations.line2}<br/><br/>

                    {i18n.help.variations.line3}
                </span>
                <div className="help-img-container"><img className="help-img" src={variationsImg}/></div></>
            )
        }
        if (helpTab === "child-posts") {
            return (
                <><span className="help-heading">{i18n.post.childPosts}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.childPosts.line1}<br/><br/>
                    
                    {i18n.help.childPosts.line2}<br/><br/>

                    {i18n.help.childPosts.line3}
                </span>
                <div className="help-img-container"><img className="help-img" src={childrenImg}/></div></>
            )
        }
        if (helpTab === "groups") {
            return (
                <><span className="help-heading">{i18n.sort.groups}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.groups.line1}<br/><br/>

                    {i18n.help.groups.line2}<br/><br/>

                    {i18n.help.groups.sameSource}<span className="help-alt">{i18n.help.groups.sitename}</span>
                    {i18n.help.groups.line3}
                </span>
                <div className="help-img-container"><img className="help-img" src={groupsImg}/></div></>
            )
        }
        if (helpTab === "aliases") {
            return (
                <><span className="help-heading">{i18n.sort.aliases}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.aliases.line1}<br/><br/>

                    <span className="help-alt">{i18n.help.aliases.aliasingTo.title}</span><br/>
                    {i18n.help.aliases.aliasingTo.line1}<br/><br/>

                    {i18n.help.aliases.aliasingTo.line2}<br/>
                </span>
                <div className="help-img-container"><img className="help-img" src={aliasesImg}/></div></>
            )
        }
        if (helpTab === "implications") {
            return (
                <><span className="help-heading">{i18n.labels.implications}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.implications.line1}<br/><br/>

                    {i18n.help.implications.line2}
                </span>
                <div className="help-img-container"><img className="help-img" src={implicationsImg}/></div></>
            )
        }
        if (helpTab === "users") {
            return (
                <><span className="help-heading">{i18n.help.users.title}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.users.userLevels.header}<br/><br/>

                    <span className="help-alt">{Object.keys(i18n.help.users.userLevels.items)[0]}</span>{Object.values(i18n.help.users.userLevels.items)[0]}<br/>
                    <span className="help-alt user-color">{Object.keys(i18n.help.users.userLevels.items)[1]}</span>{Object.values(i18n.help.users.userLevels.items)[1]}<br/>
                    <span className="help-alt premium-color">{Object.keys(i18n.help.users.userLevels.items)[2]}</span>{Object.values(i18n.help.users.userLevels.items)[2]}<br/>
                    <span className="help-alt contributor-color">{Object.keys(i18n.help.users.userLevels.items)[3]}</span>{Object.values(i18n.help.users.userLevels.items)[3]}<br/>
                    <span className="help-alt curator-color">{Object.keys(i18n.help.users.userLevels.items)[4]}</span>{Object.values(i18n.help.users.userLevels.items)[4]}<br/>
                    <span className="help-alt mod-color">{Object.keys(i18n.help.users.userLevels.items)[5]}</span>{Object.values(i18n.help.users.userLevels.items)[5]}<br/>
                    <span className="help-alt admin-color">{Object.keys(i18n.help.users.userLevels.items)[6]}</span>{Object.values(i18n.help.users.userLevels.items)[6]}<br/>
                    <span className="help-alt system-color">{Object.keys(i18n.help.users.userLevels.items)[7]}</span>{Object.values(i18n.help.users.userLevels.items)[7]}<br/><br/>


                    {i18n.help.users.line1}<br/><br/>

                    <span className="help-alt">{i18n.help.users.avatars.title}</span><br/>
                    {i18n.help.users.avatars.line1}<br/><br/>

                    {i18n.help.users.avatars.line2}
                </span>
                <div className="help-img-container"><img className="help-img" src={setAvatarImg}/></div></>
            )
        }
        if (helpTab === "tooltips") {
            return (
                <><span className="help-heading">{i18n.help.tooltips.title}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.tooltips.line1}<br/>
                </span>
                <div className="help-img-container"><img className="help-img" src={tooltipsImg}/></div></>
            )
        }
        if (helpTab === "commenting") {
            return (
                <><span className="help-heading">{i18n.help.commenting.title}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.commenting.rules.header}<br/>
                    <span className="help-alt">
                    {i18n.help.commenting.rules.rule1}<br/>
                    {i18n.help.commenting.rules.rule2}<br/>
                    {i18n.help.commenting.rules.rule3}<br/>
                    {i18n.help.commenting.rules.rule4}<br/>
                    {i18n.help.commenting.rules.rule5}<br/><br/>
                    </span>

                    <span className="help-alt">{i18n.help.commenting.moetext.title}</span><br/>
                    {i18n.help.commenting.moetext.header}<br/><br/>

                    {i18n.help.commenting.moetext.quotes.title}<br/>
                    <span className="help-alt">
                    {i18n.help.commenting.moetext.quotes.line1}<br/>
                    {i18n.help.commenting.moetext.quotes.line2}<br/>
                    </span>

                    {i18n.help.commenting.moetext.highlight.title}
                    <span className="help-alt" style={{marginLeft: "10px"}}>
                    {i18n.help.commenting.moetext.highlight.line1}<br/>
                    </span>

                    {i18n.help.commenting.moetext.bold.title}
                    <span className="help-alt" style={{marginLeft: "10px"}}>
                    {i18n.help.commenting.moetext.bold.line1}<br/>
                    </span>

                    {i18n.help.commenting.moetext.italic.title}
                    <span className="help-alt" style={{marginLeft: "10px"}}>
                    {i18n.help.commenting.moetext.italic.line1}<br/>
                    </span>

                    {i18n.help.commenting.moetext.underline.title}
                    <span className="help-alt" style={{marginLeft: "10px"}}>
                    {i18n.help.commenting.moetext.underline.line1}<br/>
                    </span>

                    {i18n.help.commenting.moetext.strikethrough.title}
                    <span className="help-alt" style={{marginLeft: "10px"}}>
                    {i18n.help.commenting.moetext.strikethrough.line1}<br/>
                    </span>

                    {i18n.help.commenting.moetext.spoiler.title}
                    <span className="help-alt" style={{marginLeft: "10px"}}>
                    {i18n.help.commenting.moetext.spoiler.line1}<br/>
                    </span>

                    {i18n.help.commenting.moetext.dropdown.title}
                    <span className="help-alt" style={{marginLeft: "10px"}}>
                    {i18n.help.commenting.moetext.dropdown.line1}<br/>
                    </span>

                    {i18n.help.commenting.moetext.color.title}
                    <span className="help-alt" style={{marginLeft: "10px"}}>
                    {i18n.help.commenting.moetext.color.line1}<br/>
                    </span>

                    {i18n.help.commenting.moetext.code.title}
                    <span className="help-alt" style={{marginLeft: "10px"}}>
                    {i18n.help.commenting.moetext.code.line1}<br/>
                    </span>

                    {i18n.help.commenting.moetext.mention.title}
                    <span className="help-alt" style={{marginLeft: "10px"}}>
                    {i18n.help.commenting.moetext.mention.line1}<br/>
                    </span>

                    {i18n.help.commenting.moetext.emojis.title}
                    <span className="help-alt" style={{marginLeft: "10px"}}>
                    {i18n.help.commenting.moetext.emojis.line1}<br/><br/>
                    </span>

                    {i18n.help.commenting.moetext.images.header}
                </span>
                <div className="help-img-container"><img className="help-img" src={emojisImg}/></div></>
            )
        }
        if (helpTab === "bans") {
            return (
                <><span className="help-heading">{i18n.help.bans.title}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.bans.line1}<br/><br/>

                    {i18n.help.bans.banActions.header}<br/>
                    <span className="help-alt">
                    {i18n.help.bans.banActions.action1}<br/>
                    {i18n.help.bans.banActions.action2}<br/>
                    {i18n.help.bans.banActions.action3}<br/><br/>
                    </span>

                    {i18n.help.bans.line2}
                </span></>
            )
        }
        if (helpTab === "captcha") {
            return (
                <><span className="help-heading">{i18n.help.captcha.title}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.captcha.line1}<br/><br/>
                    
                    {i18n.help.captcha.line2}<br/><br/>
                </span>
                <div className="help-img-container"><img className="help-img" src={captchaImg}/></div></>
            )
        }
        if (helpTab === "language") {
            return (
                <><span className="help-heading">{i18n.help.language.title}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.language.line1}<br/><br/>
                </span>
                <div className="help-img-container"><img className="help-img" src={languageImg}/></div></>
            )
        }
        if (helpTab === "account-deletion") {
            return (
                <><span className="help-heading">{i18n.help.accountDeletion.title}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.accountDeletion.line1}<br/><br/>
                </span></>
            )
        }
        if (helpTab === "copyright-removal") {
            return (
                <><span className="help-heading">{i18n.pages.copyrightRemoval.title}</span>
                <span className="help-text" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    {i18n.help.copyrightRemoval.line1}<br/><br/>

                    {i18n.help.copyrightRemoval.submitForm}
                    <a className="help-link" onClick={() => history.push("/copyright-removal")}>{mobile ? i18n.help.copyrightRemoval.copyrightForm : `${functions.getDomain()}/copyright-removal`}</a>
                    {i18n.help.copyrightRemoval.emailUs}<br/><br/>

                    {i18n.help.copyrightRemoval.line2}<br/><br/>

                    {i18n.terms.tos.copyrightTakedown.goText}<br/>
                </span></>
            )
        }
    }
    
    return (
        <>
        <CaptchaDialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="help">
                    <div className="help-nav">
                        <span className="help-nav-text" onClick={() => setHelpTab("help")}>{i18n.navbar.help}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("searching")}>{i18n.help.searching.title}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("image-searching")}>{i18n.help.imageSearching.title}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("filters")}>{i18n.filters.filters}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("custom-players")}>{i18n.help.customPlayers.title}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("music")}>{i18n.help.music.title}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("notes")}>{i18n.navbar.notes}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("overlay-notes")}>{i18n.help.overlayNotes.title}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("character-notes")}>{i18n.help.characterNotes.title}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("favorites")}>{i18n.sort.favorites}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("favgroups")}>{i18n.help.favoriteGroups.title}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("cuteness")}>{i18n.sort.cuteness}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("uploading")}>{i18n.help.uploading.title}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("tagging")}>{i18n.help.tagging.title}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("self-uploads")}>{i18n.help.selfUploads.title}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("upscaling")}>{i18n.help.upscaling.title}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("compressing")}>{i18n.help.compressing.title}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("pixiv-downloads")}>{i18n.help.pixivDownloads.title}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("bookmarklet")}>{i18n.help.bookmarklet.title}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("variations")}>{i18n.sort.variations}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("child-posts")}>{i18n.post.childPosts}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("groups")}>{i18n.sort.groups}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("aliases")}>{i18n.sort.aliases}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("implications")}>{i18n.labels.implications}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("users")}>{i18n.help.users.title}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("tooltips")}>{i18n.help.tooltips.title}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("commenting")}>{i18n.help.commenting.title}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("bans")}>{i18n.help.bans.title}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("captcha")}>{i18n.help.captcha.title}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("language")}>{i18n.help.language.title}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("account-deletion")}>{i18n.help.accountDeletion.title}</span>
                        <span className="help-nav-text" onClick={() => setHelpTab("copyright-removal")}>{i18n.pages.copyrightRemoval.title}</span>
                    </div>
                    <div className="help-container">
                        {getContainerJSX()}
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default HelpPage