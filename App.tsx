import React, {useEffect, useState} from "react"
import {Switch, Route} from "react-router-dom"
import PostsPage from "./components/PostsPage"
import $404Page from "./components/404Page"
import HelpPage from "./components/HelpPage"
import functions from "./structures/Functions"
import "./index.less"

export const ThemeContext = React.createContext<any>(null)
export const HideSortbarContext = React.createContext<any>(null)
export const HideSidebarContext = React.createContext<any>(null)
export const HideNavbarContext = React.createContext<any>(null)
export const EnableDragContext = React.createContext<any>(null)

const App: React.FunctionComponent = (props) => {
    const [theme, setTheme] = useState("purple")
    const [hideSortbar, setHideSortbar] = useState(false)
    const [hideSidebar, setHideSidebar] = useState(false)
    const [hideNavbar, setHideNavbar] = useState(false)
    const [enableDrag, setEnableDrag] = useState(false)

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme")
        if (savedTheme) setTheme(savedTheme)
    }, [])

    useEffect(() => {
        window.addEventListener("scroll", () => {
            if (window.scrollY === 0) return setHideSortbar(false)
            return setHideSortbar(true)
        })
        window.addEventListener("mousemove", (event) => {
            if (window.scrollY === 0) return setHideSortbar(false)
            const amt = hideNavbar ? (35 + 40) : (77 + 35 + 40)
            if (event.clientY < amt) return setHideSortbar(false)
            return setHideSortbar(true)
        })
    }, [hideNavbar])

    
    useEffect(() => {
        functions.dragScroll(enableDrag)
    }, [enableDrag])

    useEffect(() => {
        if (!theme || theme === "purple") {
            document.documentElement.style.setProperty("--background", "#0f0b35")
            document.documentElement.style.setProperty("--titlebarBG", "#1d0a71")
            document.documentElement.style.setProperty("--navbarBG", "#230089")
        } else if (theme === "purple-light") {
            document.documentElement.style.setProperty("--background", "#c7c6fb")
            document.documentElement.style.setProperty("--titlebarBG", "#8789ff")
            document.documentElement.style.setProperty("--navbarBG", "#888bff")
        } else if (theme === "magenta") {
            document.documentElement.style.setProperty("--background", "#350b2c")
            document.documentElement.style.setProperty("--titlebarBG", "#710a65")
            document.documentElement.style.setProperty("--navbarBG", "#890085")
        } else if (theme === "magenta-light") {
            document.documentElement.style.setProperty("--background", "#f4dbfd")
            document.documentElement.style.setProperty("--titlebarBG", "#ee9bff")
            document.documentElement.style.setProperty("--navbarBG", "#e49dff")
        }
        functions.changeFavicon(theme)
    }, [theme])

    return (
        <div className={`app ${theme}`}>
            <EnableDragContext.Provider value={{enableDrag, setEnableDrag}}>
            <HideSortbarContext.Provider value={{hideSortbar, setHideSortbar}}>
            <HideNavbarContext.Provider value={{hideNavbar, setHideNavbar}}>
            <HideSidebarContext.Provider value={{hideSidebar, setHideSidebar}}>
            <ThemeContext.Provider value={{theme, setTheme}}>
                <Switch>
                    <Route exact path={["/", "/posts", "/home"]}><PostsPage/></Route>
                    <Route exact path="/help"><HelpPage/></Route>
                    <Route path="*"><$404Page/></Route>
                </Switch>
            </ThemeContext.Provider>
            </HideSidebarContext.Provider>
            </HideNavbarContext.Provider>
            </HideSortbarContext.Provider>
            </EnableDragContext.Provider>
        </div>
    )
}

export default App