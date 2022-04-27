import React, {useEffect, useContext, useState} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, ShowDeletePostDialogContext, HideTitlebarContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/deletepostdialog.less"
import axios from "axios"

interface Props {
    post: any
}

const DeletePostDialog: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {showDeletePostDialog, setShowDeletePostDialog} = useContext(ShowDeletePostDialogContext)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Delete Post"
    }, [])

    useEffect(() => {
        if (showDeletePostDialog) {
            document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [showDeletePostDialog])

    const deletePost = async () => {
        await axios.delete("/api/post/delete", {params: {postID: props.post.postID}, withCredentials: true})
        history.push("/posts")
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            deletePost()
        }
        setShowDeletePostDialog(false)
    }

    if (showDeletePostDialog) {
        return (
            <div className="deletepost-dialog">
                <div className="deletepost-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="deletepost-container">
                        <span className="deletepost-dialog-title">Delete Post</span>
                        <div className="deletepost-dialog-row">
                            <span className="deletepost-dialog-text">Are you sure that you want to delete this post?</span>
                        </div>
                        <div className="deletepost-dialog-row">
                            <button onClick={() => click("reject")} className="download-button">{"No"}</button>
                            <button onClick={() => click("accept")} className="download-button">{"Yes"}</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    return null
}

export default DeletePostDialog