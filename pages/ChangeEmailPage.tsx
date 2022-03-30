import React, {useEffect, useContext, useState} from "react"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import Footer from "../components/Footer"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, RelativeContext} from "../App"
import "./styles/changeemailpage.less"

const ChangeEmailPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const [clicked, setClicked] = useState(false)

    useEffect(() => {
        setHideNavbar(false)
        setHideSidebar(false)
        setRelative(false)
        document.title = "Moebooru: Change Email"
    }, [])

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="change-email" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <span className="change-email-title">Change Email</span>
                    {clicked ?
                    <>
                    <span className="change-email-link">Your email has been changed.</span>
                    <div className="change-email-button-container-left">
                        <button className="change-email-button" onClick={() => setClicked(false)}>←Back</button>
                    </div>
                    </> : <>
                    <span className="change-email-link">A confirmation email will be sent to the new address. 
                    Your email will only be changed if you confirm the new one.</span>
                    <div className="change-email-row">
                        <span className="change-email-text">Email: </span>
                        <span className="change-email-text-small">pie4chan@gmail.com</span>
                    </div>
                    <div className="change-email-row">
                        <span className="change-email-text">New Email: </span>
                        <input className="change-email-input" type="text" spellCheck={false}/>
                    </div>
                    <div className="change-email-button-container">
                        <button className="change-email-button" onClick={() => setClicked(true)}>Change Email</button>
                    </div>
                    </>
                    }
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default ChangeEmailPage