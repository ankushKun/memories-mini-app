import React, { useState, useRef, useEffect, useMemo } from 'react'
import { ArrowRight, Upload, Image as ImageIcon, ArrowLeft, Check, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useIsMobile } from '../hooks/use-mobile'
import { MemoriesLogo } from './landing-page'
import StampPreview from './stamp-preview'
import { cn } from '@/lib/utils'
import postcardV from '@/assets/postcard-v.svg'
import postcardH from '@/assets/postcard-h.svg'
import { Toggle } from './ui/toggle'
import { Switch } from './ui/switch'
import { Checkbox } from './ui/checkbox'
import { QuickWallet } from 'quick-wallet'
import convertHEIC from 'heic-convert/browser'
import ExifReader from 'exifreader'

interface UploadModalProps {
    isOpen: boolean
    onClose: () => void
    onUpload?: (data: UploadData) => void
    initialFile?: File | null
}

export interface UploadData {
    file: File
    title: string
    location: string
    handle: string
    isPublic: boolean
    datetime?: string
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload, initialFile }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [title, setTitle] = useState('')
    const [location, setLocation] = useState('')
    const [handle, setHandle] = useState('')
    const [datetime, setDatetime] = useState('')
    const [isPublic, setIsPublic] = useState(true)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [mobileStep, setMobileStep] = useState<1 | 2>(1) // 1: input details, 2: preview & upload
    const fileInputRef = useRef<HTMLInputElement>(null)
    const isMobile = useIsMobile()
    // Force vertical orientation on mobile
    const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('vertical')
    // const address = useActiveAddress()
    // const api = useApi()
    // const { setOpen } = useProfileModal()
    const address = QuickWallet.getActiveAddress()
    const api = QuickWallet

    const handleNewFile = useMemo(() => {
        return async (file: File) => {
            if (!file.type.startsWith('image/')) return;

            // reset previous metadata
            setDatetime('');
            setLocation('');

            setIsProcessing(true);

            try {
                // extract Exif metadata
                const tags = await ExifReader.load(file);
                const imageDate = tags['DateTimeOriginal']?.description;
                const imageLongitude = tags['GPSLongitude']?.description;
                const imageLatitude = tags['GPSLatitude']?.description;

                // set datetime if available
                if (imageDate) {
                    // datetime can be provided in format "YYYY:MM:DD HH:MM:SS", convert to "YYYY-MM-DD HH:MM:SS"
                    const formattedDate = imageDate.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
                    // make sure it's a valid date & convert to ISO format
                    if (!isNaN(Date.parse(formattedDate))) {
                        const dateTimeISO = new Date(formattedDate).toISOString();
                        setDatetime(dateTimeISO);
                    }
                }

                // reverse geocode to get location name if GPS data is available
                if (imageLongitude && imageLatitude) {
                    const url = `https://nominatim.openstreetmap.org/reverse?lat=${imageLatitude}&lon=${imageLongitude}&format=json`;
                    const response = await fetch(url);
                    const data = await response.json();
                    if (data && data.name) {
                        setLocation(data.name);
                    }
                }
            } catch (error) {
                console.error('Error reading Exif data or reverse geocoding:', error);
            }


            // Check if it's a HEIC/HEIF file (by extension or MIME type)
            const isHeic = file.type === 'image/heic' ||
                file.type === 'image/heif' ||
                file.name.toLowerCase().endsWith('.heic') ||
                file.name.toLowerCase().endsWith('.heif')

            if (isHeic) {
                try {
                    // Convert HEIC to JPEG
                    const buffer = await file.arrayBuffer()
                    const output = await convertHEIC({
                        buffer: new Uint8Array(buffer),
                        format: 'JPEG',
                        quality: 1,
                    })
                    const blob = new Blob([output], { type: 'image/jpeg' })
                    file = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' })
                } catch (error) {
                    console.error('Error converting HEIC image:', error)
                    alert('Failed to process HEIC image. Please try a different image format.')
                    setIsProcessing(false)
                    return
                }
            }

            setIsProcessing(false)
            setSelectedFile(file)
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }, [])

    // Handle initial file when provided
    useEffect(() => {
        if (isOpen && initialFile) {
            handleNewFile(initialFile)
        }
    }, [isOpen, initialFile, handleNewFile])

    // Reset uploading state, mobile step, and error when modal closes
    useEffect(() => {
        if (!isOpen) {
            setIsUploading(false)
            setMobileStep(1)
            setUploadError(null)
        }
    }, [isOpen])

    // Force vertical orientation on mobile
    useEffect(() => {
        if (isMobile) {
            setOrientation('vertical')
        }
    }, [isMobile])

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        handleNewFile(file)
    }

    const handleReselect = () => {
        fileInputRef.current?.click()
    }

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (event: React.DragEvent) => {
        event.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault()
        setIsDragging(false)
        const file = event.dataTransfer.files[0]
        if (!file) return
        handleNewFile(file)
    }

    const handleSubmit = async (event?: React.FormEvent | React.MouseEvent) => {
        event?.preventDefault()

        // Define default placeholder values to ignore
        const defaultTitle = 'Click here to edit'
        const defaultLocation = 'ANYWHERE, EARTH'
        const defaultHandle = 'YOU'

        // Check if actual values have been provided (not just defaults)
        const hasValidTitle = title.trim() && title !== defaultTitle
        const hasValidLocation = location.trim() && location.toUpperCase() !== defaultLocation
        const hasValidHandle = handle.trim() && handle !== defaultHandle

        if (!selectedFile || !hasValidTitle || !hasValidLocation || !hasValidHandle) {
            setUploadError('Please fill in all fields: title, location, and handle')
            return
        }

        setIsUploading(true)
        setUploadError(null) // Clear any previous errors

        try {
            const uploadData: UploadData = {
                file: selectedFile,
                title: title.trim(),
                location: location.trim(),
                handle: handle.trim(),
                isPublic: isPublic,
                datetime: datetime || undefined
            }

            await onUpload?.(uploadData)
            // Don't close here - let the parent component handle navigation
            // handleClose() will be called by parent after successful upload
        } catch (error) {
            console.error('Upload failed:', error)
            setUploadError(error instanceof Error ? error.message : 'Upload failed. Please try again.')
            setIsUploading(false) // Re-enable the upload button
        }
    }

    const handleClose = () => {
        setSelectedFile(null)
        setPreviewUrl(null)
        setTitle('')
        setLocation('')
        setHandle('')
        setDatetime('')
        setIsUploading(false)
        setMobileStep(1)
        setUploadError(null)
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
        }
        onClose()
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !isUploading) {
            handleClose()
        }
    }

    const handleNextStep = () => {
        if (selectedFile && title.trim() && handle.trim() && location.trim()) {
            setMobileStep(2)
        }
    }

    const handleBackStep = () => {
        setMobileStep(1)
    }

    if (!isOpen) return null

    return (
        <div
            className={cn(
                "fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center animate-in fade-in duration-300",
                isMobile ? "p-4 flex-col overflow-y-auto" : "justify-center p-8 gap-20"
            )}
            onClick={handleBackdropClick}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing}
            />
            <div className={cn(
                "bg-gradient-to-br from-white via-white flex flex-col to-purple-50 w-full shadow-2xl relative rounded-lg animate-in zoom-in-95 duration-300",
                isMobile ? "p-4 gap-4 max-w-full my-auto" : "p-6 gap-6 max-w-lg max-h-[90vh] overflow-y-auto"
            )}>
                <div className=''>
                    <MemoriesLogo theme='dark' />
                </div>

                <form onSubmit={handleSubmit} className={cn(
                    'rounded-lg border border-black/20 text-black flex flex-col',
                    isMobile ? 'p-4 gap-4' : 'p-6 gap-6'
                )}>
                    <div className='flex flex-col gap-2'>
                        <div className={cn('font-extralight font-instrument', isMobile ? 'text-xl' : 'text-3xl')}>
                            Title your memory <span className='text-red-500'>*</span>
                        </div>
                        <Input
                            placeholder='First vacation with the fam'
                            className={cn('w-full border border-black/20 rounded-lg', isMobile ? 'p-3 text-sm' : 'p-5')}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            disabled={isUploading}
                        />
                    </div>
                    <div className='flex flex-col gap-2'>
                        <div className={cn('font-extralight font-instrument', isMobile ? 'text-xl' : 'text-3xl')}>
                            Twitter handle <span className='text-red-500'>*</span>
                        </div>
                        <Input
                            placeholder='@handle'
                            className={cn('w-full border border-black/20 rounded-lg', isMobile ? 'p-3 text-sm' : 'p-5')}
                            value={handle}
                            onChange={(e) => setHandle(e.target.value)}
                            required
                            disabled={isUploading}
                        />
                    </div>
                    <div className='flex gap-5'>
                        <div className='flex flex-1 flex-col gap-2'>
                            <div className={cn('font-extralight font-instrument', isMobile ? 'text-xl' : 'text-3xl')}>
                                Location <span className='text-red-500'>*</span>
                            </div>
                            <Input
                                placeholder='Anywhere, Earth'
                                className={cn('w-full border border-black/20 rounded-lg', isMobile ? 'p-3 text-sm' : 'p-5')}
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                required
                                disabled={isUploading}
                            />
                        </div>
                        {
                            datetime ?
                                (
                                    <div className='flex flex-1 flex-col gap-2'>
                                        <div className={cn('font-extralight font-instrument', isMobile ? 'text-xl' : 'text-3xl')}>
                                            Date
                                        </div>
                                        <Input
                                            placeholder='YYYY-MM-DD HH:MM:SS'
                                            className={cn('w-full border border-black/20 rounded-lg', isMobile ? 'p-3 text-sm' : 'p-5')}
                                            value={datetime}
                                            disabled
                                        />
                                    </div>
                                )
                                : null
                        }
                    </div>
                    <div className='flex flex-col gap-2'>
                        <div className={cn('font-extralight font-instrument flex gap-1 justify-between', isMobile ? 'text-xl' : 'text-3xl')}>
                            <span>Upload your memory <span className='text-red-500'>*</span></span>
                            <span className='flex flex-col gap-0 items-end max-w-1/3'>
                                <span className='text-sm inline-flex items-center justify-center gap-1'>public memory <Checkbox className={cn('scale-80', isPublic ? '!bg-green-200' : '!bg-gray-200')} checked={isPublic} onClick={() => setIsPublic(!isPublic)} /></span>
                                <span className='text-[11px] mr-1 text-right'>image will {isPublic ? 'be' : 'not be'} visible in gallery</span>
                            </span>
                        </div>
                        <div
                            className={cn(
                                'w-full border-2 border-dashed rounded-lg transition-all',
                                isMobile ? 'h-32 p-3' : 'h-40 p-5',
                                isUploading
                                    ? 'cursor-not-allowed opacity-50'
                                    : 'cursor-pointer',
                                isDragging && !isUploading
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-black/20 hover:border-black/40 hover:bg-gray-50',
                                isProcessing && 'cursor-not-allowed opacity-75'
                            )}
                            onDragOver={!isUploading && !isProcessing ? handleDragOver : undefined}
                            onDragLeave={!isUploading && !isProcessing ? handleDragLeave : undefined}
                            onDrop={!isUploading && !isProcessing ? handleDrop : undefined}
                            onClick={!isUploading && !isProcessing ? () => fileInputRef.current?.click() : undefined}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                                disabled={isProcessing}
                            />
                            <div className='flex flex-col items-center justify-center h-full gap-2'>
                                {isProcessing ? (
                                    <>
                                        <Loader2 className={cn(
                                            'animate-spin text-blue-600',
                                            isMobile ? 'w-6 h-6' : 'w-8 h-8'
                                        )} />
                                        <p className={cn('font-medium text-gray-600 text-center px-2', isMobile ? 'text-xs' : 'text-sm')}>
                                            Processing image...
                                        </p>
                                        <p className='text-xs text-gray-500'>Extracting metadata</p>
                                    </>
                                ) : selectedFile && previewUrl ? (
                                    <>
                                        <div className={cn(
                                            'rounded-lg overflow-hidden border border-gray-300 bg-gray-100',
                                            isMobile ? 'w-16 h-16' : 'w-20 h-20'
                                        )}>
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <p className={cn('font-medium text-gray-700 text-center px-2 line-clamp-1', isMobile ? 'text-xs' : 'text-sm')}>{selectedFile.name}</p>
                                        <p className='text-xs text-gray-500'>Click to change</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className={cn(
                                            'transition-colors',
                                            isMobile ? 'w-6 h-6' : 'w-8 h-8',
                                            isDragging ? 'text-purple-600' : 'text-gray-400'
                                        )} />
                                        <p className={cn('font-medium text-gray-600 text-center px-2', isMobile ? 'text-xs' : 'text-sm')}>
                                            {isDragging ? 'Drop your image here' : isMobile ? 'Click to upload' : 'Click to upload or drag and drop'}
                                        </p>
                                        <p className='text-xs text-gray-500'>{isMobile ? 'Up to 10MB' : 'PNG, JPG, GIF up to 10MB'}</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    {isMobile ? (
                        <Button
                            type="button"
                            onClick={handleNextStep}
                            disabled={!selectedFile || !title.trim() || !handle.trim() || !location.trim()}
                            className='w-full bg-[#2C2C2C] font-light text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-base p-4 flex items-center justify-center gap-2'
                        >
                            Next: Preview <ArrowRight className='w-5 h-5' />
                        </Button>
                    ) : (
                        <>
                            {uploadError && (
                                <div className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3'>
                                    {uploadError}
                                </div>
                            )}
                            <Button
                                type="submit"
                                disabled={!selectedFile || !title.trim() || !handle.trim() || !location.trim() || isUploading}
                                className='w-full bg-[#2C2C2C] font-light text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-xl p-6'
                            >
                                {isUploading ? 'Uploading...' : 'Upload'}
                            </Button>

                        </>
                    )}
                </form>
            </div>

            {/* Preview section - desktop only */}
            <div className='flex flex-col gap-5 items-center justify-center'>
                <div className='font-extralight text-muted-foreground text-center'>Memory Preview <br />Click on the title, location and handle to set your own</div>
                <StampPreview
                    headline={title}
                    location={location}
                    handle={handle}
                    date={datetime ? new Date(datetime).toLocaleDateString() : new Date().toLocaleDateString()}
                    imageSrc={previewUrl}
                    layout={orientation}
                    className={cn("", orientation === 'vertical' ? 'max-h-[80vh]' : 'min-w-2xl')}
                    onReselect={handleReselect}
                    isProcessing={isProcessing}
                    onHeadlineChange={setTitle}
                    onLocationChange={setLocation}
                    onHandleChange={setHandle}
                />
                <div className="flex items-center justify-center gap-8">
                    {!isMobile && <div className='flex items-center justify-center gap-2'>
                        <Button
                            variant='ghost'
                            className={cn('!w-7 rounded-none h-12 p-0', orientation == 'vertical' ? '' : 'opacity-50')}
                            style={{
                                backgroundImage: `url(${postcardV})`,
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
                            }}
                            onClick={() => setOrientation('vertical')}
                        >
                            {orientation == "vertical" && <Check className='w-4 h-4' color='black' />}
                        </Button>
                        <Button
                            variant='ghost'
                            className={cn('w-10 rounded-none h-7 p-0', orientation == 'horizontal' ? '' : 'opacity-50')}
                            onClick={() => setOrientation('horizontal')}
                            style={{
                                backgroundImage: `url(${postcardH})`,
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
                            }}
                        >
                            {orientation == "horizontal" && <Check className='w-4 h-4' color='black' />}
                        </Button>
                    </div>}
                    {uploadError && (
                        <div className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2'>
                            {uploadError}
                        </div>
                    )}
                    <Button
                        className='!bg-[#000DFF] text-white disabled:opacity-50 disabled:cursor-not-allowed'
                        onClick={handleSubmit}
                        disabled={
                            !selectedFile ||
                            !title.trim() ||
                            title === 'Click here to edit' ||
                            !handle.trim() ||
                            handle === 'YOU' ||
                            !location.trim() ||
                            location.toUpperCase() === 'ANYWHERE, EARTH' ||
                            isUploading
                        }
                    >
                        {isUploading ? 'Uploading...' : 'Finish'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default UploadModal

