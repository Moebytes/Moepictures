import React, {useEffect, useState, useRef, useReducer} from "react"
import {useNavigate} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import checkbox from "../../assets/icons/checkbox.png"
import checkboxChecked from "../../assets/icons/checkbox-checked.png"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector} from "../../store"
import {stripIndents} from "common-tags"
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
    const [name, setName] = useState("")
    const [artistTag, setArtistTag] = useState("")
    const [socialMediaLinks, setSocialMediaLinks] = useState("")
    const [postLinks, setPostLinks] = useState("")
    const [proofLinks, setProofLinks] = useState("")
    const [attestOwnership, setAttestOwnership] = useState(false)
    const [removeAllRequest, setRemoveAllRequest] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const navigate = useNavigate()

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

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
    
    const submit = async () => {
        if (!name) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = i18n.pages.copyrightRemoval.nameReq
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
        if (!attestOwnership) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = i18n.pages.copyrightRemoval.confirmReq
            await functions.timeout(2000)
            setError(false)
            return
        }

        let removalType = removeAllRequest 
            ? "I would like all of my associated content to be removed." 
            : "I would like all of the provided links to be removed."

        let subject = `Copyright Removal Request from ${artistTag}`

        let message = stripIndents`
            Artist Tag: ${artistTag}

            Social Media Links:
            ${socialMediaLinks}

            ${removeAllRequest ? "Artist Tag Link:" : "Post Links:"}
            ${postLinks}

            Proof Links:
            ${proofLinks ? proofLinks : "Please attach to this email."}

            ${removalType}

            *I am the copyright owner of the content linked above or am authorized 
            to act on the behalf of the copyright owner.

            Signature: ${name}
        `

        window.location.href = `mailto:${i18n.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
        setName("")
        setArtistTag("")
        setSocialMediaLinks("")
        setPostLinks("")
        setProofLinks("")
        setAttestOwnership(false)
        setRemoveAllRequest(false)
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
                    <span className="contact-link">
                        {i18n.pages.copyrightRemoval.heading}<br/><br/>
                    </span>
                    <div className="contact-row">
                        <span className="contact-text" style={{width: "70px"}}>{i18n.labels.name}:</span>
                        <input className="contact-input-small" type="text" spellCheck={false} value={name} onChange={(event) => setName(event.target.value)}/>
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
                        <img className="contact-checkbox" src={removeAllRequest ? checkbox : checkboxChecked} onClick={() => setRemoveAllRequest(false)} style={{filter}}/>
                        <span className="contact-link">{i18n.pages.copyrightRemoval.removeSpecified}</span>
                    </div>
                    <div className="contact-row-start">
                        <img className="contact-checkbox" src={removeAllRequest ? checkboxChecked : checkbox} onClick={() => setRemoveAllRequest(true)} style={{filter}}/>
                        <span className="contact-link">{i18n.pages.copyrightRemoval.removeAll}</span>
                    </div>
                    {getRemovalTypeJSX()}
                    <div className="contact-row">
                        <span className="contact-link">
                            {i18n.pages.copyrightRemoval.proofHeading}<br/>
                            <span className="contact-text-alt">
                            {i18n.terms.tos.copyrightTakedown.proof1}<br/>
                            {i18n.terms.tos.copyrightTakedown.proof2}<br/>
                            {i18n.terms.tos.copyrightTakedown.proof3}<br/>
                            </span>
                        </span>
                    </div>
                    <div className="contact-row">
                        <span className="contact-text">{i18n.labels.attachFiles}:</span>
                        <span className="contact-link">{i18n.pages.contact.attachFiles}</span>
                    </div>
                    <div className="contact-row-start">
                        <span className="contact-text" style={{width: "200px"}}>{i18n.pages.copyrightRemoval.proof}:</span>
                    </div>
                    <div className="contact-row-start">
                        <textarea className="contact-textarea" style={{marginLeft: "0px", height: "100px"}} spellCheck={false} value={proofLinks} onChange={(event) => setProofLinks(event.target.value)}></textarea>
                    </div>
                    <div className="contact-row-start">
                        <img className="contact-checkbox" src={attestOwnership ? checkboxChecked : checkbox} onClick={() => setAttestOwnership((prev: boolean) => !prev)} style={{filter}}/>
                        <span className="contact-link">
                        <span className="contact-link" style={{marginRight: "5px"}}>*</span>{i18n.pages.copyrightRemoval.verifyCopyright}</span>
                    </div>
                    {error ? <div className="contact-validation-container"><span className="contact-validation" ref={errorRef}></span></div> : null}
                    <div className="contact-button-container" style={{marginTop: "10px", marginBottom: "10px"}}>
                        <button className="contact-button" onClick={submit}>{i18n.pages.copyrightRemoval.submit}</button>
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default CopyrightRemovalPage