import LandingPage from "@/components/landing-page"
import { useActiveAddress, useConnection } from "@arweave-wallet-kit/react"
import { fixConnection } from "@wauth/strategy"
import { useEffect } from "react"

export default function App() {
  const address = useActiveAddress()
  const { connected, disconnect } = useConnection()

  useEffect(() => fixConnection(address, connected, disconnect), [address, connected, disconnect])

  return <LandingPage />
}