import React, {useEffect} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import SortBar from "../components/SortBar"
import Footer from "../components/Footer"
import $403 from "../assets/misc/403.png"
import {useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector} from "../store"
import {useThemeSelector} from "../store"
import "./styles/404page.less"

const $403Page: React.FunctionComponent = (props) => {
    const {theme} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const history = useHistory()

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("403 error.")
        document.title = "403 Error"
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
                <div className="f404-container">
                    <span className={`f404-text ${!theme.includes("light") ? "f404-darker" : ""}`}>403 Error</span>
                    <img className="f404" src={$403}/>
                </div>
                <Footer noPadding={true}/>
            </div>
        </div>
        </>
    )
}

export default $403Page