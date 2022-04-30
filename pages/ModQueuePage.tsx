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
        setRelative(false)
        setHideNavbar(false)
        setHeaderText("")
        setSidebarText("")
        document.title = "Moebooru: Mod Queue"
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
        if (!permissions.isStaff(session)) {
            history.push("/403")
        }
    }, [session])

    const generateModJSX = () => {
        if (modState === "posts") return <ModPosts/>
        if (modState === "post-edits") return <ModPostEdits/>
        if (modState === "post-deletions") return <ModPostDeletions/>
        if (modState === "tag-edits") return <ModTagEdits/>
        if (modState === "tag-aliasing") return <ModTagAliases/>
        if (modState === "tag-deletions") return <ModTagDeletions/>
        if (modState === "reported-comments") return null
        return null
    }

    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="modqueue">
                    <div className="modqueue-buttons">
                        <div className={`modqueue-button ${modState === "posts" ? "modqueue-button-active" : ""}`} onClick={() => setModState("posts")}>Posts</div>
                        <div className={`modqueue-button ${modState === "post-edits" ? "modqueue-button-active" : ""}`} onClick={() => setModState("post-edits")}>Post Edits</div>
                        <div className={`modqueue-button ${modState === "post-deletions" ? "modqueue-button-active" : ""}`} onClick={() => setModState("post-deletions")}>Post Deletions</div>
                        <div className={`modqueue-button ${modState === "tag-edits" ? "modqueue-button-active" : ""}`} onClick={() => setModState("tag-edits")}>Tag Edits</div>
                        <div className={`modqueue-button ${modState === "tag-aliasing" ? "modqueue-button-active" : ""}`} onClick={() => setModState("tag-aliasing")}>Tag Aliasing</div>
                        <div className={`modqueue-button ${modState === "tag-deletions" ? "modqueue-button-active" : ""}`} onClick={() => setModState("tag-deletions")}>Tag Deletions</div>
                        <div className={`modqueue-button ${modState === "reported-comments" ? "modqueue-button-active" : ""}`} onClick={() => setModState("reported-comments")}>Reported Comments</div>
                    </div>
                    <div className="modqueue-line"></div>
                    {generateModJSX()}
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default ModQueuePage