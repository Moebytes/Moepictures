import {Html, Head, Body, Preview, Container, Text, Img, Link, Button} from "@react-email/components"

const logoContainer = {
    display: "flex",
    width: "100%",
    justifyContent: "center"
}

const logo = {
    display: "block",
    width: "auto",
    height: "110px",
    marginBottom: "-13px"
}

const textContainer = {
    display: "flex",
    width: "100%",
    justifyContent: "center"
}

const text = {
    fontFamily: "Tahoma, sans-serif",
    color: "black",
    fontSize: "20px"
}

const buttonContainer = {
    display: "flex",
    width: "100%",
    justifyContent: "center"
}

const button = {
    margin: "auto",
    marginTop: "10px",
    marginBottom: "10px",
    backgroundColor: "#7e7aff",
    border: "2px solid black",
    padding: "0px 10px",
    width: "max-content"
}

const buttonText = {
    fontFamily: "Tahoma, sans-serif",
    color: "black",
    fontWeight: "bold",
    fontSize: "26px"
}

const hoverTags = `
    .button-text:hover {
        color: white !important;
    }
`

interface Props {
    username: string
    link: string
}

const ChangeEmail = (props: Props) => {
    const {username, link} = props

    return (
        <Html lang="en">
            <Head><style>{hoverTags}</style></Head>
            <Preview>Moepictures Email Change</Preview>
            <Body style={{width: "85%"}}>
                <Container style={logoContainer}>
                    <Link href="https://moepictures.moe"><Img style={logo} src="https://i.imgur.com/Wv5cKhP.png"/></Link>
                </Container>
                <Container style={textContainer}>
                    <Text style={text}>
                        Hi {username}, <br/><br/>
            
                        You recently made a request to change your email to this address. 
                        Your email will be updated after you click on the link below. *If the link doesn't work, take this email 
                        out of the spam folder. <br/>
                    </Text>
                </Container>
                <Container style={buttonContainer}>
                    <Button style={button} href={link}>
                        <Text style={buttonText} className="button-text">Change Email</Text>
                    </Button>
                </Container>
            </Body>
        </Html>
  )
}

export default ChangeEmail
