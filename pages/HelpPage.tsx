import React, {useContext, useEffect} from "react"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import DragAndDrop from "../components/DragAndDrop"
import {HideNavbarContext, HideSidebarContext, RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext,
MobileContext, EnableDragContext} from "../Context"
import imagefiltersImg from "../assets/misc/imagefilters.png"
import gifPlayerImg from "../assets/misc/gifplayer.png"
import videoPlayerImg from "../assets/misc/videoplayer.png"
import musicPlayerImg from "../assets/misc/musicplayer.png"
import $3dPlayerImg from "../assets/misc/3dplayer.png"
import cutenessMeterImg from "../assets/misc/cutenessmeter.png"
import searchingImg from "../assets/misc/searching.png"
import "./styles/helppage.less"

const HelpPage: React.FunctionComponent = (props) => {
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {mobile, setMobile} = useContext(MobileContext)

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        document.title = "Moebooru: Help"
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
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])
    
    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="help">
                    <span className="help-heading">Help</span>
                    <span className="help-text">Welcome to Moebooru!</span>
                    <span className="help-text">
                        Moebooru is a search board organized by tags, dedicated exclusively to showcasing the cutest works made by creatives. While the majority of content is (and will likely be)
                        digital art, we are open to any other artforms including animations, music, and 3d models. If you need specific help with 
                        anything, you can navigate by clicking on a specific category!
                        <div className="help-link-container">
                            <Link className="help-link" to="/help#account">Account</Link>
                            <Link className="help-link" to="/help#searching">Searching</Link>
                            <Link className="help-link" to="/help#image-searching">Image Searching</Link>
                            <Link className="help-link" to="/help#image-filters">Image Filters</Link>
                            <Link className="help-link" to="/help#gif-player">GIF Player</Link>
                            <Link className="help-link" to="/help#video-player">Video Player</Link>
                            <Link className="help-link" to="/help#3d-model-player">3D Model Player</Link>
                            <Link className="help-link" to="/help#music-player">Music Player</Link>
                            <Link className="help-link" to="/help#favorites">Favorites</Link>
                            <Link className="help-link" to="/help#cuteness-meter">Cuteness Meter</Link>
                            <Link className="help-link" to="/help#uploading">Uploading</Link>
                            <Link className="help-link" to="/help#variations">Variations</Link>
                            <Link className="help-link" to="/help#third-party-edits">Third-Party Edits</Link>
                            <Link className="help-link" to="/help#tagging">Tagging</Link>
                            <Link className="help-link" to="/help#aliases">Aliases</Link>
                            <Link className="help-link" to="/help#commenting">Commenting</Link>
                            <Link className="help-link" to="/help#bans">Bans</Link>
                            <Link className="help-link" to="/help#ai-protection">AI Protection</Link>
                            <Link className="help-link" to="/help#deleting-account">Deleting Your Account</Link>
                        </div>
                    </span>
                    <span className="help-heading" id="account">Account</span>
                    <span className="help-text">
                        By creating an account you affirm that you are 18 years or older. All accounts must have
                        a verified email address. An account lets you view questionable posts, upload, favorite, 
                        comment, rate cuteness and edit posts and tags. <br/><br/> 
                        
                        You can change your avatar by clicking on "Set Avatar" under any post page. Because only anime avatars are allowed, you can only use images from the site.<br/><br/>

                        For greater account security, you can enable 2-factor authentication. This will prompt you for a time-sensitive 2fa token in addition to your password while logging in.<br/><br/>

                        Some actions such as uploading a new post or aliasing a tag to another tag will be reviewed by the site staff.
                    </span>
                    <span className="help-heading" id="searching">Searching</span>
                    <span className="help-text">
                        The tags on Moebooru use a dash ("-") as a delimeter, but you can also search with spaces because the search can guess what tags you are searching for.
                        If you encounter a problem with this, use dashed versions of the tags. These are examples
                        of valid searches: <br/>
                        <span className="help-alt">
                        Tag 1 Tag 2 Tag 3 <br/>
                        Tag-1 Tag-2 Tag-3 <br/>
                        </span>

                        Special tag modifiers: <br/>
                        <span className="help-alt">-Tag 1 -Tag 2</span> - Exclude posts containing Tag 1 and Tag 2. <br/>
                        <span className="help-alt">+Tag 1 +Tag 2</span> - Include posts containing either Tag 1 or Tag 2. <br/>

                        These are some various tags with special uses. <br/>
                        <span className="help-alt">original</span> - the drawing is original, ie. not fanart. <br/>
                        <span className="help-alt">self post</span> - the post was uploaded by its original creator. <br/>
                        <span className="help-alt">unknown artist</span> - the artist is not known. <br/>
                        <span className="help-alt">unknown character</span> - the character is unknown and might not be original. <br/>
                        <span className="help-alt">unknown series</span> - the series is unknown. <br/>
                        <span className="help-alt">no character</span> - no character or not applicable. <br/>
                        <span className="help-alt">no series</span> - not part of any series or not applicable. <br/>
                        <span className="help-alt">needs tags</span> - current post tags are insufficient. <br/>
                        <span className="help-alt">text</span> - the post contains text. <br/>
                        <span className="help-alt">transparent</span> - the post has transparency. <br/>
                        <span className="help-alt">no audio</span> - the post is a video with no audio. <br/>
                        <span className="help-alt">with audio</span> - the post is a video that has audio. <br/>
                    </span>
                    <span className="help-heading" id="image-searching">Image Searching</span>
                    <span className="help-text">
                        Every image uploaded to Moebooru is hashed with a perceptual hash algorithm, which means 
                        that images that look the same should yield similar hashes. This is different from binary hashes which only hash the 
                        binary data of the image, so for example if you were to resize the same image it would yield totally different hashes 
                        with a binary hashing algorithm. <br/><br/>

                        When you do an image search your upload is perceptually hashed and we try to find a matching hash in our database. Usually 
                        this is very accurate at finding duplicate images. If you upload a video, song, or model, we use a binary hash instead, so only 
                        perfect matches to these works will be able to be found.
                    </span>
                    <span className="help-heading" id="image-filters">Image Filters</span>
                    <div className="help-img-container"><img className="help-img" src={imagefiltersImg}/></div>
                    <span className="help-text">
                        You can apply custom filters to image, such as brightness, contrast, hue, and sharpen. Most images will look a little better 
                        with some additional brightness/contrast. Some filters like blur and pixelate will completely destroy most images, and they 
                        are purely for fun.
                    </span>
                    <span className="help-heading" id="gif-player">GIF Player</span>
                    <div className="help-img-container"><img className="help-img" src={gifPlayerImg}/></div>
                    <span className="help-text">
                        Moebooru has a custom GIF player, which allows additionally functionality which is normally not possible with gifs such as 
                        seeking, pausing, playback in reverse, and modification of the playback speed.
                    </span>
                    <span className="help-heading" id="video-player">Video Player</span>
                    <div className="help-img-container"><img className="help-img" src={videoPlayerImg}/></div>
                    <span className="help-text">
                        The video player allows some additional functionality such as modification of playback speed, reverse 
                        playback, and toggleable pitch preservement (ie, if a video is sped up, then this controls if the audio pitch will also get pitched up). <br/><br/>

                        The reverse playback only works in Chromium-based browsers (Chrome, Opera, Edge) and will not work in Safari or Firefox because they don't yet support the 
                        API. Also, full-screening videos will not work in iOS Safari.
                    </span>
                    <span className="help-heading" id="3d-model-player">3D Model Player</span>
                    <div className="help-img-container"><img className="help-img" src={$3dPlayerImg}/></div>
                    <span className="help-text">
                        The 3d model player supports 3d models and animations. There are additional controls for toggling wireframe, matcap, editing shapekeys and lighting. Due 
                        to limitations animations are not supported in wireframe mode.
                    </span>
                    <span className="help-heading" id="music-player">Music Player</span>
                    <div className="help-img-container"><img className="help-img" src={musicPlayerImg}/></div>
                    <span className="help-text">
                        The music player supports most of the controls seen on the video player. Reverse audio playback should not have any browser limitations.
                    </span>
                    <span className="help-heading" id="favorites">Favorites</span>
                    <span className="help-text">
                        If you like an image, you can add it to your favorites for easier access later on.
                        By default, your favorites are public but they can be made private in your account
                        settings.
                    </span>
                    <span className="help-heading" id="cuteness-meter">Cuteness Meter</span>
                    <div className="help-img-container"><img className="help-img" src={cutenessMeterImg}/></div>
                    <span className="help-text">
                        The rating system on Moebooru is called the cuteness meter. When you rate an
                        image you are not rating the quality, instead you are rating the amount
                        of cuteness that the image evokes. The scale is from 0 (Not cute) to 500 (Pretty
                        cute) to 1000 (Insanely cute).
                    </span>
                    <span className="help-heading" id="uploading">Uploading</span>
                    <span className="help-text">
                        Moebooru is a lot stricter with posts than most other image boards. We allow images, gifs, videos, comics, music, and models.<br/><br/>
                        Please read carefully through all of the uploading guidelines. <br/>
                        <span className="help-alt">
                        ⇾ Must be drawn or modeled in the anime art style. No photographs or art drawn/modeled in other styles. <br/>
                        ⇾ (Music only) The song should include elements that make it sound kawaii, including samples from anime is a good example. <br/>
                        ⇾ The main subject should be a girl. Boys are allowed only as supporting characters.
                        And art with other subjects (animals, food, backgrounds, etc). is not allowed. <br/>
                        ⇾ It should be cute. If it doesn't evoke some feelings of cuteness, it won't get accepted. <br/>
                        ⇾ No duplicates are allowed. Variations of the same image should be added to the original post. <br/>
                        ⇾ Sketches and unfinished art might be allowed only if they are very good. <br/>
                        ⇾ Color palette should be pleasant to look at, ie. there are no oversaturated colors that clash too much. <br/>
                        ⇾ The drawing should look clean overall and shouldn't look messy or have obvious mistakes. <br/>
                        ⇾ The perspective, proportions, and anatomy shouldn't look weird. <br/>
                        ⇾ Animations should play faster than 2fps (shouldn't look stuttery). <br/>
                        ⇾ Source information is required for all posts. <br/>
                        ⇾ All tags should be romanized. Titles and commentary don't have to be romanized. <br/>
                        ⇾ No hentai. We allow light nudity but don't allow any sexual acts. <br/>
                        ⇾ No AI generated works. I only want art with real human love and passion behind it, and most of these are plagiarized from stolen works. <br/>
                        ⇾ No paid rewards. This is not a piracy site, please support artists for their hard work.
                        </span>
                    </span>
                    <span className="help-heading" id="variations">Variations</span>
                    <span className="help-text">
                        All variations of the same image are combined into a single post. You can add a variation to an existing post 
                        by editing it. All variations of an image should be created by the original artist, otherwise it is considered a third party edit instead.
                        If an image has significantly different tags to the main post, then it is probably best to make that image it's own post instead of a variation.
                    </span>
                    <span className="help-heading" id="third-party-edits">Third Party Edits</span>
                    <span className="help-text">
                        Third party edits are modifications to a work not done by the original artist. For
                        example, a manga with all text translated to English, or animation of an 
                        image not done by the original artist. Third party edits behave like their own separate post,
                        but each third party edit is added to the original post in a separate section and it doesn't appear directly in search.
                    </span>
                    <span className="help-heading" id="tagging">Tagging</span>
                    <span className="help-text">
                        You don’t have to be exceedingly thorough but some effort placed on tags is required, 
                        these are some guidelines on what features to tag: <br/>
                        <span className="help-alt">
                        ⇾ Clothing (school-uniform, sailor-uniform, coat, skirt, leggings, etc). <br/>
                        ⇾ Hair Color (blonde-hair, red-hair, blue-hair, etc). <br/>
                        ⇾ Hair Length (short-hair, medium-hair, long-hair, etc). <br/>
                        ⇾ Hair Styles (twintails, ponytail, braid, etc). <br/>
                        ⇾ Special Accessories (hat, ribbon, bracelet, etc). <br/>
                        ⇾ Expressions (smiling, crying, surprised, etc). <br/>
                        ⇾ Actions (sleeping, running, eating, etc). <br/>
                        ⇾ Body Parts (small-breasts, long-legs, etc). <br/>
                        ⇾ Objects (coffee, umbrella, flower, etc). <br/>
                        ⇾ Environment (daytime, nighttime, sunrise, sunset, snow, rain, fog, etc). <br/>
                        ⇾ Software (live2d, blender, etc).
                        </span>
                    </span>
                    <span className="help-heading" id="aliases">Aliases</span>
                    <span className="help-text">
                        A tag can have multiple aliases that yield the same result. This is to
                        facilitate better searching for synonyms like "has audio" and "with audio". Unlike tags, aliases can include non-ASCII characters 
                        so it is possible to add an alias in Japanese in order to enable Japanese searching. You can also alias an existing tag to another tag,
                        but this is an action that needs to be approved by the site staff.
                    </span>
                    <span className="help-heading" id="commenting">Commenting</span>
                    <span className="help-text">
                        Comments are for sharing your thoughts of the work. These are the rules for the comment section: <br/>
                        <span className="help-alt">
                        ⇾ No spam, jibberish, or otherwise off-topic comments. <br/>
                        ⇾ No fights with each other. <br/>
                        ⇾ No distasteful comments. <br/>
                        </span>

                        Quotes are supported and we have a syntax that makes it easy to do quotes. <br/>
                        <span className="help-alt">
                        &gt;&gt;&gt; User said:<br/>
                        &gt; Comment <br/>
                        </span>
                        Nested quotes are not supported. If you see a comment that is breaking the rules, please report it.
                    </span>
                    <span className="help-heading" id="bans">Bans</span>
                    <span className="help-text">
                        If you break the rules severely or consistently, you might get banned. If you get banned, you 
                        are not allowed to register another account. Depending on the severity, we might delete all of your comments 
                        and edit history.
                    </span>
                    <span className="help-heading" id="ai-protection">AI Protection</span>
                    <span className="help-text">
                        All images are sent encrypted and they are decrypted in the browser. This prevents direct image downloads without first
                        decrypting the binary data.<br/><br/>

                        Accessing the tags of a specific post is protected information, you will need to solve a captcha 
                        after viewing the tags of 50 posts. There is no way to bypass the captcha, but you can choose to not solve it and you will be
                        able to browse posts without seeing their tags.<br/><br/> 
                        
                        These are by no means perfect solutions, but I hope that by making our website difficult to scrape it would deter 
                        scrapers to go somewhere else. If you have any other ideas on how to protect our website against scrapers, feel free to contact us.
                    </span>
                    <span className="help-heading" id="deleting-account">Deleting Your Account</span>
                    <span className="help-text">
                        Because Moebooru is a site that is focused on community contributions, when you delete your account we will not 
                        remove any of your public contributions like submitted posts. Your uploads will remain but the account that uploaded them will 
                        show up as "deleted". All the rest of your account data and comments will be deleted. If someone quoted you 
                        in the comments section, some of your comments might still remain.
                    </span>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default HelpPage