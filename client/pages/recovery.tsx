import type { NextPage } from "next"
import { useRouter } from "next/router"


import SocialRecoverySetup from "../components/socialRecovery/SocialRecoverySetup"

const RecoveryPage: NextPage = () => {
    const router = useRouter()
    return (
        <div className="flex flex-col items-center justify-center py-5">
            <SocialRecoverySetup />
            <button
                className="button rounded-lg font-bold bg-amber-400 border-4 border-black p-4 my-5 min-w-[300px] hover:bg-white hover:text-black"
                onClick={() => router.push("/")}
            >
                Log Out
            </button>
        </div>
    )
}

export default RecoveryPage