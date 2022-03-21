import React, {useContext, useEffect} from "react"
import TitleBar from "./TitleBar"
import NavBar from "./NavBar"
import SideBar from "./SideBar"
import Footer from "./Footer"
import {HideNavbarContext, HideSidebarContext} from "../App"
import "../styles/helppage.less"

const HelpPage: React.FunctionComponent = (props) => {
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)

    useEffect(() => {
        setHideNavbar(false)
        setHideSidebar(false)
        document.title = "Moebooru: Help"
    }, [])
    
    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="help">
                    <span className="help-heading">Help</span>
                    <span className="help-text">Welcome to Moebooru!</span>
                    <span className="help-text">
                        Moebooru is an image board organized by tags, centered exclusively around the art of moe anime girls. Unlike most other
                        image boards, Moebooru has several improvements such as allowing spaces in tags and having tag aliases. Also, since Moebooru
                        has a smaller focus it contains a much smaller collection of images. In short, you will only find images that are really cute. Our 
                        rating system is also based on rating cuteness rather than quality. I hope that you prefer using Moebooru's tag system 
                        and overall find it friendly to navigate.
                    </span>
                    <span className="help-heading">Account</span>
                    <span className="help-text">
                        You must be 18 or older in order to create an account on Moebooru. Having an account
                        with a verified email address allows you to view questionable posts, upload, favorite, 
                        comment, rate cuteness and edit tags and translations. Accounts that are not verified behave the same as 
                        having no account. <br/><br/> You can change your avatar by clicking on “set avatar” under any post. You are only allowed to use
                        images from the site as your avatar. Username changes are allowed once per week and you can change your email as many times as you'd like. <br/><br/>
                        Some actions such as uploading a new post or aliasing a tag to another tag will need to get approved by a moderator.
                    </span>
                    <span className="help-heading">Searching</span>
                    <span className="help-text">
                        The tags on Moebooru can contain spaces, because the search is smart enough to parse out the tags.
                        If you encounter a problem, you can also use dashes or hashtags as delimiters. These are examples
                        of valid searches: <br/>
                        <span className="help-alt">
                        Tag 1 Tag 2 Tag 3 <br/>
                        Tag-1 Tag-2 Tag-3 <br/>
                        #Tag 1 #Tag 2 #Tag 3 <br/>
                        </span>

                        The following are special tag modifiers: <br/>
                        <span className="help-alt">-Tag 1</span> - Exclude posts containing Tag 1. <br/>
                        <span className="help-alt">+Tag 1 +Tag 2</span> - Include posts containing either Tag 1 or Tag 2. <br/>
                        <span className="help-alt">*string</span> - Match all tags containing this string. <br/><br/>

                        These are special tags for filtering search results, you don't need to type them directly because they're in the sorting options. <br/>
                        <span className="help-alt">image</span> - only display static images. <br/>
                        <span className="help-alt">animated</span> - only display animated images (excluding videos). <br/>
                        <span className="help-alt">video</span> - only display videos. <br/>
                        <span className="help-alt">comic</span> - only display comics/manga. <br/>
                        <span className="help-alt">safe</span> - only display safe images. <br/>
                        <span className="help-alt">questionable</span> - only display images that are not sexually explicit, but still questionable. <br/>
                        <span className="help-alt">explicit</span> - only display sexually explicit images. <br/>
                        <span className="help-alt">2D</span> - only display 2D art. 2D art with some 3D elements also falls under here. <br/>
                        <span className="help-alt">3D</span> - only display 3D art. <br/>
                        <span className="help-alt">pixel</span> - only display pixel art. <br/>
                        <span className="help-alt">chibi</span> - only display chibi art. <br/>
                        <span className="help-alt">date</span> - sort posts by uploaded date in descending order. <br/>
                        <span className="help-alt">reverse date</span> - sort posts by uploaded date in ascending order. <br/>
                        <span className="help-alt">drawn</span> - sort posts by drawn date in descending order. <br/>
                        <span className="help-alt">reverse drawn</span> - sort posts by drawn date in ascending order. <br/>
                        <span className="help-alt">cuteness</span> - sort posts by cuteness in descending order. <br/>
                        <span className="help-alt">reverse cuteness</span> - sort posts by cuteness in ascending order. <br/>
                        <span className="help-alt">favorites</span> - sort posts by favorites in descending order. <br/>
                        <span className="help-alt">reverse favorites</span> - sort posts by favorites in ascending order. <br/><br/>
                        These are special tags not in the sort bar. <br/>
                        <span className="help-alt">original</span> - the drawing is original, ie. not fanart. <br/>
                        <span className="help-alt">unknown artist</span> - the artist is not known. <br/>
                        <span className="help-alt">unknown character</span> - the character is unknown and might not be original. <br/>
                        <span className="help-alt">untranslated</span> - the post contains text that is untranslated. <br/>
                        <span className="help-alt">partially translated</span> - the post is only partially translated. <br/>
                        <span className="help-alt">check translation</span> - the translations in the post might be incorrect. <br/>
                        <span className="help-alt">translated</span> - the post is fully translated. <br/>
                        <span className="help-alt">no audio</span> - the post is a video with no audio. <br/>
                        <span className="help-alt">with audio</span> - the post is a video that has audio.
                    </span>
                    <span className="help-heading">Cuteness</span>
                    <span className="help-text">
                        The rating system on Moebooru is called the cuteness meter. When you rate an
                        image you are not necessarily rating the quality, instead you are rating the amount
                        of cuteness that the image evokes. The scale is from 0 (Not cute) to 500 (Pretty
                        cute) to 1000 (Diabetes).
                    </span>
                    <span className="help-heading">Favorites</span>
                    <span className="help-text">
                        If you like an image, you can add it to your favorites for easier access later on.
                        By default, your favorites are public but they can be made private in your account
                        settings.
                    </span>
                    <span className="help-heading">Uploading</span>
                    <span className="help-text">
                        Moebooru has a strict criteria for uploading, so don't take it personally if
                        your post doesn't get approved. You can upload images, gifs, videos, and comics.<br/><br/>
                        Please read carefully through all of the uploading guidelines. <br/>
                        <span className="help-alt">
                        ⇾ Must be drawn in the anime art style. No photographs or art drawn in other styles. <br/>
                        ⇾ The main character must be a girl. Boys are only allowed as supporting characters.
                        Other misc art (animals, food, backgrounds, etc). is not allowed. <br/>
                        ⇾ It must be cute. If it doesn’t evoke some feelings of cuteness, it won’t get accepted. <br/>
                        ⇾ No duplicates are allowed whatsover, variations of the same image should be
                        added to the original post. <br/>
                        ⇾ Higher resolutions of an image should replace the original post. However, there is a point of diminishing
                        returns where the quality improvement doesn't justify the filesize. <br/>
                        ⇾ No sketches or otherwise unfinished art, unless they are very good. <br/>
                        ⇾ Colors should be pleasant, no overly saturated colors or palettes that clash. <br/>
                        ⇾ The coloring/lineart should be clean and shouldn't look messy. <br/>
                        ⇾ Perspective, proportions, and anatomy shouldn’t look weird. <br/>
                        ⇾ Animations shouldn't look choppy. <br/>
                        ⇾ A source is required for all posts unless you're posting your own artwork. <br/>
                        ⇾ All tags should be romanized. 
                        </span>
                    </span>
                    <span className="help-heading">Variations</span>
                    <span className="help-text">
                        All variations of the same image are combined into a single post. If one of the variations is a video or
                        animated image, it will be displayed at the front. The tags of the post can describe features in any of the 
                        images. If an image has significantly different tags, then it is probably best to make that image it's own
                        post instead of a variation.
                    </span>
                    <span className="help-heading">Third-Party Edits</span>
                    <span className="help-text">
                        Third-party edits are modifications to a work not done by the original artist. For
                        example, a manga with all the text translated to English, or animation of an 
                        image not done by the original artist. All third-party edits can be found in the post 
                        of the original work in a separate section. If a search result yields both a third-party edit 
                        and its original work, only the original work is shown in the search results.
                    </span>
                    <span className="help-heading">Tagging</span>
                    <span className="help-text">
                        In order to make images searchable at all, an artist and character is required for every
                        post. If you cannot figure out the artist or character use the tags “unknown artist”
                        or “unknown character”. The series from where the character is from is also required if
                        the character is not “original”. All of classification tags such as "image", "safe", and "2D" are 
                        automatically added so you don't need to include them. <br/><br/>
                        You don’t have to be exceedingly thorough but some effort placed on tags is required, 
                        these are some guidelines on what features to tag: <br/>
                        <span className="help-alt">
                        ⇾ Clothing (school uniform, sailor uniform, skirt, leggings, etc). <br/>
                        ⇾ Hair Color (blonde, redhead, blue hair, etc). <br/>
                        ⇾ Hair Length (short hair, medium hair, long hair, etc). <br/>
                        ⇾ Hair Styles (ponytail, pigtail, braid, etc). <br/>
                        ⇾ Special Accessories (hat, ribbon, bracelet, etc). <br/>
                        ⇾ Expressions (smiling, crying, surprised, etc). <br/>
                        ⇾ Actions (sleeping, running, eating, etc). <br/>
                        ⇾ Body Parts (small breasts, long legs, etc). <br/>
                        ⇾ Objects (coffee, umbrella, flower, etc). <br/>
                        ⇾ Environment (night, sunrise, sunset, snow, rain, fog, etc). <br/>
                        ⇾ Software (live2d, blender, etc).
                        </span>
                    </span>
                    <span className="help-heading">Aliases</span>
                    <span className="help-text">
                        A tag can have multiple aliases that yield the same result. This is to
                        facilitate better searching for tags that have nearly the same name such as 
                        “with audio” and “has audio”. Unlike tags, aliases can include non-ASCII characters 
                        so it is possible to add an alias in Japanese in order to enable Japanese searching. 
                        You can freely add aliases to tags in the tags page, but aliasing a tag
                        to another tag will need to be manually approved. 
                    </span>
                    <span className="help-heading">Commenting</span>
                    <span className="help-text">
                        The comments are for sharing your thoughts of the work. These are the rules for the comment section: <br/>
                        <span className="help-alt">
                        ⇾ No spam, jibberish, or otherwise off-topic comments. <br/>
                        ⇾ No fights with each other. <br/>
                        ⇾ No distasteful comments. <br/>
                        </span>
                    </span>
                    <span className="help-heading">Reporting</span>
                    <span className="help-text">
                        If you see anything that is amiss, please report it. You can report posts for not 
                        being cute, users that are breaking rules, translations that are wrong, etc.
                    </span>
                    <span className="help-heading">Bans</span>
                    <span className="help-text">
                        If you break the rules severely or consistently, you might get banned. If you get banned, you 
                        are not allowed to register for another account. You can still freely browse the site without an account.
                    </span>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default HelpPage