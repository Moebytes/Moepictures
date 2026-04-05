/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import functions from "../functions/Functions"
import {NavigateFunction} from "react-router-dom"
import VerifyEmail from "../emails/VerifyEmail"
import ChangeEmail from "../emails/ChangeEmail"
import ResetPassword from "../emails/ResetPassword"
import ChangedPassword from "../emails/ChangedPassword"
import VerifyLogin from "../emails/VerifyLogin"
import CrownIcon from "../assets/svg/crown.svg"
import CuratorStarIcon from "../assets/svg/curator-star.svg"
import ContributorPencilIcon from "../assets/svg/pencil.svg"
import PremiumStarIcon from "../assets/svg/premium-star.svg"
import enLocale from "../assets/locales/en.json"
import {Session} from "../types/Types"

export default class JSXFunctions {
    public static verifyEmailJSX = (username: string, link: string) => {
        return <VerifyEmail username={username} link={link}/>
    }

    public static changeEmailJSX = (username: string, link: string) => {
        return <ChangeEmail username={username} link={link}/>
    }

    public static resetPasswordJSX = (username: string, link: string) => {
        return <ResetPassword username={username} link={link}/>
    }

    public static changedPasswordJSX = (username: string, link: string) => {
        return <ChangedPassword username={username} link={link}/>
    }

    public static verifyLoginJSX = (username: string, link: string, ip: string, region: string) => {
        return <VerifyLogin username={username} link={link} ip={ip} region={region}/>
    }

    public static usernameJSX = (userData: {username: string, role: string, banned: boolean | null, deleted: boolean | null, 
        imagePost?: string | null}, classNames: {containerClass: string, textClass: string, imageClass: string, 
        profilePictureClass?: string, recipientClass?: string, editText?: string, date?: string, profilePicture?: string, 
        filter?: string, recipientAmount?: number, session?: Session, setSessionFlag?: (value: boolean) => void}, 
        i18n: typeof enLocale, navigate: NavigateFunction) => {

        let {containerClass, textClass, imageClass, profilePictureClass, recipientClass, editText, date, 
            profilePicture, filter, recipientAmount, session, setSessionFlag} = classNames
        let timeString = editText && date ? `${editText} ${functions.date.timeAgo(date, i18n)} ${i18n.time.by} `  : ""

        const openProfile = (event: React.MouseEvent) => {
            if (event.ctrlKey || event.metaKey || event.button === 1) {
                window.open(`/user/${userData.username}`, "_blank")
            } else {
                navigate(`/user/${userData.username}`)
            }
        }

        const openProfilePost = (event: React.MouseEvent) => {
            if (!userData.imagePost) return
            event.stopPropagation()
            functions.post.openPost(userData.imagePost, event, navigate, session, setSessionFlag)
        }

        if (userData.role === "admin") {
            return (
                <div className={containerClass} onClick={openProfile} onAuxClick={openProfile}>
                    {profilePicture ? <img draggable={false} src={profilePicture} className={profilePictureClass} onClick={openProfilePost} onAuxClick={openProfilePost} style={{filter}}/> : null}
                    <span className={`${textClass} admin-color`}>
                        {timeString}{functions.util.toProperCase(userData.username)}
                    </span>
                    <CrownIcon className={imageClass} style={{color: "var(--adminColor)"}}/>
                    {(recipientAmount ?? 0) > 1 ? <span className={recipientClass}>(+{recipientAmount! - 1})</span> : null}
                </div>
            )
        } else if (userData.role === "mod") {
            return (
                <div className={containerClass} onClick={openProfile} onAuxClick={openProfile}>
                    {profilePicture ? <img draggable={false} src={profilePicture} className={profilePictureClass} onClick={openProfilePost} onAuxClick={openProfilePost} style={{filter}}/> : null}
                    <span className={`${textClass} mod-color`}>
                        {timeString}{functions.util.toProperCase(userData.username)}
                    </span>
                    <CrownIcon className={imageClass} style={{color: "var(--modColor)"}}/>
                    {(recipientAmount ?? 0) > 1 ? <span className={recipientClass}>(+{recipientAmount! - 1})</span> : null}
                </div>
            )
        } else if (userData.role === "system") {
            return (
                <div className={containerClass} onClick={openProfile} onAuxClick={openProfile}>
                    {profilePicture ? <img draggable={false} src={profilePicture} className={profilePictureClass} onClick={openProfilePost} onAuxClick={openProfilePost} style={{filter}}/> : null}
                    <span className={`${textClass} system-color`}>
                        {timeString}{functions.util.toProperCase(userData.username)}</span>
                    <CrownIcon className={imageClass} style={{color: "var(--systemColor)"}}/>
                    {(recipientAmount ?? 0) > 1 ? <span className={recipientClass}>(+{recipientAmount! - 1})</span> : null}
                </div>
            )
        } else if (userData.role === "premium-curator") {
            return (
                <div className={containerClass} onClick={openProfile} onAuxClick={openProfile}>
                    {profilePicture ? <img draggable={false} src={profilePicture} className={profilePictureClass} onClick={openProfilePost} onAuxClick={openProfilePost} style={{filter}}/> : null}
                    <span className={`${textClass} curator-color`}>
                        {timeString}{functions.util.toProperCase(userData.username)}
                    </span>
                    <CuratorStarIcon className={imageClass} style={{color: "var(--premiumColor)"}}/>
                    {(recipientAmount ?? 0) > 1 ? <span className={recipientClass}>(+{recipientAmount! - 1})</span> : null}
                </div>
            )
        } else if (userData.role === "curator") {
            return (
                <div className={containerClass} onClick={openProfile} onAuxClick={openProfile}>
                    {profilePicture ? <img draggable={false} src={profilePicture} className={profilePictureClass} onClick={openProfilePost} onAuxClick={openProfilePost} style={{filter}}/> : null}
                    <span className={`${textClass} curator-color`}>
                        {timeString}{functions.util.toProperCase(userData.username)}
                    </span>
                    <CuratorStarIcon className={imageClass} style={{color: "var(--curatorColor)"}}/>
                    {(recipientAmount ?? 0) > 1 ? <span className={recipientClass}>(+{recipientAmount! - 1})</span> : null}
                </div>
            )
        } else if (userData.role === "premium-contributor") {
            return (
                <div className={containerClass} onClick={openProfile} onAuxClick={openProfile}>
                    {profilePicture ? <img draggable={false} src={profilePicture} className={profilePictureClass} onClick={openProfilePost} onAuxClick={openProfilePost} style={{filter}}/> : null}
                    <span className={`${textClass} premium-color`}>
                        {timeString}{functions.util.toProperCase(userData.username)}
                    </span>
                    <ContributorPencilIcon className={imageClass} style={{color: "var(--premiumColor)"}}/>
                    {(recipientAmount ?? 0) > 1 ? <span className={recipientClass}>(+{recipientAmount! - 1})</span> : null}
                </div>
            )
        } else if (userData.role === "contributor") {
            return (
                <div className={containerClass} onClick={openProfile} onAuxClick={openProfile}>
                    {profilePicture ? <img draggable={false} src={profilePicture} className={profilePictureClass} onClick={openProfilePost} onAuxClick={openProfilePost} style={{filter}}/> : null}
                    <span className={`${textClass} contributor-color`}>
                        {timeString}{functions.util.toProperCase(userData.username)}
                    </span>
                    <ContributorPencilIcon className={imageClass} style={{color: "var(--contributorColor)"}}/>
                    {(recipientAmount ?? 0) > 1 ? <span className={recipientClass}>(+{recipientAmount! - 1})</span> : null}
                </div>
            )
        } else if (userData.role === "premium") {
            return (
                <div className={containerClass} onClick={openProfile} onAuxClick={openProfile}>
                    {profilePicture ? <img draggable={false} src={profilePicture} className={profilePictureClass} onClick={openProfilePost} onAuxClick={openProfilePost} style={{filter}}/> : null}
                    <span className={`${textClass} premium-color`}>
                        {timeString}{functions.util.toProperCase(userData.username)}
                    </span>
                    <PremiumStarIcon className={imageClass} style={{color: "var(--premiumColor)"}}/>
                    {(recipientAmount ?? 0) > 1 ? <span className={recipientClass}>(+{recipientAmount! - 1})</span> : null}
                </div>
            )
        }
        return (
            <div className={containerClass} onClick={openProfile} onAuxClick={openProfile}>
                {profilePicture ? <img draggable={false} src={profilePicture} className={profilePictureClass} onClick={openProfilePost} onAuxClick={openProfilePost} style={{filter}}/> : null}
                <span className={`${textClass} ${userData.banned ? "banned" : ""} ${userData.deleted ? "deleted" : ""}`}>
                    {timeString}{userData.deleted ? i18n.user.deleted : functions.util.toProperCase(userData.username)}
                </span>
                {(recipientAmount ?? 0) > 1 ? <span className={recipientClass}>(+{recipientAmount! - 1})</span> : null}
            </div>
        )
    }
}