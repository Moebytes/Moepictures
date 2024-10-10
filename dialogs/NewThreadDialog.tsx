import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, ShowNewThreadDialogContext, HideTitlebarContext, 
SessionContext, SiteHueContext, SiteLightnessContext, SiteSaturationContext, SessionFlagContext} from "../Context"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/dialog.less"

const NewThreadDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {showNewThreadDialog, setShowNewThreadDialog} = useContext(ShowNewThreadDialogContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const [threadTitle, setThreadTitle] = useState("")
    const [threadContent, setThreadContent] = useState("")
    const [captchaResponse, setCaptchaResponse] = useState("")
    const [captcha, setCaptcha] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const getCaptchaColor = () => {
        if (theme.includes("light")) return "#ffffff"
        return "#09071c"
    }

    const updateCaptcha = async () => {
        const captcha = await functions.get("/api/misc/captcha/create", {color: getCaptchaColor()}, session, setSessionFlag)
        setCaptcha(captcha)
        setCaptchaResponse("")
    }

    useEffect(() => {
        updateCaptcha()
    }, [session, theme])

    useEffect(() => {
        document.title = "New Thread"
    }, [])

    useEffect(() => {
        if (showNewThreadDialog) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [showNewThreadDialog])

    const newThread = async () => {
        const badTitle = functions.validateTitle(threadContent)
        if (badTitle) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badTitle
            await functions.timeout(2000)
            return setError(false)
        }
        const badContent = functions.validateThread(threadContent)
        if (badContent) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badContent
            await functions.timeout(2000)
            return setError(false)
        }
        try {
            const thread = await functions.post("/api/thread/create", {title: threadTitle, content: threadContent, captchaResponse}, session, setSessionFlag)
            setShowNewThreadDialog(false)
            if (thread.threadID) history.push(`/thread/${thread.threadID}`)
        } catch {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "Bad content or captcha."
            await functions.timeout(2000)
            setError(false)
            updateCaptcha()
            setCaptchaResponse("")
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            newThread()
        } else {
            setShowNewThreadDialog(false)
        }
    }

    if (showNewThreadDialog) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">New Thread</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Title: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={threadTitle} onChange={(event) => setThreadTitle(event.target.value)}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Content: </span>
                        </div>
                        <div className="dialog-row">
                            <textarea className="dialog-textarea" style={{resize: "vertical", height: "330px"}} spellCheck={false} value={threadContent} onChange={(event) => setThreadContent(event.target.value)}></textarea>
                        </div>
                            <div className="dialog-row" style={{pointerEvents: "all"}}>
                                <img src={`data:image/svg+xml;utf8,${encodeURIComponent(captcha)}`} style={{filter: getFilter()}}/>
                                <input className="dialog-input-taller" type="text" spellCheck={false} value={captchaResponse} onChange={(event) => setCaptchaResponse(event.target.value)}/>
                            </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Post"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default NewThreadDialog