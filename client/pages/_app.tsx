import "@/styles/globals.css"
import "@rainbow-me/rainbowkit/styles.css"
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { configureChains, createConfig, WagmiConfig } from "wagmi"
import { arbitrum, goerli, localhost, hardhat, mainnet, optimism, polygon } from "wagmi/chains"
import { publicProvider } from "wagmi/providers/public"

import { useEffect, useState } from "react"
import { ThemeProvider } from "next-themes"
import type { AppProps } from "next/app"

const { chains, publicClient, webSocketPublicClient } = configureChains(
    [
        mainnet,
        polygon,
        optimism,
        arbitrum,
        hardhat,
        localhost,
        ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === "true" ? [goerli] : []),
    ],
    [publicProvider()]
)

const { connectors } = getDefaultWallets({
    appName: "RainbowKit App",
    projectId: "YOUR_PROJECT_ID",
    chains,
})

const wagmiConfig = createConfig({
    autoConnect: true,
    connectors,
    publicClient,
    webSocketPublicClient,
})

function MyApp({ Component, pageProps }: AppProps) {
    const [ready, setReady] = useState(false)   // hack to fix hydration error
    useEffect(() => {
        setReady(true)
    }, [])
    return (
        <>
            {" "}
            {ready ? (
                <WagmiConfig config={wagmiConfig}>
                    <RainbowKitProvider chains={chains} coolMode>
                        <ThemeProvider attribute="class">
                            <Component {...pageProps} />
                        </ThemeProvider>
                    </RainbowKitProvider>
                </WagmiConfig>
            ) : null}
        </>
    )
}

export default MyApp
