import React from 'react'
import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { MemoriesLogo } from './landing-page'
import { Button } from './ui/button'

const TermsAndConditions: React.FC = () => {
    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <div className="relative z-10 p-6">
                <div className="flex items-center justify-between">
                    <MemoriesLogo />
                    <Link to="/">
                        <Button
                            variant="ghost"
                            className="text-white/70 hover:text-white hover:bg-white/10"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-6 md:px-16 py-10">
                <h1 className="text-white font-instrument text-4xl md:text-6xl mb-8">
                    Terms & Conditions
                </h1>

                <div className="space-y-8 font-montserrat text-white/80 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using the Memories app ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">2. Use of Service</h2>
                        <p className="mb-3">
                            The Memories app allows you to upload and store photos permanently on the Arweave network. By using this Service, you acknowledge that:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Content uploaded to Arweave is permanent and cannot be deleted or modified</li>
                            <li>You are solely responsible for the content you upload</li>
                            <li>You have the necessary rights and permissions to upload and share the content</li>
                            <li>Public uploads are visible to anyone with the transaction ID</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">3. Content Guidelines</h2>
                        <p className="mb-3">
                            You agree not to upload content that:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Violates any laws or regulations</li>
                            <li>Infringes on intellectual property rights of others</li>
                            <li>Contains malicious code or viruses</li>
                            <li>Is obscene, offensive, or harmful</li>
                            <li>Violates the privacy rights of others</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">4. Permanence of Data</h2>
                        <p>
                            All content uploaded through this Service is stored on the Arweave network, which is designed for permanent data storage. Once uploaded, content cannot be deleted, modified, or removed. Please ensure you want to permanently store any content before uploading.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">5. Privacy</h2>
                        <p className="mb-3">
                            The Service offers two visibility options:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Public:</strong> Your memory will be visible in the public gallery and accessible to anyone</li>
                            <li><strong>Private:</strong> Your memory will not appear in the public gallery, but can still be accessed by anyone with the transaction ID</li>
                        </ul>
                        <p className="mt-3">
                            We do not collect personal information beyond what is necessary for wallet authentication and transaction processing on the Arweave network.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">6. Wallet Connection</h2>
                        <p>
                            This Service uses wallet connection technology to interact with the Arweave network. You are responsible for maintaining the security of your wallet credentials. We are not responsible for any unauthorized access to your wallet.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">7. Disclaimer of Warranties</h2>
                        <p>
                            The Service is provided "as is" without any warranties, expressed or implied. We do not warrant that the Service will be uninterrupted, secure, or error-free. We make no guarantees regarding the availability or accessibility of content stored on the Arweave network.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
                        <p>
                            In no event shall the creators or operators of this Service be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">9. Third-Party Services</h2>
                        <p>
                            This Service relies on the Arweave network, which is a third-party service. We are not responsible for the operation, availability, or security of the Arweave network. Your use of Arweave is subject to their own terms and conditions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">10. Modifications to Terms</h2>
                        <p>
                            We reserve the right to modify these terms at any time. Continued use of the Service after any such changes shall constitute your consent to such changes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">11. Contact</h2>
                        <p>
                            If you have any questions about these Terms and Conditions, please contact us through the Arweave community channels or by visiting{' '}
                            <a
                                href="https://arweave.org"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#000DFF] underline hover:text-[#0008CC]"
                            >
                                arweave.org
                            </a>
                            .
                        </p>
                    </section>

                    <section className="pt-8 border-t border-white/10">
                        <p className="text-sm text-white/60">
                            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </section>
                </div>

                {/* Back to home button at bottom */}
                <div className="mt-12 pb-12">
                    <Link to="/">
                        <Button
                            className="bg-[#000DFF] h-14 text-white border border-[#2C2C2C] px-8 py-4 text-lg font-semibold rounded-md hover:bg-[#0008CC] transition-colors"
                            variant="ghost"
                            size="lg"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default TermsAndConditions
