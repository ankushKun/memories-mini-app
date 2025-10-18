import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Twitter, ExternalLink } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { useIsMobile } from '../hooks/use-mobile'
import { createPolaroidFromUrl } from '../utils/polaroid-generator'
import CopySharePopup from './copy-share-popup'

interface MemoryData {
    id: string
    title: string
    location: string
    imageUrl: string
}

const UploadedPage: React.FC = () => {
    const { transactionId } = useParams<{ transactionId: string }>()
    const navigate = useNavigate()
    const isMobile = useIsMobile()

    const [memoryData, setMemoryData] = useState<MemoryData | null>(null)
    const [polaroidDataUrl, setPolaroidDataUrl] = useState<string | null>(null)
    const [polaroidBlob, setPolaroidBlob] = useState<Blob | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isGeneratingPolaroid, setIsGeneratingPolaroid] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSharePopupOpen, setIsSharePopupOpen] = useState(false)

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
                imageUrl: `https://arweave.net/${transaction.id}`
            }

            setMemoryData(memory)

            // Generate polaroid version
            generatePolaroid(memory)
        } catch (err) {
            console.error('Error loading memory:', err)
            setError(err instanceof Error ? err.message : 'Failed to load memory')
        } finally {
            setIsLoading(false)
        }
    }

    const generatePolaroid = async (memory: MemoryData) => {
        try {
            setIsGeneratingPolaroid(true)

            const { blob, dataUrl } = await createPolaroidFromUrl(
                memory.imageUrl,
                memory.title,
                memory.location,
                {
                    maxWidth: isMobile ? 500 : 600,
                    maxHeight: isMobile ? 650 : 750,
                    borderWidth: isMobile ? 18 : 25,
                    textHeight: isMobile ? 70 : 90,
                    fontSize: isMobile ? 15 : 18,
                    format: 'png' // Use PNG for better clipboard compatibility
                }
            )

            setPolaroidDataUrl(dataUrl)
            setPolaroidBlob(blob)
        } catch (err) {
            console.error('Error generating polaroid:', err)
            // If polaroid generation fails, we can still show the original image
        } finally {
            setIsGeneratingPolaroid(false)
        }
    }

    const handleCopyAndShare = () => {
        setIsSharePopupOpen(true)
    }

    const handleSharePopupClose = () => {
        setIsSharePopupOpen(false)
    }

    const getTweetText = () => {
        if (!memoryData) return ''
        return `Just preserved my memory "${memoryData.title}" forever on Arweave! 🌟\n\nView it at: ${window.location.origin}/#/view/${memoryData.id}\n\n#PermanentOnArweave`
    }

    const openTwitterDirectly = () => {
        if (!memoryData) return

        const tweetText = getTweetText()
        const encodedText = encodeURIComponent(tweetText)
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`

        window.open(twitterUrl, '_blank', 'noopener,noreferrer')
    }

    const handleBack = () => {
        navigate('/gallery')
    }

    const handleViewPublic = () => {
        if (memoryData) {
            window.open(`/#/view/${memoryData.id}`, '_blank')
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                    <p className="text-white/70">Loading your memory...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
                <Card className="bg-red-900/20 border-red-500/30 max-w-md w-full">
                    <CardContent className="p-6 text-center space-y-4">
                        <div className="text-red-400 text-xl">⚠️</div>
                        <h2 className="text-white font-semibold text-lg">Error Loading Memory</h2>
                        <p className="text-white/70 text-sm">{error}</p>
                        <Button onClick={handleBack} variant="outline" className="w-full">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Gallery
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!memoryData) return null

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
            {/* Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute top-10 left-10 w-32 h-32 md:top-20 md:left-20 md:w-72 md:h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-10 right-10 w-40 h-40 md:bottom-20 md:right-20 md:w-96 md:h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            {/* Header */}
            <div className="relative z-10 p-4 md:p-8">
                <div className="flex items-center justify-between">
                    <Button
                        onClick={handleBack}
                        variant="ghost"
                        className="text-white hover:bg-white/10"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Gallery
                    </Button>
                    <Button
                        onClick={handleViewPublic}
                        variant="ghost"
                        className="text-white hover:bg-white/10"
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Public View
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-4 py-8">
                <div className="w-full max-w-2xl">
                    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                        <CardContent className="p-6 md:p-8 space-y-6">
                            {/* Success Header */}
                            <div className="text-center space-y-2">
                                <div className="text-4xl">🎉</div>
                                <h1 className="text-white font-bold text-2xl md:text-3xl">
                                    Memory Uploaded Successfully!
                                </h1>
                                <p className="text-white/70">
                                    Your memory is now preserved forever on Arweave
                                </p>
                            </div>

                            {/* Polaroid Preview */}
                            <div className="text-center space-y-4">
                                {isGeneratingPolaroid ? (
                                    <div className="space-y-4">
                                        <div className="w-64 h-80 mx-auto bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                                            <div className="text-center space-y-3">
                                                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                                                <p className="text-white/70 text-sm">
                                                    Creating polaroid...
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : polaroidDataUrl ? (
                                    <div className="relative mx-auto w-fit">
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg blur-xl -z-10 scale-110"></div>
                                        <img
                                            src={polaroidDataUrl}
                                            alt={memoryData.title}
                                            className="max-w-full h-auto rounded-lg shadow-2xl border border-white/20"
                                            style={{ maxHeight: isMobile ? '400px' : '500px' }}
                                        />
                                    </div>
                                ) : (
                                    <div className="relative mx-auto w-fit">
                                        <img
                                            src={memoryData.imageUrl}
                                            alt={memoryData.title}
                                            className="max-w-full h-auto rounded-lg shadow-2xl border border-white/20"
                                            style={{ maxHeight: isMobile ? '300px' : '400px' }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Memory Details */}
                            <div className="space-y-3">
                                <div className="text-center">
                                    <h2 className="text-white font-semibold text-xl mb-1">
                                        {memoryData.title}
                                    </h2>
                                    {memoryData.location && (
                                        <p className="text-white/70">
                                            📍 {memoryData.location}
                                        </p>
                                    )}
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                    <p className="text-white/60 text-xs mb-1">Transaction ID:</p>
                                    <p className="text-white font-mono text-sm break-all">
                                        {memoryData.id}
                                    </p>
                                </div>
                            </div>

                            {/* Share Actions */}
                            <div className="space-y-3">
                                <p className="text-white/80 text-center">
                                    Share your memory with the world!
                                </p>

                                {/* Copy & Twitter Share Button */}
                                <Button
                                    onClick={handleCopyAndShare}
                                    disabled={!polaroidBlob}
                                    className="w-full bg-black hover:bg-gray-900 text-white border border-white/20 h-12 text-base font-medium"
                                >
                                    <Twitter className="w-5 h-5 mr-2" />
                                    Copy Polaroid & Share on X
                                </Button>

                                {/* Manual Twitter Share (fallback) */}
                                <Button
                                    onClick={openTwitterDirectly}
                                    variant="outline"
                                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                                >
                                    <Twitter className="w-4 h-4 mr-2" />
                                    Share Link on X
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Copy & Share Popup */}
            <CopySharePopup
                isOpen={isSharePopupOpen}
                onClose={handleSharePopupClose}
                polaroidBlob={polaroidBlob}
                tweetText={getTweetText()}
                onTwitterOpen={handleSharePopupClose}
            />
        </div>
    )
}

export default UploadedPage
