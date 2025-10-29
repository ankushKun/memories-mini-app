import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ImageIcon } from 'lucide-react'
import { Button } from './ui/button'
import { useIsMobile } from '../hooks/use-mobile'
import CopySharePopup from './copy-share-popup'
import { MemoriesLogo } from './landing-page'
import StampPreview from './stamp-preview'
import { domToBlob } from 'modern-screenshot'

interface MemoryData {
    id: string
    title: string
    location: string
    handle: string
    imageUrl: string
}

const UploadedPage: React.FC = () => {
    const { transactionId } = useParams<{ transactionId: string }>()
    const navigate = useNavigate()
    const isMobile = useIsMobile()

    const [memoryData, setMemoryData] = useState<MemoryData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isSharePopupOpen, setIsSharePopupOpen] = useState(false)
    const [isCapturing, setIsCapturing] = useState(false)
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
    const stampPreviewRef = useRef<HTMLDivElement>(null)
    const hiddenHorizontalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!transactionId) {
            setError('No transaction ID provided')
            setIsLoading(false)
            return
        }

        loadMemoryData()
    }, [transactionId])

    const loadMemoryData = async () => {
        if (!transactionId) return

        try {
            setIsLoading(true)
            setError(null)

            // Fetch transaction metadata from Arweave
            const response = await fetch(`https://arweave.net/graphql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: `
                        query GetTransaction($id: ID!) {
                            transaction(id: $id) {
                                id
                                tags {
                                    name
                                    value
                                }
                            }
                        }
                    `,
                    variables: { id: transactionId }
                })
            })

            const data = await response.json()
            const transaction = data.data?.transaction

            if (!transaction) {
                throw new Error('Transaction not found')
            }

            // Parse tags
            const tags = transaction.tags.reduce((acc: Record<string, string>, tag: { name: string, value: string }) => {
                acc[tag.name] = tag.value
                return acc
            }, {})

            // Check if it's a valid memory (has our app tags)
            if (tags['App-Name'] !== 'Memories-App') {
                throw new Error('This transaction is not a memory from our app')
            }

            const memory: MemoryData = {
                id: transaction.id,
                title: tags.Title || 'Untitled Memory',
                location: tags.Location || '',
                handle: tags.Handle || '',
                imageUrl: `https://arweave.net/${transaction.id}`
            }

            setMemoryData(memory)
        } catch (err) {
            console.error('Error loading memory:', err)
            setError(err instanceof Error ? err.message : 'Failed to load memory')
        } finally {
            setIsLoading(false)
        }
    }

    const captureStampAsImage = async (): Promise<Blob | null> => {
        // Always capture the horizontal version
        if (!hiddenHorizontalRef.current) return null

        try {
            setIsCapturing(true)

            // Temporarily make the horizontal version visible
            const element = hiddenHorizontalRef.current
            const originalVisibility = element.style.visibility
            const originalOpacity = element.style.opacity

            element.style.visibility = 'visible'
            element.style.opacity = '1'
            element.style.position = 'absolute'
            element.style.left = '0'
            element.style.top = '0'
            element.style.zIndex = '9999'

            // Wait for images to fully render
            await new Promise(resolve => setTimeout(resolve, 200))

            // Capture the horizontal stamp preview element as a blob
            const blob = await domToBlob(element, {
                scale: 2, // Higher quality (2x resolution)
                quality: 1, // Maximum quality
                type: 'image/png'
            })

            // Hide it again
            element.style.visibility = originalVisibility
            element.style.opacity = originalOpacity
            element.style.zIndex = ''

            return blob
        } catch (error) {
            console.error('Error capturing stamp:', error)
            // Make sure to hide it even if there's an error
            if (hiddenHorizontalRef.current) {
                const element = hiddenHorizontalRef.current
                element.style.visibility = 'hidden'
                element.style.opacity = '0'
                element.style.zIndex = ''
            }
            return null
        } finally {
            setIsCapturing(false)
        }
    }

    const handleShare = async () => {
        const blob = await captureStampAsImage()
        if (blob) {
            setCapturedBlob(blob)
        }
        setIsSharePopupOpen(true)
    }

    const handleSharePopupClose = () => {
        setIsSharePopupOpen(false)
    }

    const getTweetText = () => {
        if (!memoryData) return ''
        return `Check out this memory "${memoryData.title}" preserved forever on Arweave! 🌟\n\nView it at: ${window.location.origin}/#/view/${memoryData.id}\n\n#PermanentOnArweave`
    }

    const handleGallery = () => {
        navigate('/gallery')
    }

    const handleTelegramShare = () => {
        if (!memoryData) return

        const url = `${window.location.origin}/#/view/${memoryData.id}`
        const text = `Check out this memory "${memoryData.title}" preserved forever on Arweave! 🌟`
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`

        window.open(telegramUrl, '_blank')
    }

    const handleWhatsAppShare = () => {
        if (!memoryData) return

        const url = `${window.location.origin}/#/view/${memoryData.id}`
        const text = `Check out this memory "${memoryData.title}" preserved forever on Arweave! 🌟\n\nView it at: ${url}\n\n#PermanentOnArweave`
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`

        window.open(whatsappUrl, '_blank')
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                    <p className="text-white/70">Loading your memory...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <div className="text-red-400 text-xl">⚠️</div>
                    <h2 className="text-white font-semibold text-lg">Error Loading Memory</h2>
                    <p className="text-white/70 text-sm">{error}</p>
                    <Button onClick={handleGallery} className="bg-[#000DFF] text-white">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Go to Gallery
                    </Button>
                </div>
            </div>
        )
    }

    if (!memoryData) return null

    return (
        <div className="min-h-screen bg-black relative overflow-hidden">
            {/* Header */}
            <div className="relative z-10 p-6 md:p-8">
                <MemoriesLogo />
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-6 py-8 gap-8">
                {/* Visible Stamp Preview - vertical on mobile, horizontal on desktop */}
                <div ref={stampPreviewRef}>
                    <StampPreview
                        headline={memoryData.title}
                        location={memoryData.location}
                        handle={memoryData.handle}
                        date={new Date().toLocaleDateString()}
                        imageSrc={memoryData.imageUrl}
                        layout={isMobile ? "vertical" : "horizontal"}
                    />
                </div>

                {/* Hidden horizontal version for capturing - always horizontal */}
                <div
                    ref={hiddenHorizontalRef}
                    className="absolute left-0 top-0 opacity-0 pointer-events-none"
                    style={{ visibility: 'hidden' }}
                >
                    <StampPreview
                        headline={memoryData.title}
                        location={memoryData.location}
                        handle={memoryData.handle}
                        date={new Date().toLocaleDateString()}
                        imageSrc={memoryData.imageUrl}
                        layout="horizontal"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col items-center gap-4 w-full max-w-md">
                    <Button
                        onClick={handleShare}
                        disabled={isCapturing}
                        className="w-full bg-[#000DFF] text-white border border-[#2C2C2C] px-6 py-3 text-base font-medium rounded-md flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isCapturing ? 'Capturing...' : 'Share'}
                    </Button>

                    {/* Social Share Buttons */}
                    {/* <div className="grid grid-cols-2 gap-3 w-full">
                        <Button
                            onClick={handleTelegramShare}
                            variant="outline"
                            className="bg-[#0088cc]/10 border-[#0088cc]/30 text-white hover:bg-[#0088cc]/20 px-4 py-3 text-sm font-medium rounded-md flex items-center justify-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            Telegram
                        </Button>
                        <Button
                            onClick={handleWhatsAppShare}
                            variant="outline"
                            className="bg-[#25D366]/10 border-[#25D366]/30 text-white hover:bg-[#25D366]/20 px-4 py-3 text-sm font-medium rounded-md flex items-center justify-center gap-2"
                        >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                        </Button>
                    </div> */}

                    <Button
                        onClick={handleGallery}
                        variant="outline"
                        className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 px-6 py-3 text-base font-medium rounded-md flex items-center justify-center gap-2"
                    >
                        Gallery
                    </Button>
                </div>
            </div>

            {/* Copy & Share Popup */}
            <CopySharePopup
                shareUrl={`${window.location.origin}/#/view/${memoryData?.id}`}
                isOpen={isSharePopupOpen}
                onClose={handleSharePopupClose}
                polaroidBlob={capturedBlob}
                tweetText={getTweetText()}
                onTwitterOpen={handleSharePopupClose}
            />
        </div>
    )
}

export default UploadedPage
