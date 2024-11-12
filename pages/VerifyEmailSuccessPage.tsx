import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import Footer from "../components/Footer"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import functions from "../structures/Functions"
import {useInteractionActions, useLayoutActions, useActiveActions, useLayoutSelector} from "../store"
import "./styles/sitepage.less"
import session from "express-session"

const VerifyEmailSuccessPage: React.FunctionComponent = (props) => {
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {mobile} = useLayoutSelector()
    const [submitted, setSubmitted] = useState(false)
    const [newEmail, setNewEmail] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        setEnableDrag(false)
        document.title = "Verify Email Success"
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="sitepage">
                    <span className="sitepage-title">Email Verified</span>
                    <div className="sitepage-row">
                        <span className="sitepage-text">Thank you, your email address has been verified! You should be 
                        able to use your account now.</span>
                    </div>
                    <div className="sitepage-button-container">
                        <button className="sitepage-button" onClick={() => history.push("/posts")}>Ok</button>
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default VerifyEmailSuccessPage