import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useActiveAddress, useApi, useConnection, useProfileModal } from '@arweave-wallet-kit/react'
import { ConnectButton } from '@arweave-wallet-kit/react'
import { Upload, Image as ImageIcon, FileText, MapPin, Sparkles, ArrowRight, LogOut } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { useIsMobile } from '../hooks/use-mobile'
import { useDebounce } from '../hooks/use-debounce'
import { type UploadData } from './upload-modal'
import ShareModal from './share-modal'
import { createPolaroidImage } from '../utils/polaroid-generator'
import imageCompression from 'browser-image-compression';
import { ArconnectSigner, ArweaveSigner, TurboFactory } from '@ardrive/turbo-sdk/web';


const options = {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
}

export async function uploadFileTurbo(file: File, api: any, tags: { name: string, value: string }[] = []) {
    const signer = new ArconnectSigner(api)
    console.log('signer', signer);

    const turbo = TurboFactory.authenticated({ signer })
    const res = await turbo.uploadFile({
        fileStreamFactory: () => file.stream(),
        fileSizeFactory: () => file.size,
        dataItemOpts: {
            tags: [
                { name: "App-Name", value: "Memories-App" },
                { name: "App-Version", value: "1.0.1" },
                { name: "Content-Type", value: file.type ?? "application/octet-stream" },
                { name: "Name", value: file.name ?? "unknown" },
                ...tags
            ],
        }
    })
    return res.id;
}

const LandingPage: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [polaroidFile, setPolaroidFile] = useState<File | null>(null)
    const [polaroidPreviewUrl, setPolaroidPreviewUrl] = useState<string | null>(null)
    const [isGeneratingPolaroid, setIsGeneratingPolaroid] = useState(false)
    const [title, setTitle] = useState('')
    const [location, setLocation] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [uploadedImageId, setUploadedImageId] = useState<string>('')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const isMobile = useIsMobile()
    const api = useApi()
    const navigate = useNavigate()
    const address = useActiveAddress()
    const { connected, connect, disconnect } = useConnection()
    const { setOpen } = useProfileModal()

    // Debounce title and location for polaroid regeneration
    const debouncedTitle = useDebounce(title, 500)
    const debouncedLocation = useDebounce(location, 500)

    // Regenerate polaroid when debounced title or location changes
    useEffect(() => {
        if (selectedFile && (debouncedTitle || debouncedLocation) && !isGeneratingPolaroid) {
            generatePolaroid(selectedFile, debouncedTitle, debouncedLocation)
        }
    }, [debouncedTitle, debouncedLocation, selectedFile])

    const generatePolaroid = async (file: File, currentTitle?: string, currentLocation?: string) => {
        setIsGeneratingPolaroid(true)
        try {
            const { blob, dataUrl } = await createPolaroidImage(file, {
                maxWidth: isMobile ? 400 : 600,
                maxHeight: isMobile ? 600 : 800,
                borderWidth: isMobile ? 15 : 20,
                textHeight: isMobile ? 60 : 80,
                fontSize: isMobile ? 14 : 16,
                isMobile,
                title: currentTitle?.trim() || title.trim(),
                location: currentLocation?.trim() || location.trim()
            })

            // Create a File object from the blob
            const polaroidFileName = file.name.replace(/\.[^/.]+$/, '_polaroid.png')
            const polaroidFileObj = new File([blob], polaroidFileName, {
                type: 'image/png',
                lastModified: Date.now()
            })

            setPolaroidFile(polaroidFileObj)
            setPolaroidPreviewUrl(dataUrl)
        } catch (error) {
            console.error('Failed to generate polaroid:', error)
        } finally {
            setIsGeneratingPolaroid(false)
        }
    }

    async function handleImageUpload(file: File, uploadData: UploadData): Promise<string> {
        if (!api) throw new Error('Wallet not initialized not found');
        // Use polaroid file if available, otherwise use original file
        const imageFile = polaroidFile || file;
        console.log('originalFile instanceof Blob', imageFile instanceof Blob); // true
        console.log(`originalFile size ${imageFile.size / 1024 / 1024} MB`);

        try {
            const compressedFile = await imageCompression(imageFile, options);
            console.log('compressedFile instanceof Blob', compressedFile instanceof Blob); // true
            console.log(`compressedFile size ${compressedFile.size / 1024 / 1024} MB`); // smaller than maxSizeMB
            const extraTags = [
                { name: "Title", value: uploadData.title },
                { name: "Location", value: uploadData.location },
            ]

            const id = await uploadFileTurbo(compressedFile, api, extraTags); // write your own logic
            console.log('id', id);
            return id;
        } catch (error) {
            console.log(error);
            return '';
        }

    }


    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file)
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
            // Generate polaroid version
            generatePolaroid(file)
        }
    }

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault()
    }

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault()
        const file = event.dataTransfer.files[0]
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file)
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
            // Generate polaroid version
            generatePolaroid(file)
        }
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!selectedFile || !title.trim() || !connected) return

        setIsUploading(true)

        try {
            const uploadData: UploadData = {
                file: selectedFile,
                title: title.trim(),
                location: location.trim()
            }

            // TODO: Implement actual upload logic here
            console.log('Upload data:', uploadData)

            // Simulate upload delay
            // await new Promise(resolve => setTimeout(resolve, 2000))
            const id = await handleImageUpload(selectedFile, uploadData)
            console.log('id', id);

            // Store the uploaded image ID and show share modal
            setUploadedImageId(id)
            setIsShareModalOpen(true)
        } catch (error) {
            console.error('Upload failed:', error)
        } finally {
            setIsUploading(false)
        }
    }

    const handleExploreGallery = useCallback(() => {
        navigate('/gallery')
    }, [navigate])

    const handleShareModalClose = useCallback(() => {
        setIsShareModalOpen(false)
        setUploadedImageId('')
    }, [])

    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle)
    }

    const handleLocationChange = (newLocation: string) => {
        setLocation(newLocation)
    }

    const handleContinueToGallery = useCallback(() => {
        setIsShareModalOpen(false)
        setUploadedImageId('')
        // Reset form
        setSelectedFile(null)
        setPreviewUrl(null)
        setPolaroidFile(null)
        setPolaroidPreviewUrl(null)
        setTitle('')
        setLocation('')
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
        }
        if (polaroidPreviewUrl) {
            URL.revokeObjectURL(polaroidPreviewUrl)
        }
        navigate('/gallery')
    }, [navigate, previewUrl, polaroidPreviewUrl])

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute top-10 left-10 w-32 h-32 md:top-20 md:left-20 md:w-72 md:h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-10 right-10 w-40 h-40 md:bottom-20 md:right-20 md:w-96 md:h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-64 md:h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
            </div>

            {/* Header */}
            <div className="relative z-10 p-4 md:p-8">
                <div className="flex justify-center items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-white" />
                        </div>
                        <h1 className="text-white font-bold text-lg md:text-2xl">
                            Memories
                        </h1>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-4 py-8 md:px-8 md:py-16">
                <div className="w-full max-w-md md:max-w-4xl">
                    {!connected ? (
                        /* Welcome Section - Not Connected */
                        <div className="text-center space-y-6 md:space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-white font-bold text-4xl md:text-5xl leading-tight text-center">
                                    Preserve Your
                                    <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Memories </span>
                                    Forever
                                </h2>
                                <p className="text-white/70 text-sm md:text-xl max-w-2xl mx-auto leading-relaxed px-4">
                                    Upload and store your precious memories on the Arweave blockchain.
                                    Your photos will be preserved permanently and accessible from anywhere in the world.
                                </p>
                            </div>

                            <div className="flex flex-col items-center gap-4 md:gap-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-purple-500/30 blur-lg rounded-full animate-pulse"></div>
                                    <Button className="cursor-pointer relative px-8 py-3 text-base font-medium" onClick={() => connect()}>
                                        Login
                                    </Button>
                                </div>
                                <p className="text-white/60 text-xs md:text-sm">
                                    Connect your wallet to start uploading memories
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* Upload Section - Connected */
                        <div className="flex flex-col items-center space-y-6 md:space-y-8">
                            {/* Welcome Message */}
                            <div className="text-center space-y-4 w-full">
                                <h2 className="text-white font-bold text-xl md:text-4xl leading-tight">
                                    Welcome!
                                </h2>
                                <p className="text-white/70 text-sm md:text-lg leading-relaxed max-w-2xl mx-auto px-4">
                                    Ready to add a new memory to your collection? Upload your image and share the story behind it.
                                </p>

                                <div className="flex items-center justify-center gap-3 p-3 md:p-4 bg-white/5 rounded-lg border border-white/10 max-w-xs mx-auto">
                                    <div className="w-6 h-6 md:w-8 md:h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full"></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium text-xs md:text-sm">Connected</p>
                                        <p className="text-white/60 text-xs truncate">
                                            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Wallet connected'}
                                        </p>
                                    </div>
                                    <Button size="icon" variant="ghost" className="w-8 h-8 md:w-10 md:h-10" onClick={() => setOpen(true)}>
                                        <LogOut className="w-3 h-3 md:w-4 md:h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Upload Form */}
                            <Card className="bg-white/5 border-white/10 backdrop-blur-sm w-full max-w-lg mx-auto">
                                <CardHeader className="text-center pb-4">
                                    <CardTitle className="text-white text-lg md:text-xl">Upload a Memory</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 md:space-y-6">
                                    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                                        {/* File Upload Area */}
                                        <div className="space-y-2">
                                            <Label htmlFor="file-upload" className="text-white font-medium text-sm">
                                                Image
                                            </Label>
                                            <div
                                                className={`border-2 border-dashed border-white/20 rounded-lg p-6 md:p-8 text-center hover:border-white/40 transition-colors cursor-pointer ${selectedFile ? 'bg-white/5' : 'bg-white/5'}`}
                                                onDragOver={handleDragOver}
                                                onDrop={handleDrop}
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                {polaroidPreviewUrl || previewUrl ? (
                                                    <div className="space-y-3">
                                                        {isGeneratingPolaroid ? (
                                                            <div className="space-y-3">
                                                                <div className="w-32 h-40 md:w-40 md:h-50 mx-auto bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                                                                    <div className="text-center space-y-3">
                                                                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                                                                        <p className="text-white/70 text-xs">
                                                                            Creating polaroid...
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="relative mx-auto w-fit">
                                                                    {polaroidPreviewUrl && (
                                                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg blur-xl -z-10 scale-110"></div>
                                                                    )}
                                                                    <img
                                                                        src={polaroidPreviewUrl || previewUrl}
                                                                        alt="Preview"
                                                                        className="max-h-48 md:max-h-64 max-w-[280px] md:max-w-[350px] mx-auto rounded-lg object-contain shadow-2xl border border-white/20 relative z-10"
                                                                    />
                                                                    {polaroidPreviewUrl && (
                                                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg z-20">
                                                                            <span className="text-xs">✨</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <p className="text-white/70 text-xs md:text-sm mt-3">
                                                                    Click to change image
                                                                </p>
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="w-10 h-10 md:w-12 md:h-12 mx-auto rounded-full bg-white/10 flex items-center justify-center">
                                                            <Upload className="w-5 h-5 md:w-6 md:h-6 text-white/70" />
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium mb-1 text-xs md:text-sm">
                                                                Drop your image here
                                                            </p>
                                                            <p className="text-white/60 text-xs">
                                                                or click to browse
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                    id="file-upload"
                                                />
                                            </div>
                                        </div>

                                        {/* Title Input */}
                                        <div className="space-y-2">
                                            <Label htmlFor="title" className="text-white font-medium flex items-center gap-2 text-sm">
                                                <ImageIcon className="w-3 h-3 md:w-4 md:h-4" />
                                                Title *
                                            </Label>
                                            <Input
                                                id="title"
                                                type="text"
                                                placeholder="Give your memory a title..."
                                                value={title}
                                                onChange={(e) => handleTitleChange(e.target.value)}
                                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 text-sm"
                                                required
                                            />
                                        </div>

                                        {/* Location Input */}
                                        <div className="space-y-2">
                                            <Label htmlFor="location" className="text-white font-medium flex items-center gap-2 text-sm">
                                                <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                                                Location *
                                            </Label>
                                            <Input
                                                id="location"
                                                type="text"
                                                placeholder="Where was this captured?"
                                                value={location}
                                                onChange={(e) => handleLocationChange(e.target.value)}
                                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 text-sm"
                                                required
                                            />
                                        </div>

                                        {/* Submit Button */}
                                        <Button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 h-10 md:h-12 text-sm md:text-base"
                                            disabled={!selectedFile || !title.trim() || !location.trim() || isUploading || isGeneratingPolaroid}
                                        >
                                            {isUploading ? (
                                                <>
                                                    <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                                                    Upload
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {/* Share Modal */}
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={handleShareModalClose}
                imageId={uploadedImageId}
                imageUrl={polaroidPreviewUrl || previewUrl || undefined}
                imageTitle={title}
                onContinue={handleContinueToGallery}
            />
        </div>
    )
}

export default LandingPage
