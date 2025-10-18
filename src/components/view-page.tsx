import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, ExternalLink, Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { useIsMobile } from '../hooks/use-mobile'
import { createPolaroidFromUrl } from '../utils/polaroid-generator'

interface MemoryData {
    id: string
    title: string
    location: string
    imageUrl: string
}

const ViewPage: React.FC = () => {
    const { transactionId } = useParams<{ transactionId: string }>()
    const navigate = useNavigate()
    const isMobile = useIsMobile()

    const [memoryData, setMemoryData] = useState<MemoryData | null>(null)
    const [polaroidDataUrl, setPolaroidDataUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isGeneratingPolaroid, setIsGeneratingPolaroid] = useState(false)
    const [error, setError] = useState<string | null>(null)

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

            const { dataUrl } = await createPolaroidFromUrl(
                memory.imageUrl,
                memory.title,
                memory.location,
                {
                    maxWidth: isMobile ? 500 : 600,
                    maxHeight: isMobile ? 650 : 750,
                    borderWidth: isMobile ? 18 : 25,
                    textHeight: isMobile ? 70 : 90,
                    fontSize: isMobile ? 15 : 18,
                    format: 'png'
                }
            )

            setPolaroidDataUrl(dataUrl)
        } catch (err) {
            console.error('Error generating polaroid:', err)
            // If polaroid generation fails, we can still show the original image
        } finally {
            setIsGeneratingPolaroid(false)
        }
    }

    const handleBack = () => {
        navigate('/')
    }

    const handleViewOriginal = () => {
        if (memoryData) {
            window.open(`https://arweave.net/${memoryData.id}`, '_blank')
        }
    }

    const handleExploreApp = () => {
        navigate('/')
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                    <p className="text-white/70">Loading memory...</p>
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
                        <h2 className="text-white font-semibold text-lg">Memory Not Found</h2>
                        <p className="text-white/70 text-sm">{error}</p>
                        <Button onClick={handleBack} variant="outline" className="w-full">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
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
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-64 md:h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
            </div>

            {/* Header */}
            <div className="relative z-10 p-4 md:p-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-white" />
                        </div>
                        <h1 className="text-white font-bold text-lg md:text-2xl">
                            Memories
                        </h1>
                    </div>
                    <Button
                        onClick={handleExploreApp}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create Your Own
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-4 py-8">
                <div className="w-full max-w-2xl">
                    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                        <CardContent className="p-6 md:p-8 space-y-6">
                            {/* Header */}
                            <div className="text-center space-y-2">
                                <h1 className="text-white font-bold text-2xl md:text-3xl">
                                    {memoryData.title}
                                </h1>
                                {memoryData.location && (
                                    <p className="text-white/70 text-lg">
                                        📍 {memoryData.location}
                                    </p>
                                )}
                                <p className="text-white/60 text-sm">
                                    Preserved forever on Arweave
                                </p>
                            </div>

                            {/* Polaroid Display */}
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

                            {/* Memory Info */}
                            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                                <div className="text-center">
                                    <p className="text-white/60 text-sm mb-2">
                                        This memory is permanently stored on the Arweave blockchain
                                    </p>
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                        <p className="text-white/60 text-xs mb-1">Transaction ID:</p>
                                        <p className="text-white font-mono text-sm break-all">
                                            {memoryData.id}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <Button
                                    onClick={handleViewOriginal}
                                    variant="outline"
                                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    View Original on Arweave
                                </Button>

                                <div className="text-center pt-4 border-t border-white/10">
                                    <p className="text-white/60 text-sm mb-3">
                                        Want to preserve your own memories forever?
                                    </p>
                                    <Button
                                        onClick={handleExploreApp}
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                                    >
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Start Creating Memories
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default ViewPage
