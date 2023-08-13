import { BigInt, Address } from "@graphprotocol/graph-ts"
import {
    ZKWhisper,
    LoginItem as LoginItemEvent,
    SignupItem as SignupItemEvent,
    RecoverySetup as RecoverySetupEvent,
    Recovery as RecoveryEvent,
} from "../generated/ZKWhisper/ZKWhisper";
import { LoginItem, SignupItem, RecoverySetup, Recovery } from "../generated/schema"

export function hanldeLoginEvent(event: LoginItemEvent): void {
  let loginItem = LoginItem.load(
    getIdFromEventParams(event.params.tokenId, event.params.nftAddress)
  );
  let signupItem = SignupItem.load(
    getIdFromEventParams(event.params.tokenId, event.params.nftAddress)
  );

  loginItem.save();
  signupItem.save();
}

export function hanldeSignupEvent(event: SignupItemEvent): void {
    let signupItem = SignupItem.load(
        getIdFromEventParams(event.params.tokenId, event.params.tokenAddress)
    );
    if (!signupItem) {
        signupItem = new SignupItem(
            getIdFromEventParams(event.params.tokenId, event.params.tokenAddress)
        );
    }
}

