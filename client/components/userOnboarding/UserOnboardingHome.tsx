import React, { useState } from "react";

import { BiArrowBack } from "react-icons/bi";
import { useRouter } from "next/router"

import {
    useAccount
} from "wagmi"

import CreateNewWallet from "./CreateNewWallet";
import OnboardExistingWallet from "./OnboardExistingWallet";
import RecoverWallet from "./RecoverWallet";

import { useAtom } from "jotai"
import { zkWhisperAccountAddressAtom } from "../../state/atom"


enum OnboardingComponentEnum {
  Create = "Create",
  Onboard = "Onboard",
  Recover = "Recover",
  Default = "Default",
}

const UserOnboardingHome: React.FC = () => {

   const router = useRouter()

  const [zkWhisperAccountAddress, setZkWhisperAccountAddress] = useAtom(
        zkWhisperAccountAddressAtom
    )

  const { address, isConnected } = useAccount() //metamask address

  const [currentOnboardingComponent, setCurrentOnboardingComponent] = useState(
    OnboardingComponentEnum.Default
  );

  //TODO: use 'atom' states here
  const handleButtonClick = (componentName: OnboardingComponentEnum) => {
    setCurrentOnboardingComponent(componentName);
  };

  const handleBackButtonClick = () => {
    setCurrentOnboardingComponent(OnboardingComponentEnum.Default);
  };

  const renderOnboardingComponent = () => {
    switch (currentOnboardingComponent) {
      case OnboardingComponentEnum.Create:
        return <CreateNewWallet />;
      case OnboardingComponentEnum.Onboard:
        return <OnboardExistingWallet />;
      case OnboardingComponentEnum.Recover:
        return <RecoverWallet />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-10">
            <button
              className="button rounded-lg font-bold bg-amber-400 border-4 border-amber-400 p-4 my-5 min-w-[300px] hover:bg-white"
              onClick={() => handleButtonClick(OnboardingComponentEnum.Create)}
            >
              Create New ZKWhisper Wallet
            </button>
            <button
              className="button rounded-lg font-bold bg-amber-400 border-4 border-amber-400 p-4 my-5 min-w-[300px] hover:bg-white"
              onClick={() => handleButtonClick(OnboardingComponentEnum.Onboard)}
            >
              Already Have A ZKWhisper Wallet?
            </button>
            <button
              className="button rounded-lg font-bold bg-amber-400 border-4 border-amber-400 p-4 my-5 min-w-[300px] hover:bg-white"
              onClick={() => handleButtonClick(OnboardingComponentEnum.Recover)}
            >
              Recover A ZKWhisper
            </button>
          </div>
        );
    }
  };

  return (
      <div>
          <div className="flex flex-col items-center justify-between px-10 py-2">
              {/* {zkWhisperAccountAddress && (
                  <div className="flex flex-col items-center justify-between px-10 py-2">
                      <button
                          className="button rounded-lg font-bold bg-black text-white border-4 border-black p-4 my-5 min-w-[300px] hover:bg-white hover:text-black"
                          onClick={() => router.push("/recovery")}
                      >
                          Setup Wallet Recovery
                      </button>
                      <button
                          className="button rounded-lg font-bold bg-black text-white border-4 border-black p-4 my-5 min-w-[300px] hover:bg-white hover:text-black"
                          onClick={() => router.push("/recovery")}
                      >
                          Transfer Funds to Your ZKWhisper Account
                      </button>
                      <p>Only you will hold the keys for this account!</p>
                  </div>
              )} */}
              {
                  (currentOnboardingComponent ? (
                      <div className="flex flex-col items-center justify-between px-10 py-2">
                          {renderOnboardingComponent()}
                          {/* <div className="flex flex-col items-center fixed bottom-10 left-0 w-full cursor-pointer"> */}
                          <div className="flex flex-col items-center w-full cursor-pointer py-40">
                              <BiArrowBack size={25} onClick={handleBackButtonClick} />
                              <button onClick={handleBackButtonClick}>Home</button>
                              {isConnected && <p className="font-mono">Connected to {address}</p>}
                          </div>
                      </div>
                  ) : (
                      renderOnboardingComponent()
                  ))}
          </div>
      </div>
  )
};

export default UserOnboardingHome;
