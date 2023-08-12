import type { NextPage } from "next"
import Head from "next/head"
import Script from "next/script"
import Header from "../components/Header"
import UserOnboardingHome from "../components/userOnboarding/UserOnboardingHome"
import CreateNewWallet from "../components/userOnboarding/CreateNewWallet"
import SocialRecoverySetup from "@/components/socialRecovery/SocialRecoverySetup"

const style = {
    wrapper: `h-100vh w-100vw select-none flex flex-col`,
}

//TODO: change font to something cool and simple instead of default one here
const Home: NextPage = () => {
    return (
        <div className={style.wrapper}>
            <Script src="/js/snarkjs.min.js" />
            <Head>
                <title> ZKW</title>
                <meta content="Zero Knowledge Wallet for User Sovereignty" name="description" />
                <link href="/favicon.ico" rel="icon" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;700&display=swap"
                    rel="stylesheet"
                />
                +{" "}
                <style>{`
                    body {
                        font-family: 'Raleway', sans-serif;
                    }
                `}</style>
            </Head>

            <div>
                <Header
                    title="ZKWhisper"
                    subtitle="Truely Zero Knowledge Social Recovery Wallet for User Sovereignty"
                />
                <hr className="py-1" />
                {/* //TODO: change the below section as per global state */}
                <UserOnboardingHome />
            </div>
        </div>
    )
}

export default Home
