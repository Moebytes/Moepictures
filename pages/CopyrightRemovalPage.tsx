import React, {useEffect, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import XButton from "../assets/icons/x-button.png"
import functions from "../structures/Functions"
import checkbox from "../assets/icons/checkbox.png"
import checkboxChecked from "../assets/icons/checkbox-checked.png"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector} from "../store"
import "./styles/contactpage.less"

const CopyrightRemovalPage: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, siteHue, siteLightness, siteSaturation, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const [files, setFiles] = useState([]) as any
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [artistTag, setArtistTag] = useState("")
    const [socialMediaLinks, setSocialMediaLinks] = useState("")
    const [postLinks, setPostLinks] = useState("")
    const [proofLinks, setProofLinks] = useState("")
    const [attestOwnership, setAttestOwnership] = useState(false)
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
    }, [])

    useEffect(() => {
        document.title = i18n.pages.copyrightRemoval.title
    }, [i18n])

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
            errorRef.current!.innerText = i18n.pages.copyrightRemoval.nameReq
            await functions.timeout(2000)
            setError(false)
            return
        }
        const badEmail = functions.validateEmail(email, i18n)
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
            errorRef.current!.innerText = i18n.pages.copyrightRemoval.artistTagReq
            await functions.timeout(2000)
            setError(false)
            return
        }
        if (!socialMediaLinks) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = i18n.pages.copyrightRemoval.socialMediaReq
            await functions.timeout(2000)
            setError(false)
            return
        }
        if (!postLinks) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = i18n.pages.copyrightRemoval.postLinkReq
            await functions.timeout(2000)
            setError(false)
            return
        }
        if (!files.length && !proofLinks) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = i18n.pages.copyrightRemoval.proofReq
            await functions.timeout(2000)
            setError(false)
            return
        }
        if (!attestOwnership) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = i18n.pages.copyrightRemoval.confirmReq
            await functions.timeout(2000)
            setError(false)
            return
        }
        setError(true)
        if (!errorRef.current) await functions.timeout(20)
        errorRef.current!.innerText = i18n.buttons.submitting
        try {
            await functions.post("/api/misc/copyright", {name, email, artistTag, socialMediaLinks, removeAllRequest, postLinks, proofLinks, files}, session, setSessionFlag)
            setSubmitted(true)
            setError(false)
        } catch {
            errorRef.current!.innerText = i18n.pages.copyrightRemoval.error
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
                    {i18n.pages.copyrightRemoval.artistTagPageHeading}<br/>
                    </span>
                </div>
                <div className="contact-row-start">
                    <span className="contact-text" style={{width: "200px"}}>{i18n.pages.copyrightRemoval.artistTagPage}:</span>
                </div>
                <div className="contact-row-start">
                    <input className="contact-input-small" style={{marginLeft: "0px", width: "50%"}} type="text" spellCheck={false} value={postLinks} onChange={(event) => setPostLinks(event.target.value)}/>
                </div></>
            )
        } else {
            return (
                <><div className="contact-row">
                    <span className="contact-text-alt">
                    {i18n.pages.copyrightRemoval.postLinkHeading}<br/>
                    </span>
                </div>
                <div className="contact-row-start">
                    <span className="contact-text" style={{width: "200px"}}>{i18n.pages.copyrightRemoval.postLinks}:</span>
                </div>
                <div className="contact-row-start">
                    <textarea className="contact-textarea" style={{marginLeft: "0px", height: "100px"}} spellCheck={false} value={postLinks} onChange={(event) => setPostLinks(event.target.value)}></textarea>
                </div></>
            )
        }
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="contact" style={{height: "max-content"}}>
                    <span className="contact-title">{i18n.pages.copyrightRemoval.title}</span>
                    {submitted ? <>
                    <span className="contact-link">{i18n.pages.copyrightRemoval.submitHeading}</span>
                    <div className="contact-button-container-left">
                        <button className="contact-button" onClick={() => history.push("/posts")}>←{i18n.buttons.back}</button>
                    </div>
                    </> : <>
                    <span className="contact-link">
                        {i18n.pages.copyrightRemoval.heading}<br/><br/>

                        {i18n.pages.copyrightRemoval.emailPref}
                        <span className="contact-text-alt" style={{marginLeft: "5px"}}>moepictures.moe@gmail.com.</span>
                    </span>
                    <div className="contact-row">
                        <span className="contact-text" style={{width: "70px"}}>{i18n.labels.name}:</span>
                        <input className="contact-input-small" type="text" spellCheck={false} value={name} onChange={(event) => setName(event.target.value)}/>
                    </div>
                    <div className="contact-row">
                        <span className="contact-text" style={{width: "70px"}}>{i18n.labels.email}:</span>
                        <input className="contact-input-small" style={{width: "50%"}} type="text" spellCheck={false} value={email} onChange={(event) => setEmail(event.target.value)}/>
                    </div>
                    <div className="contact-row">
                        <span className="contact-text-alt">
                        {i18n.pages.copyrightRemoval.artistTagHeading}<br/>
                        </span>
                    </div>
                    <div className="contact-row">
                        <span className="contact-text" style={{width: "100px"}}>{i18n.pages.upload.artistTag}:</span>
                        <input className="contact-input-small" type="text" spellCheck={false} value={artistTag} onChange={(event) => setArtistTag(event.target.value)}/>
                    </div>
                    <div className="contact-row">
                        <span className="contact-text-alt">
                        {i18n.pages.copyrightRemoval.socialMediaHeading}<br/>
                        </span>
                    </div>
                    <div className="contact-row-start">
                        <span className="contact-text" style={{width: "200px"}}>{i18n.pages.copyrightRemoval.socialMedia}:</span>
                    </div>
                    <div className="contact-row-start">
                        <textarea className="contact-textarea" style={{marginLeft: "0px", height: "100px"}} spellCheck={false} value={socialMediaLinks} onChange={(event) => setSocialMediaLinks(event.target.value)}></textarea>
                    </div>
                    <div className="contact-row-start">
                        <img className="contact-checkbox" src={removeAllRequest ? checkbox : checkboxChecked} onClick={() => setRemoveAllRequest(false)} style={{filter: getFilter()}}/>
                        <span className="contact-link">{i18n.pages.copyrightRemoval.removeSpecified}</span>
                    </div>
                    <div className="contact-row-start">
                        <img className="contact-checkbox" src={removeAllRequest ? checkboxChecked : checkbox} onClick={() => setRemoveAllRequest(true)} style={{filter: getFilter()}}/>
                        <span className="contact-link">{i18n.pages.copyrightRemoval.removeAll}</span>
                    </div>
                    {getRemovalTypeJSX()}
                    <div className="contact-row">
                        <span className="contact-link">
                            {i18n.pages.copyrightRemoval.proofHeading}<br/>
                            <span className="contact-text-alt">
                            {i18n.pages.copyrightRemoval.emailProof}<br/>
                            {i18n.pages.copyrightRemoval.postProof}<br/>
                            {i18n.pages.copyrightRemoval.sourceProof}<br/>
                            </span>
                        </span>
                    </div>
                    <div className="contact-row">
                        <span className="contact-text">{i18n.pages.contact.attachFiles}:</span>
                        <label htmlFor="contact-file-upload" className="contact-file-input">{i18n.pages.upload.selectFiles}</label>
                        <input id="contact-file-upload" type="file" multiple onChange={(event) => fileUpload(event)}/>
                        {generateFilesJSX()}
                    </div>
                    <div className="contact-row-start">
                        <span className="contact-text" style={{width: "200px"}}>{i18n.pages.copyrightRemoval.proof}:</span>
                    </div>
                    <div className="contact-row-start">
                        <textarea className="contact-textarea" style={{marginLeft: "0px", height: "100px"}} spellCheck={false} value={proofLinks} onChange={(event) => setProofLinks(event.target.value)}></textarea>
                    </div>
                    <div className="contact-row-start">
                        <img className="contact-checkbox" src={attestOwnership ? checkboxChecked : checkbox} onClick={() => setAttestOwnership((prev: boolean) => !prev)} style={{filter: getFilter()}}/>
                        <span className="contact-link">
                        <span className="contact-text-alt" style={{marginRight: "5px"}}>*</span>{i18n.pages.copyrightRemoval.verifyCopyright}</span>
                    </div>
                    {error ? <div className="contact-validation-container"><span className="contact-validation" ref={errorRef}></span></div> : null}
                    <div className="contact-button-container" style={{marginTop: "10px", marginBottom: "10px"}}>
                        <button className="contact-button" onClick={submit}>{i18n.pages.copyrightRemoval.submit}</button>
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