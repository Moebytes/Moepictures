import React, {useEffect, useContext, useReducer, useState} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import DragAndDrop from "../components/DragAndDrop"
import {HideNavbarContext, HideSidebarContext, SquareContext, RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext, 
MobileContext, SessionContext, ModStateContext} from "../Context"
import permissions from "../structures/Permissions"
import ModPosts from "../components/ModPosts"
import ModPostEdits from "../components/ModPostEdits"
import ModPostDeletions from "../components/ModPostDeletions"
import ModTagDeletions from "../components/ModTagDeletions"
import ModTagAliases from "../components/ModTagAliases"
import ModTagEdits from "../components/ModTagEdits"
import ModTranslations from "../components/ModTranslations"
import ModReports from "../components/ModReports"
import functions from "../structures/Functions"
import "./styles/modqueuepage.less"

const ModQueuePage: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
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
        if (!permissions.isElevated(session)) {
            functions.replaceLocation("/401")
        }
    }, [session])

    const generateModJSX = () => {
        if (modState === "posts") return <ModPosts/>
        if (modState === "post-edits") return <ModPostEdits/>
        if (modState === "post-deletions") return <ModPostDeletions/>
        if (modState === "tag-edits") return <ModTagEdits/>
        if (modState === "tag-aliasing") return <ModTagAliases/>
        if (modState === "tag-deletions") return <ModTagDeletions/>
        if (modState === "translations") return <ModTranslations/>
        if (modState === "reports") return <ModReports/>
        return null
    }
    if (!session.cookie) return null
    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="modqueue">
                    {mobile ? <>
                    <div className="modqueue-buttons">
                        <div className={`modqueue-button ${modState === "posts" ? "modqueue-button-active" : ""}`} onClick={() => setModState("posts")}>Posts</div>
                        <div className={`modqueue-button ${modState === "post-edits" ? "modqueue-button-active" : ""}`} onClick={() => setModState("post-edits")}>Post Edits</div>
                    </div>
                    <div className="modqueue-buttons">
                        {permissions.isAdmin(session) ? <div className={`modqueue-button ${modState === "post-deletions" ? "modqueue-button-active" : ""}`} onClick={() => setModState("post-deletions")}>Post Deletions</div> : null}
                        <div className={`modqueue-button ${modState === "tag-aliasing" ? "modqueue-button-active" : ""}`} onClick={() => setModState("tag-aliasing")}>Tag Aliasing</div>
                    </div>
                    <div className="modqueue-buttons">
                        <div className={`modqueue-button ${modState === "tag-deletions" ? "modqueue-button-active" : ""}`} onClick={() => setModState("tag-deletions")}>Tag Deletions</div>
                        <div className={`modqueue-button ${modState === "reports" ? "modqueue-button-active" : ""}`} onClick={() => setModState("reports")}>Reports</div>
                    </div>
                    </> : <>
                    <div className="modqueue-buttons">
                        <div className={`modqueue-button ${modState === "posts" ? "modqueue-button-active" : ""}`} onClick={() => setModState("posts")}>Posts</div>
                        <div className={`modqueue-button ${modState === "post-edits" ? "modqueue-button-active" : ""}`} onClick={() => setModState("post-edits")}>Post Edits</div>
                        {permissions.isAdmin(session) ? <div className={`modqueue-button ${modState === "post-deletions" ? "modqueue-button-active" : ""}`} onClick={() => setModState("post-deletions")}>Post Deletions</div> : null}
                        {/* <div className={`modqueue-button ${modState === "tag-edits" ? "modqueue-button-active" : ""}`} onClick={() => setModState("tag-edits")}>Tag Edits</div> */}
                        <div className={`modqueue-button ${modState === "tag-aliasing" ? "modqueue-button-active" : ""}`} onClick={() => setModState("tag-aliasing")}>Tag Aliasing</div>
                        <div className={`modqueue-button ${modState === "tag-deletions" ? "modqueue-button-active" : ""}`} onClick={() => setModState("tag-deletions")}>Tag Deletions</div>
                        {/* <div className={`modqueue-button ${modState === "translations" ? "modqueue-button-active" : ""}`} onClick={() => setModState("translations")}>Translations</div> */}
                        <div className={`modqueue-button ${modState === "reports" ? "modqueue-button-active" : ""}`} onClick={() => setModState("reports")}>Reports</div>
                    </div>
                    <div className="modqueue-line"></div> </>}
                    {generateModJSX()}
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default ModQueuePage