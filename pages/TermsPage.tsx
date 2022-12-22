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
                            Last Updated: December 22, 2022 <br/><br/>

                            This Terms of Service applies to the website ("site") provided 
                            by Moebooru (”we”, “us”, “our”). By using our site, you agree with these terms. If you do not agree with these 
                            terms, you may not use our site.<br/><br/>

                            Access to the Site<br/>
                            <span className="terms-text-alt">
                            ⇾ You must be 18 or older to create an account on our site. <br/>
                            ⇾ Your account may be terminated at any time for any or no reason, including but not limited to 
                            a violation of the Terms of Service.<br/><br/>
                            </span>

                            Prohibited Actions<br/>
                            When you are using our site, you may not do any of the following: <br/>
                            <span className="terms-text-alt">
                            ⇾ Robotically scrape artworks and tags for use in generative AI.<br/>
                            ⇾ Send spam in the comments or through unsolicited private messages.<br/>
                            ⇾ Vandalize classifications, tags, or translations.<br/>
                            ⇾ Create multiple accounts to circumvent bans.<br/>
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
                            ⇾ We reserve the right to remove content at any time for any or no reason. <br/><br/>
                            </span>

                            Copyright Infringement and DMCA Takedowns<br/>
                            We respect the intellectual property of others. If you believe that anything 
                            on our site infringes on your copyright, you can contact us through the contact form 
                            and provide the following pieces of information:<br/>
                            <span className="terms-text-alt">
                            ⇾ Contact information (eg. social media, email)<br/>
                            ⇾ Your artist tag or links to specific works<br/>
                            ⇾ Proof of your identity<br/>
                            ⇾ A statement affirming that you are the copyright holder of the content<br/>
                            </span>
                            These are acceptable proofs of identity:<br/>
                            <span className="terms-text-alt">
                            ⇾ Respond to social media contact (say which account you would prefer being contacted at)<br/>
                            ⇾ Attach a source file to one of your works which is not available publicly<br/>
                            </span><br/><br/>

                            Liability<br/>
                            The site is provided "as is", without warranty of any kind, express or implied. 
                            In no event shall we be liable for any claim, damages or other liability, arising from 
                            or in connection with usage of our site.<br/><br/>

                            Changes to these Terms<br/>
                            We may make changes to these terms at any time, indicated by its 
                            “Last Updated” date. Changes to the terms are effective immediately and by using
                            our site after the terms are revised, you are agreeing to the revised terms.
                        </div>
                    </div>
                    <div className="privacy" id="privacy" onMouseOver={() => setOnPrivacy(true)} onMouseLeave={() => setOnPrivacy(false)}>
                        <div className="privacy-title-container">
                            <img className="privacy-img" src={getPrivacy()}/>
                            <span className="privacy-title">Privacy Policy</span>
                        </div>
                        <div className="privacy-text">
                            Last Updated: December 22, 2022<br/><br/>

                            This Privacy Policy outlines the information that Moebooru (”we”, “us”, “our”) 
                            collects when you use our website ("site"). It
                            also describes how we use your information and how your information is shared. <br/><br/>

                            Collected Information<br/>
                            We collect information that you provide directly to us, which includes:<br/><br/>

                            <span className="privacy-text-alt">Account Information</span> - If you create a Moebooru account, we need to store your 
                            username, email, password, bio, and any account preferences. Passwords are hashed and salted with the secure bcrypt algorithm.<br/><br/>

                            <span className="privacy-text-alt">Content You Submit</span> - We collect any content that you submit which may include
                            text, images, gifs, videos. For example, posts and comments. <br/><br/>

                            <span className="privacy-text-alt">Actions You Take</span> - We collect information on the interactions that you make with
                            content, such as favoriting posts and rating their cuteness.<br/><br/>

                            We also automatically collect information when you access our service, 
                            which includes:<br/><br/>

                            <span className="privacy-text-alt">Log and Usage Data</span> - We may log information when you access our services 
                            which may include your IP Address, device information, pages visited, requested URL,
                            and search terms.<br/><br/>

                            <span className="privacy-text-alt">Cookies</span> - Cookies are used to maintain your
                            login session.<br/><br/>

                            How We Use Your Information<br/>
                            We use your information in order to:<br/>
                            <span className="privacy-text-alt">
                            ⇾ Provide our site's functionality.<br/>
                            ⇾ Protect our site from abuse and spam.<br/>
                            ⇾ Analyze usage data in connection with our site.<br/><br/>
                            </span>

                            How Information About You Is Shared<br/>
                            <span className="privacy-text-alt">
                            ⇾ Unless it is stated otherwise, any content that you submit to our site is
                            visible to the public. <br/>
                            ⇾ You can choose to make certain information private, such as
                            your favorites. <br/><br/>
                            </span>

                            We do not share personal information with third parties unless one of
                            the following holds:<br/>
                            <span className="privacy-text-alt">
                            ⇾ We have your consent.<br/>
                            ⇾ It is aggregated and anomalyzed in a way that can’t be traced back to you.<br/>
                            ⇾ It is required to comply with the law.<br/><br/>
                            </span>

                            Controlling Your Information<br/>
                            <span className="privacy-text-alt">Changing your information</span> - You can update your information, 
                            such as username, email, and password anytime in your account settings.<br/><br/>

                            <span className="privacy-text-alt">Deleting your account</span> - You can delete your account in your account
                            settings. When you delete your account all of your non-public personal
                            information is deleted. Your public contributions, such as posts, will not be deleted. Your contributions
                            will however get disconnected from your username. <br/><br/>

                            Changes to this Policy<br/>
                            We may make changes to this policy at any time, indicated by its
                            “Last Updated” date. Changes to this policy are effective immediately
                            and by continuing to use our site after the policy is revised, you
                            are agreeing to the revised policy.
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