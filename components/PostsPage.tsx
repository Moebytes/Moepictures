import React, {useEffect} from "react"
import TitleBar from "./TitleBar"
import NavBar from "./NavBar"
import SideBar from "./SideBar"
import SortBar from "./SortBar"
import ImageGrid from "./ImageGrid"

const PostsPage: React.FunctionComponent = (props) => {
    return (
        <>
        <TitleBar text="Animated, With Audio, Loli"/>
        <NavBar/>
        <div className="body">
            <SideBar text="146 results."/>
            <div className="content">
                <SortBar/>
                <ImageGrid/>
            </div>
        </div>
        </>
    )
}

export default PostsPage