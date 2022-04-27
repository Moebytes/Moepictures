import React, {useContext, useEffect, useState} from "react"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import tos from "../assets/purple/tos.png"
import privacy from "../assets/purple/privacy.png"
import tosMagenta from "../assets/magenta/tos.png"
import privacyMagenta from "../assets/magenta/privacy.png"
import tosPurpleLight from "../assets/purple-light/tos.png"
import privacyPurpleLight from "../assets/purple-light/privacy.png"
import tosMagentaLight from "../assets/magenta-light/tos.png"
import privacyMagentaLight from "../assets/magenta-light/privacy.png"
import DragAndDrop from "../components/DragAndDrop"
import functions from "../structures/Functions"
import {HideNavbarContext, HideSidebarContext, ThemeContext, RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext, MobileContext, EnableDragContext} from "../Context"
import "./styles/tospage.less"

const TermsPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [onPrivacy, setOnPrivacy] = useState(false)

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        window.scrollTo(0, 0)
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        if (onPrivacy) {
            document.title = "Moebooru: Privacy Policy"
        } else {
            document.title = "Moebooru: Terms of Service"
        }
    })

    const getTOS = () => {
        if (theme === "purple") return tos
        if (theme === "purple-light") return tosPurpleLight
        if (theme === "magenta") return tosMagenta
        if (theme === "magenta-light") return tosMagentaLight
        return tos
    }

    const getPrivacy = () => {
        if (theme === "purple") return privacy
        if (theme === "purple-light") return privacyPurpleLight
        if (theme === "magenta") return privacyMagenta
        if (theme === "magenta-light") return privacyMagentaLight
        return privacy
    }
    
    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="terms-container">
                    <div className="terms">
                        <div className="terms-title-container">
                            <img className="terms-img" src={getTOS()}/>
                            <span className="terms-title">Terms of Service</span>
                        </div>
                        <div className="terms-text">
                            Last Updated: March 15, 2022 <br/><br/>

                            This Terms of Service (”terms”) applies to any websites, apps, and APIs provided 
                            by Moebooru (”we”, “us”, “our”) (collectively, the “services”). By using these 
                            services, you agree to be bound by these terms. If you do not agree with these 
                            terms, you may not use our services.<br/><br/>

                            Your Access to the Services<br/>
                            <span className="terms-text-alt">
                            ⇾ You must be 18 or older to create an account on our service, and by creating an 
                            account you are affirming that you are an adult by the laws of your country of 
                            residence.<br/>
                            ⇾ Your account may be terminated at any time for any or no reason, including but not
                            limited to a violation of the Terms of Service, Uploading Rules, or Commenting Rules.<br/><br/>
                            </span>

                            Things You Cannot Do<br/>
                            When you are using or accessing my services, you may not do any of the following: <br/>
                            <span className="terms-text-alt">
                            ⇾ Send spam in the comments or through unsolicited private messages.<br/>
                            ⇾ Vandalize tags or translations.<br/>
                            ⇾ Create multiple accounts to spam or circumvent bans.<br/>
                            ⇾ Share or transfer your account to anyone else.<br/>
                            ⇾ Attempt to gain unauthorized access to another user’s account.<br/>
                            ⇾ Attempt to upload computer viruses or other malicious content.<br/>
                            ⇾ Attempt to disrupt, overburden, or otherwise impair the operation of our servers.<br/><br/>
                            </span>

                            User-Generated Content<br/>
                            <span className="terms-text-alt">
                            ⇾ All of the content on our site is user-generated and we take no responsibility
                            for content submitted by users, whether it be images, animations, videos, or text; 
                            the responsibility falls on the user who submitted the content. <br/>
                            ⇾ We reserve the right to remove content at any time for any or no reason, including 
                            but not limited to a violation of the Terms of Service, Uploading Rules, and Commenting Rules. <br/><br/>
                            </span>

                            Copyright Infringement and DMCA Takedowns<br/>
                            We respect the intellectual property of others. If you believe that anything 
                            on our service infringes on your copyright, you can contact us through the contact form 
                            and provide the following pieces of information:<br/>
                            <span className="terms-text-alt">
                            ⇾ Contact information (Name, Mailing Address, Phone Number, Email)<br/>
                            ⇾ Proof of your identity<br/>
                            ⇾ Links to the infringing content<br/>
                            ⇾ A statement affirming that you are the copyright holder of the content in question<br/>
                            </span>
                            These are acceptable proofs of identity:<br/>
                            <span className="terms-text-alt">
                            ⇾ <span className="terms-weblink" onClick={() => functions.twitterLink()}>Private message us on Twitter</span><br/>
                            ⇾ Attach a source file to one of your works which is not available publicly<br/>
                            </span>
                            We do not remove material not protected by copyright, such as your artist tag and social links.<br/><br/>

                            Liability<br/>
                            The service is provided "as is", without warranty of any kind, express or implied. 
                            In no event shall we be liable for any claim, damages or other liability, arising from 
                            or in connection with usage of the service.<br/><br/>

                            Changes to these Terms<br/>
                            We may make changes to these Terms at any time, indicated by its 
                            “Last Updated” date. Changes to the Terms are effective immediately and by using
                            our services after the terms are revised, you agree to be bound by the 
                            revised terms.
                        </div>
                    </div>
                    <div className="privacy" id="privacy" onMouseOver={() => setOnPrivacy(true)} onMouseLeave={() => setOnPrivacy(false)}>
                        <div className="privacy-title-container">
                            <img className="privacy-img" src={getPrivacy()}/>
                            <span className="privacy-title">Privacy Policy</span>
                        </div>
                        <div className="privacy-text">
                            Last Updated: March 15, 2022<br/><br/>

                            This Privacy Policy ("policy") outlines the information that Moebooru (”we”, “us”, “our”) 
                            collects when you use our websites, apps, and APIs (collectively, the “services”). It
                            also describes how we use your information and how your information is shared. <br/><br/>

                            What We Collect<br/>
                            We collect information that you provide directly to us, which includes:<br/><br/>

                            <span className="privacy-text-alt">Account Information</span> - If you create a Moebooru account, we require you to
                            provide an email, username, and password. You may also edit your bio and
                            profile picture. We also store your account settings and preferences.<br/><br/>

                            <span className="privacy-text-alt">Content You Submit</span> - We collect the content that you submit which may include
                            text, images, gifs, videos. This includes your comments and private messages with
                            other users. <br/><br/>

                            <span className="privacy-text-alt">Actions You Take</span> - We collect information on the interactions that you make with
                            content, such as favoriting posts and rating their cuteness. We also collect
                            interactions that you make with other users such as blocking.<br/><br/>

                            We also automatically collect information when you access our service, 
                            which includes:<br/><br/>

                            <span className="privacy-text-alt">Log and Usage Data</span> - We may log information when you access our services 
                            which may include your IP Address, device information, pages visited, requested URL,
                            and search terms.<br/><br/>

                            <span className="privacy-text-alt">Cookies</span> - We may receive information from cookies which is used to maintain your
                            login session and store account settings and preferences.<br/><br/>

                            How We Use Your Information<br/>
                            We use your information in order to:<br/>
                            <span className="privacy-text-alt">
                            ⇾ Provide, maintain, and improve our services.<br/>
                            ⇾ Allow you to login and manage your account.<br/>
                            ⇾ Protect our services from abuse and spam.<br/>
                            ⇾ Monitor and analyze usage in connection with our services.<br/><br/>
                            </span>

                            How Information About You Is Shared<br/>
                            <span className="privacy-text-alt">
                            ⇾ Unless it is stated otherwise, any content that you submit on our services is
                            visible to other users and to the public. This includes posts, comments, and 
                            translations. <br/>
                            ⇾ You can choose to make certain information private, such as
                            your favorites, which will prevent other users and the public from being able
                            to view them. <br/>
                            ⇾ When someone visits your profile they can see information related
                            to your activity, such as uploads, comments, and translations.<br/><br/>
                            </span>

                            We do not share your personal information with third parties unless one of
                            the following holds:<br/>
                            <span className="privacy-text-alt">
                            ⇾ We have your consent<br/>
                            ⇾ It is anomalyzed in a way that can’t be traced to you<br/>
                            ⇾ It is required to comply with the law<br/><br/>
                            </span>

                            Controlling Your Information<br/>
                            <span className="privacy-text-alt">Accessing and changing your information</span> - If you would like to update
                            your information, such as username, email, and password, you can do 
                            so at anytime by editing it in your account settings.<br/><br/>

                            <span className="privacy-text-alt">Deleting your account</span> - You can delete your account in your account
                            settings. When you delete your account all of your non-public personal
                            information is deleted, with the exception of private messages sent to
                            other users. Your public contributions, such as posts,
                            comments, and translations will not be deleted. Your contributions
                            will however get disconnected from your username. <br/><br/>

                            Changes to this Policy<br/>
                            We may make changes to this policy at any time, indicated by its
                            “Last Updated” date. Changes to this policy are effective immediately
                            and by continuing to use our service after the policy is revised, you
                            agree to be bound by the revised policy.
                        </div>
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default TermsPage