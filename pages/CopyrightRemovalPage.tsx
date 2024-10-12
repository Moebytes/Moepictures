import React, {useEffect, useContext, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import XButton from "../assets/icons/x-button.png"
import DragAndDrop from "../components/DragAndDrop"
import functions from "../structures/Functions"
import checkbox from "../assets/icons/checkbox.png"
import checkboxChecked from "../assets/icons/checkbox-checked.png"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, MobileContext,
RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext, SiteHueContext, SiteLightnessContext,
SiteSaturationContext, SessionContext, SessionFlagContext} from "../Context"
import "./styles/contactpage.less"

const CopyrightRemovalPage: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const [files, setFiles] = useState([]) as any
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [artistTag, setArtistTag] = useState("")
    const [socialMediaLinks, setSocialMediaLinks] = useState("")
    const [postLinks, setPostLinks] = useState("")
    const [proofLinks, setProofLinks] = useState("")
    const [signature, setSignature] = useState("")
    const [attestUnauthorized, setAttestUnauthorized] = useState(false)
    const [attestAccuracy, setAttestAccuracy] = useState(false)
    const [removeAllRequest, setRemoveAllRequest] = useState(false)
    const errorRef = useRef(null) as any
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        setEnableDrag(false)
        document.title = "Copyright Removal"
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
    
    const submit = async () => {
        if (!name) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "Name is required."
            await functions.timeout(2000)
            setError(false)
            return
        }
        const badEmail = functions.validateEmail(email)
        if (badEmail) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badEmail
            await functions.timeout(2000)
            setError(false)
            return
        }
        if (!artistTag) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "Artist tag is required."
            await functions.timeout(2000)
            setError(false)
            return
        }
        if (!socialMediaLinks) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "Social media links are required."
            await functions.timeout(2000)
            setError(false)
            return
        }
        if (!postLinks) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "Post links are required."
            await functions.timeout(2000)
            setError(false)
            return
        }
        if (!files.length && !proofLinks) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "Providing a proof attachment or links is required."
            await functions.timeout(2000)
            setError(false)
            return
        }
        if (!signature) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "Signature is required."
            await functions.timeout(2000)
            setError(false)
            return
        }
        if (!attestUnauthorized) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "You must attest that the use of the materials is unauthorized."
            await functions.timeout(2000)
            setError(false)
            return
        }
        if (!attestAccuracy) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "You must attest that the provided information is accurate."
            await functions.timeout(2000)
            setError(false)
            return
        }
        setError(true)
        if (!errorRef.current) await functions.timeout(20)
        errorRef.current!.innerText = "Submitting..."
        try {
            await functions.post("/api/misc/copyright", {name, email, artistTag, socialMediaLinks, removeAllRequest, postLinks, proofLinks, signature, files}, session, setSessionFlag)
            setSubmitted(true)
            setError(false)
        } catch {
            errorRef.current!.innerText = "There was an error sending the message."
            await functions.timeout(2000)
            setError(false)
        }
    }

    const generateFilesJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < files.length; i++) {
            const deleteFile = () => {
                files.splice(i, 1)
                setFiles(files)
                forceUpdate()
            }
            jsx.push(<>
                    <span className="contact-text-small">{files[i].name}</span>
                    <img className="x-button" src={XButton} style={{filter: getFilter()}} onClick={() => deleteFile()}/>
                </>
            )
        }
        return jsx
    }

    const getRemovalTypeJSX = () => {
        if (removeAllRequest) {
            return (
                <><div className="contact-row">
                    <span className="contact-text-alt">
                    Please provide the link to your artist tag page.<br/>
                    </span>
                </div>
                <div className="contact-row-start">
                    <span className="contact-text" style={{width: "200px"}}>Artist Tag Page:</span>
                </div>
                <div className="contact-row-start">
                    <input className="contact-input-small" style={{marginLeft: "0px", width: "50%"}} type="text" spellCheck={false} value={postLinks} onChange={(event) => setPostLinks(event.target.value)}/>
                </div></>
            )
        } else {
            return (
                <><div className="contact-row">
                    <span className="contact-text-alt">
                    Please provide all the post links that you want removed.<br/>
                    </span>
                </div>
                <div className="contact-row-start">
                    <span className="contact-text" style={{width: "200px"}}>Post Links:</span>
                </div>
                <div className="contact-row-start">
                    <textarea className="contact-textarea" style={{marginLeft: "0px", height: "100px"}} spellCheck={false} value={postLinks} onChange={(event) => setPostLinks(event.target.value)}></textarea>
                </div></>
            )
        }
    }

    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="contact" style={{height: "max-content"}}>
                    <span className="contact-title">Copyright Removal</span>
                    {submitted ? <>
                    <span className="contact-link">Your removal request was delivered.</span>
                    <div className="contact-button-container-left">
                        <button className="contact-button" onClick={() => history.push("/posts")}>←Back</button>
                    </div>
                    </> : <>
                    <span className="contact-link">
                        We are sorry if you are unhappy with your works appearing on our site. You 
                        may fill out this form to request the removal of your copyrighted content. <br/><br/>

                        If you prefer, you may also write an email containing all of this info to 
                        <span className="contact-text-alt" style={{marginLeft: "5px"}}>moepictures.moe@gmail.com.</span>
                    </span>
                    <div className="contact-row">
                        <span className="contact-text" style={{width: "70px"}}>Name:</span>
                        <input className="contact-input-small" type="text" spellCheck={false} value={name} onChange={(event) => setName(event.target.value)}/>
                    </div>
                    <div className="contact-row">
                        <span className="contact-text" style={{width: "70px"}}>Email:</span>
                        <input className="contact-input-small" style={{width: "50%"}} type="text" spellCheck={false} value={email} onChange={(event) => setEmail(event.target.value)}/>
                    </div>
                    <div className="contact-row">
                        <span className="contact-text-alt">
                        Please provide the name of your artist tag on Moepictures.<br/>
                        </span>
                    </div>
                    <div className="contact-row">
                        <span className="contact-text" style={{width: "100px"}}>Artist Tag:</span>
                        <input className="contact-input-small" type="text" spellCheck={false} value={artistTag} onChange={(event) => setArtistTag(event.target.value)}/>
                    </div>
                    <div className="contact-row">
                        <span className="contact-text-alt">
                        Please provide your social media links (eg. Twitter, Pixiv). It should be possible to find the works on your profile. <br/>
                        </span>
                    </div>
                    <div className="contact-row-start">
                        <span className="contact-text" style={{width: "200px"}}>Social Media Links:</span>
                    </div>
                    <div className="contact-row-start">
                        <textarea className="contact-textarea" style={{marginLeft: "0px", height: "100px"}} spellCheck={false} value={socialMediaLinks} onChange={(event) => setSocialMediaLinks(event.target.value)}></textarea>
                    </div>
                    <div className="contact-row-start">
                        <img className="contact-checkbox" src={removeAllRequest ? checkbox : checkboxChecked} onClick={() => setRemoveAllRequest(false)} style={{filter: getFilter()}}/>
                        <span className="contact-link">Remove all of the specified links</span>
                    </div>
                    <div className="contact-row-start">
                        <img className="contact-checkbox" src={removeAllRequest ? checkboxChecked : checkbox} onClick={() => setRemoveAllRequest(true)} style={{filter: getFilter()}}/>
                        <span className="contact-link">Remove all of my associated content</span>
                    </div>
                    {getRemovalTypeJSX()}
                    <div className="contact-row">
                        <span className="contact-link">
                            Please provide proof that you are the artist in question. These are a couple acceptable forms of proof: <br/>
                            <span className="contact-text-alt">
                            ⇾ If your email is publicly listed on your accounts, contact us using that email. Post the link of where your email is listed. <br/>
                            ⇾ Post somewhere on your profile or in one of your posts "Remove me from Moepictures" and post the link to it. <br/>
                            ⇾ Attach a source file (.psd, .clip) to one of your works which isn't released publicly. <br/>
                            </span>
                        </span>
                    </div>
                    <div className="contact-row">
                        <span className="contact-text">Attach Files:</span>
                        <label htmlFor="contact-file-upload" className="contact-file-input">Select Files</label>
                        <input id="contact-file-upload" type="file" multiple onChange={(event) => fileUpload(event)}/>
                        {generateFilesJSX()}
                    </div>
                    <div className="contact-row-start">
                        <span className="contact-text" style={{width: "200px"}}>Proof Links:</span>
                    </div>
                    <div className="contact-row-start">
                        <textarea className="contact-textarea" style={{marginLeft: "0px", height: "100px"}} spellCheck={false} value={proofLinks} onChange={(event) => setProofLinks(event.target.value)}></textarea>
                    </div>
                    <div className="contact-row-start">
                        <img className="contact-checkbox" src={attestUnauthorized ? checkboxChecked : checkbox} onClick={() => setAttestUnauthorized((prev: boolean) => !prev)} style={{filter: getFilter()}}/>
                        <span className="contact-link">
                        <span className="contact-text-alt" style={{marginRight: "5px"}}>*</span>I sincerely believe that the use of the copyrighted materials mentioned above is not permitted by the 
                        copyright owner, their representative, or by law.
                        </span>
                    </div>
                    <div className="contact-row-start">
                        <img className="contact-checkbox" src={attestAccuracy ? checkboxChecked : checkbox} onClick={() => setAttestAccuracy((prev: boolean) => !prev)} style={{filter: getFilter()}}/>
                        <span className="contact-link">
                        <span className="contact-text-alt" style={{marginRight: "5px"}}>*</span>I swear under penalty of perjury that the information in this notice is accurate and that I am the 
                        copyright owner of the rights being infringed or authorized to act on behalf of the copyright owner.
                        </span>
                    </div>
                    <div className="contact-row">
                        <span className="contact-text" style={{width: "100px"}}>Signature:</span>
                        <input className="contact-input-small" type="text" spellCheck={false} value={signature} onChange={(event) => setSignature(event.target.value)}/>
                    </div>
                    {error ? <div className="contact-validation-container"><span className="contact-validation" ref={errorRef}></span></div> : null}
                    <div className="contact-button-container" style={{marginTop: "10px", marginBottom: "10px"}}>
                        <button className="contact-button" onClick={submit}>Submit Removal Request</button>
                    </div>
                    </> }
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default CopyrightRemovalPage