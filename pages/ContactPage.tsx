import React, {useEffect, useContext, useState} from "react"
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
import "./styles/contactpage.less"

const ContactPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [clicked, setClicked] = useState(false)
    const [filename, setFileName] = useState("")

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        document.title = "Moebooru: Contact"
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    const fileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files)
            setFileName(files[0].name)
        }
    }
    
    const getX = () => {
        if (theme === "purple") return XButton
        if (theme === "purple-light") return XButtonPurpleLight
        if (theme === "magenta") return XButtonMagenta
        if (theme === "magenta-light") return XButtonMagentaLight
        return XButton
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
                    {clicked ? <>
                    <span className="contact-link">Your message has been delivered.</span>
                    <div className="contact-button-container-left">
                        <button className="contact-button" onClick={() => setClicked(false)}>←Back</button>
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
                        <span className="contact-text">Subject:</span>
                        <input className="contact-input" type="text" spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}/>
                    </div>
                    <div className="contact-row">
                        <span className="contact-text">Attach File:</span>
                        <label htmlFor="contact-file-upload" className="contact-file-input">Select File</label>
                        <span className="contact-text-small">{filename}</span>
                        <input id="contact-file-upload" type="file" onChange={(event) => fileUpload(event)}/>
                        {filename ? <img className="x-button" src={getX()} onClick={() => setFileName("")}/> : null}
                    </div>
                    <div className="contact-row-start">
                        <span className="contact-text">Message:</span>
                        <textarea className="contact-textarea" spellCheck={false} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}></textarea>
                    </div>
                    <div className="contact-button-container">
                        <button className="contact-button" onClick={() => setClicked(true)}>Send Message</button>
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