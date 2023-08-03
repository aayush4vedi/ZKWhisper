import React, { useState } from "react"

import { BiArrowBack } from "react-icons/bi"

import CreateNewWallet from "./CreateNewWallet"
import OnboardExistingWallet from "./OnboardExistingWallet"
import RecoverWallet from "./RecoverWallet"

const UserOnboardingHome: React.FC = () => {
    const [currentOnboardingComponent, setCurrentOnboardingComponent] = useState(null)

    //TODO: use 'atom' states here
    const handleButtonClick = (componentName) => {
        setCurrentOnboardingComponent(componentName)
    }

    const handleBackButtonClick = () => {
        setCurrentOnboardingComponent(null)
    }

    const renderOnboardingComponent = () => {
        switch (currentOnboardingComponent) {
            case "CreateNewWallet":
                return <CreateNewWallet/>
            case "OnboardExistingWallet":
                return <OnboardExistingWallet />
            case "RecoverWallet":
                return <RecoverWallet/>
            default:
                return (
                    <div className="flex flex-col items-center justify-center py-10">
            <button
                className="button rounded-lg bg-amber-400 border-4 border-amber-400 p-4 my-5 min-w-[300px] hover:bg-white"
                onClick={() => handleButtonClick("CreateNewWallet")}
            >
                Create New Wallet
            </button>
            <button
                className="button rounded-lg bg-amber-400 border-4 border-amber-400 p-4 my-5 min-w-[300px] hover:bg-white"
                onClick={() => handleButtonClick("OnboardExistingWallet")}
            >
                Add An Existing Wallet
            </button>
            <button
                className="button rounded-lg bg-amber-400 border-4 border-amber-400 p-4 my-5 min-w-[300px] hover:bg-white"
                onClick={() => handleButtonClick("RecoverWallet")}
            >
                Recover A Wallet
            </button>
        </div>
                )
        }
    }

    return (
        <div>
            {currentOnboardingComponent ? (
                <div className="flex flex-col items-center justify-between px-10 py-2">
                    {renderOnboardingComponent()}
                    <button onClick={handleBackButtonClick} >Go Back</button>
                </div>
            ) : (
                renderOnboardingComponent()
            )}
        </div>
    )
}

export default UserOnboardingHome
