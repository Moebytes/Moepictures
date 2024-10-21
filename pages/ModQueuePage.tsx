import React, {useEffect, useContext, useReducer, useState} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import {HideNavbarContext, HideSidebarContext, SquareContext, RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext, 
MobileContext, SessionContext, ModStateContext, SiteHueContext, SiteSaturationContext, SiteLightnessContext} from "../Context"
import permissions from "../structures/Permissions"
import ModPosts from "../components/ModPosts"
import ModPostEdits from "../components/ModPostEdits"
import ModPostDeletions from "../components/ModPostDeletions"
import ModTagDeletions from "../components/ModTagDeletions"
import ModTagAliases from "../components/ModTagAliases"
import ModTagEdits from "../components/ModTagEdits"
import ModTranslations from "../components/ModTranslations"
import ModGroupDeletions from "../components/ModGroupDeletions"
import ModGroupEdits from "../components/ModGroupEdits"
import ModReports from "../components/ModReports"
import functions from "../structures/Functions"
import modPostUploadIcon from "../assets/icons/mod-post-upload.png"
import modPostEditIcon from "../assets/icons/mod-post-edit.png"
import modPostDeleteIcon from "../assets/icons/mod-post-delete.png"
import modTagEditIcon from "../assets/icons/mod-tag-edit.png"
import modTagAliasIcon from "../assets/icons/mod-tag-alias.png"
import modTagDeleteIcon from "../assets/icons/mod-tag-delete.png"
import modGroupEditIcon from "../assets/icons/mod-group-edit.png"
import modGroupDeleteIcon from "../assets/icons/mod-group-delete.png"
import modTranslationIcon from "../assets/icons/history-translate.png"
import modReportIcon from "../assets/icons/mod-report.png"
import modPostUploadActiveIcon from "../assets/icons/mod-post-upload-active.png"
import modPostEditActiveIcon from "../assets/icons/mod-post-edit-active.png"
import modPostDeleteActiveIcon from "../assets/icons/mod-post-delete-active.png"
import modTagEditActiveIcon from "../assets/icons/mod-tag-edit-active.png"
import modTagAliasActiveIcon from "../assets/icons/mod-tag-alias-active.png"
import modTagDeleteActiveIcon from "../assets/icons/mod-tag-delete-active.png"
import modGroupEditActiveIcon from "../assets/icons/mod-group-edit-active.png"
import modGroupDeleteActiveIcon from "../assets/icons/mod-group-delete-active.png"
import modTranslationActiveIcon from "../assets/icons/history-translate-active.png"
import modReportActiveIcon from "../assets/icons/mod-report-active.png"
import "./styles/modqueuepage.less"

const ModQueuePage: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {square, setSquare} = useContext(SquareContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {session, setSession} = useContext(SessionContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {modState, setModState} = useContext(ModStateContext)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        const savedState = localStorage.getItem("modState")
        if (savedState) setModState(savedState)
    }, [])

    useEffect(() => {
        localStorage.setItem("modState", modState)
    }, [modState])

    useEffect(() => {
        setRelative(false)
        setHideNavbar(false)
        setHeaderText("")
        setSidebarText("")
        document.title = "Mod Queue"
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        if (!session.cookie) return
        if (!permissions.isMod(session)) {
            functions.replaceLocation("/401")
        }
    }, [session])

    const generateModJSX = () => {
        if (modState === "posts") return <ModPosts/>
        if (modState === "post-edits") return <ModPostEdits/>
        if (modState === "post-deletions") return <ModPostDeletions/>
        if (modState === "tag-edits") return <ModTagEdits/>
        if (modState === "tag-aliases") return <ModTagAliases/>
        if (modState === "tag-deletions") return <ModTagDeletions/>
        if (modState === "group-edits") return <ModGroupEdits/>
        if (modState === "group-deletions") return <ModGroupDeletions/>
        if (modState === "translations") return <ModTranslations/>
        if (modState === "reports") return <ModReports/>
        return null
    }

    const getText = () => {
        if (modState === "posts") return "Posts"
        if (modState === "post-edits") return "Post Edits"
        if (modState === "post-deletions") return "Post Deletions"
        if (modState === "tag-edits") return "Tag Edits"
        if (modState === "tag-aliases") return "Tag Aliases"
        if (modState === "tag-deletions") return "Tag Deletions"
        if (modState === "group-edits") return "Group Edits"
        if (modState === "group-deletions") return "Group Deletions"
        if (modState === "translations") return "Translations"
        if (modState === "reports") return "Reports"
        return ""
    }

    if (!session.cookie) return null

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="modqueue">
                    {mobile ? <>
                    <div className="modqueue-icons">
                        <img className="modqueue-icon" src={modState === "posts" ? modPostUploadActiveIcon : modPostUploadIcon} 
                        style={{filter: modState === "posts" ? "" : getFilter()}} onClick={() => setModState("posts")}/>
                        <img className="modqueue-icon" src={modState === "post-edits" ? modPostEditActiveIcon : modPostEditIcon} 
                        style={{filter: modState === "post-edits" ? "" : getFilter()}} onClick={() => setModState("post-edits")}/>
                        {permissions.isAdmin(session) ? 
                            <img className="modqueue-icon" src={modState === "post-deletions" ? modPostDeleteActiveIcon : modPostDeleteIcon} 
                            style={{filter: modState === "post-deletions" ? "" : getFilter()}} onClick={() => setModState("post-deletions")}/> 
                        : null}
                    </div>
                    <div className="modqueue-icons">
                        <img className="modqueue-icon" src={modState === "tag-edits" ? modTagEditActiveIcon : modTagEditIcon} 
                        style={{filter: modState === "tag-edits" ? "" : getFilter()}} onClick={() => setModState("tag-edits")}/>
                        <img className="modqueue-icon" src={modState === "tag-aliases" ? modTagAliasActiveIcon : modTagAliasIcon} 
                        style={{filter: modState === "tag-aliases" ? "" : getFilter()}} onClick={() => setModState("tag-aliases")}/>
                        <img className="modqueue-icon" src={modState === "tag-deletions" ? modTagDeleteActiveIcon : modTagDeleteIcon} 
                        style={{filter: modState === "tag-deletions" ? "" : getFilter()}} onClick={() => setModState("tag-deletions")}/>
                    </div>
                    <div className="modqueue-icons">
                        <img className="modqueue-icon" src={modState === "group-edits" ? modGroupEditActiveIcon : modGroupEditIcon} 
                        style={{filter: modState === "group-edits" ? "" : getFilter()}} onClick={() => setModState("group-edits")}/>
                        <img className="modqueue-icon" src={modState === "group-deletions" ? modGroupDeleteActiveIcon : modGroupDeleteIcon} 
                        style={{filter: modState === "group-deletions" ? "" : getFilter()}} onClick={() => setModState("group-deletions")}/>
                    </div>
                    <div className="modqueue-icons">
                        <img className="modqueue-icon" src={modState === "translations" ? modTranslationActiveIcon : modTranslationIcon} 
                        style={{filter: modState === "translations" ? "" : getFilter()}} onClick={() => setModState("translations")}/>
                        <img className="modqueue-icon" src={modState === "reports" ? modReportActiveIcon : modReportIcon} 
                        style={{filter: modState === "reports" ? "" : getFilter()}} onClick={() => setModState("reports")}/>
                    </div>
                    </> : <>
                    <div className="modqueue-icons">
                        <img className="modqueue-icon" src={modState === "posts" ? modPostUploadActiveIcon : modPostUploadIcon} 
                        style={{filter: modState === "posts" ? "" : getFilter()}} onClick={() => setModState("posts")}/>
                        <img className="modqueue-icon" src={modState === "post-edits" ? modPostEditActiveIcon : modPostEditIcon} 
                        style={{filter: modState === "post-edits" ? "" : getFilter()}} onClick={() => setModState("post-edits")}/>
                        {permissions.isAdmin(session) ? 
                            <img className="modqueue-icon" src={modState === "post-deletions" ? modPostDeleteActiveIcon : modPostDeleteIcon} 
                            style={{filter: modState === "post-deletions" ? "" : getFilter()}} onClick={() => setModState("post-deletions")}/> 
                        : null}
                        <img className="modqueue-icon" src={modState === "tag-edits" ? modTagEditActiveIcon : modTagEditIcon} 
                        style={{filter: modState === "tag-edits" ? "" : getFilter()}} onClick={() => setModState("tag-edits")}/>
                        <img className="modqueue-icon" src={modState === "tag-aliases" ? modTagAliasActiveIcon : modTagAliasIcon} 
                        style={{filter: modState === "tag-aliases" ? "" : getFilter()}} onClick={() => setModState("tag-aliases")}/>
                        <img className="modqueue-icon" src={modState === "tag-deletions" ? modTagDeleteActiveIcon : modTagDeleteIcon} 
                        style={{filter: modState === "tag-deletions" ? "" : getFilter()}} onClick={() => setModState("tag-deletions")}/>
                        <img className="modqueue-icon" src={modState === "group-edits" ? modGroupEditActiveIcon : modGroupEditIcon} 
                        style={{filter: modState === "group-edits" ? "" : getFilter()}} onClick={() => setModState("group-edits")}/>
                        <img className="modqueue-icon" src={modState === "group-deletions" ? modGroupDeleteActiveIcon : modGroupDeleteIcon} 
                        style={{filter: modState === "group-deletions" ? "" : getFilter()}} onClick={() => setModState("group-deletions")}/>
                        <img className="modqueue-icon" src={modState === "translations" ? modTranslationActiveIcon : modTranslationIcon} 
                        style={{filter: modState === "translations" ? "" : getFilter()}} onClick={() => setModState("translations")}/>
                        <img className="modqueue-icon" src={modState === "reports" ? modReportActiveIcon : modReportIcon} 
                        style={{filter: modState === "reports" ? "" : getFilter()}} onClick={() => setModState("reports")}/>
                    </div></>}
                    <div className="modqueue-heading-container">
                        <span className="modqueue-heading">{getText()}</span>
                    </div>
                    {generateModJSX()}
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default ModQueuePage