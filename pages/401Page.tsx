import React, {useEffect} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import SortBar from "../components/SortBar"
import Footer from "../components/Footer"
import $401 from "../assets/misc/401.png"
import {useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector} from "../store"
import {useThemeSelector} from "../store"
import "./styles/404page.less"

const $401Page: React.FunctionComponent = (props) => {
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
        setSidebarText("401 error.")
        document.title = "401 Error"
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
                    <span className={`f404-text ${!theme.includes("light") ? "f404-darker" : ""}`}>401 Error</span>
                    <img className="f404" src={$401}/>
                </div>
                <Footer noPadding={true}/>
            </div>
        </div>
        </>
    )
}

export default $401Page