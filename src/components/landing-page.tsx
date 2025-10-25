import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useApi, useConnection } from '@arweave-wallet-kit/react'
import { Upload } from 'lucide-react'
import { Button } from './ui/button'
import UploadModal, { type UploadData } from './upload-modal'
import imageCompression from 'browser-image-compression';
import { ArconnectSigner, TurboFactory } from '@ardrive/turbo-sdk/web';
import permanentImage from "@/assets/permanent.png"
import { cn } from '@/lib/utils'
import StampPreview from './stamp-preview'


const compressionOptions = {
    maxSizeMB: 0.1, // Hard limit of 100KB
    maxWidthOrHeight: 1200, // Balanced resolution for quality vs size
    useWebWorker: true,
    initialQuality: 0.9, // High quality starting point
    maxIteration: 30, // More iterations to find optimal balance
    fileType: 'image/jpeg', // JPEG for better compression
    alwaysKeepResolution: false, // Allow smart resolution adjustment
    preserveExif: false, // Remove EXIF data to save space
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

export function MemoriesLogo({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
    return <div className={cn("flex items-center gap-4", theme === 'dark' ? 'invert' : '')}>
        <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
            <img src="/logo.svg" alt="Memories" className="w-full h-full" />
        </div>
        <div className="flex flex-col items-start justify-center relative -top-0.5">
            <h1 className="text-white font-instrument text-2xl md:text-4xl leading-none">
                memories
            </h1>
            <span className="text-white text-[10px] mt-0.5 font-montserrat font-light">by arweave</span>
        </div>
    </div>
}

const LandingPage: React.FC = () => {
    const [isUploading, setIsUploading] = useState(false)
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
    const api = useApi()
    const navigate = useNavigate()
    const { connected, connect } = useConnection()
    const prevConnectedRef = useRef(connected)

    // Automatically open upload modal when connection status changes from disconnected to connected
    useEffect(() => {
        if (connected && !prevConnectedRef.current) {
            setIsUploadModalOpen(true)
        }
        prevConnectedRef.current = connected
    }, [connected])

    async function handleImageUpload(file: File, uploadData: UploadData): Promise<string> {
        if (!api) throw new Error('Wallet not initialized not found');

        console.log('originalFile instanceof Blob', file instanceof Blob); // true
        console.log(`originalFile size ${file.size / 1024 / 1024} MB`);

        try {
            let finalFile = file;

            // Only compress if file is larger than 100KB
            if (file.size > 100 * 1024) {
                console.log('File is larger than 100KB, compressing...');
                finalFile = await imageCompression(file, compressionOptions);
                console.log('compressedFile instanceof Blob', finalFile instanceof Blob); // true
                console.log(`compressedFile size ${finalFile.size / 1024} KB`);
            } else {
                console.log('File is under 100KB, uploading as-is');
            }

            const extraTags = [
                { name: "Title", value: uploadData.title },
                { name: "Location", value: uploadData.location },
                { name: "Handle", value: uploadData.handle }
            ]

            const id = await uploadFileTurbo(finalFile, api, extraTags);
            console.log('id', id);
            return id;
        } catch (error) {
            console.log(error);
            return '';
        }
    }


    // Function to validate that the image is accessible on Arweave
    const validateArweaveImage = async (transactionId: string, maxRetries = 10, retryDelay = 3000): Promise<boolean> => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Validating Arweave image (attempt ${attempt}/${maxRetries}): ${transactionId}`)

                const response = await fetch(`https://arweave.net/${transactionId}`, {
                    method: 'HEAD',
                    cache: 'no-cache'
                })

                if (response.ok) {
                    const contentType = response.headers.get('content-type')
                    if (contentType && contentType.startsWith('image/')) {
                        console.log('✅ Image successfully validated on Arweave')
                        return true
                    } else {
                        console.log('❌ Response is not an image, content-type:', contentType)
                    }
                } else {
                    console.log(`❌ HTTP ${response.status}: ${response.statusText}`)
                }
            } catch (error) {
                console.log(`❌ Validation attempt ${attempt} failed:`, error)
            }

            // Wait before retrying (except on the last attempt)
            if (attempt < maxRetries) {
                console.log(`⏳ Waiting ${retryDelay}ms before retry...`)
                await new Promise(resolve => setTimeout(resolve, retryDelay))
            }
        }

        console.log('❌ Failed to validate image after all attempts')
        return false
    }

    const handleModalUpload = async (uploadData: UploadData) => {
        if (!connected) return

        setIsUploading(true)

        try {
            console.log('Upload data:', uploadData)

            // Upload the image to Arweave
            const id = await handleImageUpload(uploadData.file, uploadData)
            console.log('Upload completed, transaction ID:', id);

            if (!id) {
                throw new Error('Upload failed: No transaction ID returned')
            }

            // Validate that the image is accessible on Arweave before navigating
            console.log('🔍 Validating image accessibility on Arweave...')
            const isValid = await validateArweaveImage(id)

            if (isValid) {
                console.log('✅ Image validated successfully, navigating to uploaded page')
                // Close modal before navigating
                setIsUploadModalOpen(false)
                setIsUploading(false)
                navigate(`/uploaded/${id}`)
            } else {
                throw new Error('Image upload completed but failed to validate accessibility on Arweave. Please try again.')
            }
        } catch (error) {
            console.error('Upload failed:', error)
            // You might want to show a user-friendly error message here
            alert(error instanceof Error ? error.message : 'Upload failed. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    const handleUploadClick = () => {
        if (connected) {
            setIsUploadModalOpen(true)
        } else {
            connect()
        }
    }

    const handleExploreGallery = useCallback(() => {
        navigate('/gallery')
    }, [navigate])

    return (
        <div className="min-h-screen bg-black relative overflow-hidden">
            {/* Header */}
            <div className="relative z-10 p-6 md:p-8">
                <MemoriesLogo />
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 px-6 md:px-16 py-8 md:py-16">
                {/* Welcome Section - Always Visible */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[70vh]">
                    {/* Left Content */}
                    <div className="space-y-8">
                        <div className="space-y-6">
                            <h2 className="text-white font-instrument text-4xl md:text-9xl leading-tight">
                                Your memories are rented, let's change that!
                            </h2>
                            <p className="font-montserrat text-white text-lg md:text-xl leading-relaxed max-w-xl">
                                If you could store one memory forever what would it be? Store your first permanent memory for <span className="text-white font-medium">free</span> with Arweave today
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <Button
                                className="bg-[#000DFF] text-white border border-[#2C2C2C] px-6 py-3 text-base font-medium rounded-md flex items-center gap-2"
                                variant="ghost"
                                onClick={handleUploadClick}
                            >
                                <Upload className="w-4 h-4" />
                                Upload Now
                            </Button>
                            <Button
                                variant="link"
                                onClick={handleExploreGallery}
                                className="p-0 m-0 text-muted-foreground font-normal hover:no-underline hover:text-foreground"
                            >
                                or <span className="underline">Explore</span> the Gallery
                            </Button>
                        </div>
                    </div>

                    {/* Right Content - Stamp Preview */}
                    <div className="flex justify-center items-center">
                        <div className="relative w-full max-w-lg">
                            {/* First postcard - back layer */}
                            <div className="absolute transform -rotate-10 -translate-x-20 translate-y-10 opacity-90 hover:opacity-80 transition-all duration-300">
                                <StampPreview
                                    headline="Your first memory"
                                    location="ANYWHERE, EARTH"
                                    handle="@YOU"
                                    date="TODAY"
                                    imageSrc=""
                                    layout="vertical"
                                />
                            </div>

                            {/* Second postcard - front layer */}
                            <div className="relative transform rotate-3 hover:rotate-0 transition-transform duration-300">
                                <StampPreview
                                    headline="Your first memory"
                                    location="ANYWHERE, EARTH"
                                    handle="@YOU"
                                    date="TODAY"
                                    imageSrc=""
                                    layout="vertical"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 px-6 md:px-16 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs md:text-sm">
                    <div className="flex w-1/2 justify-between">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-white/60">
                            <span>Learn more about</span>
                            <a href="https://arweave.org" target="_blank" rel="noopener noreferrer" className="text-muted-foreground underline underline-offset-4 hover:text-white/80 transition-colors">
                                Arweave
                            </a>
                            <span>and the</span>
                            <a href="https://permaweb.org" target="_blank" rel="noopener noreferrer" className="text-muted-foreground underline underline-offset-4 hover:text-white/80 transition-colors">
                                Permaweb
                            </a>
                        </div>

                        <span className="text-white/60 text-center">© 2025 Memories by Arweave. All rights reserved.</span>
                    </div>
                    <img src={permanentImage} alt="Permanent" className="h-14" draggable={false} />
                </div>
            </div>

            {/* Upload Modal */}
            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleModalUpload}
            />
        </div>
    )
}
export default LandingPage;

