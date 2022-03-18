import React, {useEffect} from "react"
import TitleBar from "./TitleBar"
import NavBar from "./NavBar"
import SideBar from "./SideBar"
import SortBar from "./SortBar"
import $404 from "../assets/images/404.png"
import "../styles/404page.less"

const $404Page: React.FunctionComponent = (props) => {
    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar text="404 error."/>
            <div className="content">
                <SortBar/>
                <div className="f404-container">
                    <img className="f404" src={$404}/>
                </div>
            </div>
        </div>
        </>
    )
}

export default $404Page