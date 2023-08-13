# Project: ZK Whisper ETH Super Hack (13Aug)

## Philosophy

Current wallet recovery mechanisms always come with a big trade-off. Either you rely 100% on yourself (push the responsibility to the user), or you sacrifice sovereignty by trusting your private key to some centralized entity.

With this project I present Zero Knowledge based Sovereign Social Recovery wallet, a non-custodial recovery mechanism that tries to bring the best of both worlds.

I believe we are at a point where we need to stop pushing responsibilities onto users and instead create systems that feel invisible while maintaining the core values that we care about.


## Prerequisites

- Fiat Shamir Secret Sharing (k,n):
  - Secret Sharing divides a secret data 𝑆 into 𝑛 shares 𝑠1, · · · , 𝑠𝑛 such that any 𝑘 or more shares can be used to derive the original secret 𝑆 while 𝑘 − 1 or fewer shares reveal no information about the secret 𝑆. This is referred to as a (𝑘, 𝑛) threshold scheme.
- Secret Reconstruction by evaluating Lagrange Basis interpolated polynomial at x = 0
- Merkle Tree:
  - Tree #1: zk-identity proof for registered user (required for recovery setup)
  - Tree #2: guardians proof of inclusion: per user per recovery setup
- Verifiable Computation (Circom+Groth16):
  - Prove in a zero-knowledge way that the user is valid and secret recovery has been correctly computed without revealing any secret.

## Demo (Walkthrough) Password

### Sign Up

1. Wallet creation: users can create a new wallet or onboard an existing one with the ZKWhisper contract.
2. Signup returns a zk-identity proof for the user. Wallet's private keys are always kept off-chain and never revealed. All the circom circuits are run on the client side, never revealing any secrets of the calculation.
3. Users download this identity proof.

### Login

- Users need to submit their identity proof to log in.
- Only logged-in users can start a recovery setup.

### ZK-Social Recovery Setup

- Since most wallet apps allow wallet importing with either a private key or mnemonic phrase, users can opt out to use any of these in the recovery setup.
- Users select the number of guardians (N) and quorum (K) as the minimum number of threshold shares required to recover the wallet.
- The key here is the disconnection between guardians. The whole idea is built on the assumption that guardians are not aware of each other, and only the user can reach out to K guardians to be able to create the secret key.
- We also add a proof of inclusion in each share: that is the merkle root and merkle tree path, which will come in handy for validating them later.
- We distribute these shares to guardians offline and can delete the secret without any worries. Nothing else is required.

### Recovery

- Users collect K number of proofs from their guardians.
- These shares could be tampered with or simply invalid/malicious.
- So first we do validation of each share. For this, we check if all of them contain the same values of the merkle root (inclusion proof), and each of them the tree path can construct the same merkle tree. If not, we can exit early and tell the users to collect from some other guardians.
- Then the user tries to compute (in-browser) the recovery string in a verifiable way using the circuits and sends the resulting witnesses to the smart contract for verification.
- If all goes through, the user is able to recover their secret.

## Demo

## Future Scope

- Improve UX
- Introduce recovery notifications, delays
- Turn into: ZK wallet as a service for all the wallets out there