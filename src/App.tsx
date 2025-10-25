import LandingPage from "@/components/landing-page"
import { useActiveAddress, useApi, useConnection } from "@arweave-wallet-kit/react"
import { fixConnection } from "@wauth/strategy"
import { useEffect } from "react"

export default function App() {
  const address = useActiveAddress()
  const api = useApi()
  const { connected, disconnect } = useConnection()

  useEffect(() => {
    if (!api) return
    if (api.id == "wauth-twitter") {
      const username = api.authData?.username
      if (!username) {
        console.log("No username found, disconnecting")
        disconnect()
      }
    }
  }, [api, connected, address])

  useEffect(() => fixConnection(address, connected, disconnect), [address, connected, disconnect])

  return <LandingPage />
}