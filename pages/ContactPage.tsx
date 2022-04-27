import React, {useEffect, useContext, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import XButton from "../assets/purple/x-button.png"
import XButtonPurpleLight from "../assets/purple-light/x-button.png"
import XButtonMagenta from "../assets/magenta/x-button.png"
import XButtonMagentaLight from "../assets/magenta-light/x-button.png"
import DragAndDrop from "../components/DragAndDrop"
import functions from "../structures/Functions"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, MobileContext,
RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext} from "../Context"
import axios from "axios"
import "./styles/contactpage.less"

const ContactPage: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const [files, setFiles] = useState([]) as any
    const [email, setEmail] = useState("")
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const errorRef = useRef(null) as any
    const history = useHistory()

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        setEnableDrag(false)
        document.title = "Moebooru: Contact"
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    const fileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files?.[0]) return
        const fileArray = Array.from(event.target.files)
        const acceptedFiles = [] as any
        for (let i = 0; i < fileArray.length; i++) {
            const MB = fileArray[i].size / (1024*1024)
            if (MB > 25) continue
            let obj = {} as any
            obj.bytes = Object.values(new Uint8Array(await fileArray[i].arrayBuffer()))
            obj.name = fileArray[i].name
            acceptedFiles.push(obj)
        }
        setFiles([...files, ...acceptedFiles])
    }
    
    const getX = () => {
        if (theme === "purple") return XButton
        if (theme === "purple-light") return XButtonPurpleLight
        if (theme === "magenta") return XButtonMagenta
        if (theme === "magenta-light") return XButtonMagentaLight
        return XButton
    }

    const submit = async () => {
        const badEmail = functions.validateEmail(email)
        if (badEmail) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badEmail
            await functions.timeout(2000)
            setError(false)
            return
        }
        const badMessage = functions.validateMessage(message)
        if (badMessage) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badMessage
            await functions.timeout(2000)
            setError(false)
            return
        }
        setError(true)
        if (!errorRef.current) await functions.timeout(20)
        errorRef.current!.innerText = "Submitting..."
        try {
            await axios.post("/api/misc/contact", {email, subject, message, files}, {withCredentials: true})
            setSubmitted(true)
            setError(false)
        } catch {
            errorRef.current!.innerText = "Bad email or message."
            await functions.timeout(2000)
            setError(false)
        }
    }

    const generateFilesJSX = () => {
        let jsx = [] as any
        console.log(files)
        for (let i = 0; i < files.length; i++) {
            const deleteFile = () => {
                files.splice(i, 1)
                setFiles(files)
                forceUpdate()
            }
            jsx.push(<>
                    <span className="contact-text-small">{files[i].name}</span>
                    <img className="x-button" src={getX()} onClick={() => deleteFile()}/>
                </>
            )
        }
        return jsx
    }

    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="contact">
                    <span className="contact-title">Contact</span>
                    {submitted ? <>
                    <span className="contact-link">Your message was delivered.</span>
                    <div className="contact-button-container-left">
                        <button className="contact-button" onClick={() => history.push("/posts")}>←Back</button>
                    </div>
                    </> : <>
                    <span className="contact-link">
                        If you are contacting for copyright reasons, you must provide the following: <br/>
                        <span className="contact-text-alt">
                        ⇾ Contact information (Name, Mailing Address, Phone Number, Email)<br/>
                        ⇾ Proof of your identity<br/>
                        ⇾ Links to the infringing content<br/>
                        ⇾ A statement affirming that you are the copyright holder of the content in question<br/>
                        </span>
                        These are acceptable proofs of identity:<br/>
                        <span className="contact-text-alt">
                        ⇾ <span className="contact-weblink" onClick={() => functions.twitterLink()}>Private message us on Twitter</span><br/>
                        ⇾ Attach a source file to one of your works which isn't available publicly<br/>
                        </span>
                        We do not remove material not protected by copyright, such as your artist tag and social links.
                    </span>
                    <div className="contact-row">
                        <span className="contact-text">Email:</span>
                        <input className="contact-input" type="text" spellCheck={false} value={email} onChange={(event) => setEmail(event.target.value)}/>
                    </div>
                    <div className="contact-row">
                        <span className="contact-text">Subject:</span>
                        <input className="contact-input" type="text" spellCheck={false} value={subject} onChange={(event) => setSubject(event.target.value)}/>
                    </div>
                    <div className="contact-row">
                        <span className="contact-text">Attach Files:</span>
                        <label htmlFor="contact-file-upload" className="contact-file-input">Select Files</label>
                        <input id="contact-file-upload" type="file" multiple onChange={(event) => fileUpload(event)}/>
                        {generateFilesJSX()}
                    </div>
                    <div className="contact-row-start">
                        <span className="contact-text">Message:</span>
                        <textarea className="contact-textarea" spellCheck={false} value={message} onChange={(event) => setMessage(event.target.value)}></textarea>
                    </div>
                    {error ? <div className="contact-validation-container"><span className="contact-validation" ref={errorRef}></span></div> : null}
                    <div className="contact-button-container">
                        <button className="contact-button" onClick={submit}>Send Message</button>
                    </div>
                    </> }
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default ContactPage