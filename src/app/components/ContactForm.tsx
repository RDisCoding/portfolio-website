'use client'

import { useState, useTransition } from 'react'
import { handleContactForm } from '@/app/actions'
import { useRouter } from 'next/navigation'

export default function ContactForm() {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<string | null>(null);
    const router = useRouter()

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        
        startTransition(async () => {
            const result = await handleContactForm(formData);
            if (result.success) {
                setMessage('Message sent successfully! Thank you.');
                (event.target as HTMLFormElement).reset();
            } else {
                setMessage(`Error: ${result.error}`);
            }
        });
    };

    const handleBackToHome = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        router.push('/#contact')
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input 
                    type="text" 
                    name="name" 
                    id="name" 
                    required 
                    className="w-full bg-white/5 border border-white/10 rounded-lg text-white p-3 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 backdrop-blur-sm hover:bg-white/10" 
                />
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input 
                    type="email" 
                    name="email" 
                    id="email" 
                    required 
                    className="w-full bg-white/5 border border-white/10 rounded-lg text-white p-3 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 backdrop-blur-sm hover:bg-white/10" 
                />
            </div>
            <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                <textarea 
                    name="message" 
                    id="message" 
                    rows={5} 
                    required 
                    className="w-full bg-white/5 border border-white/10 rounded-lg text-white p-3 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 backdrop-blur-sm hover:bg-white/10 resize-none"
                ></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                    type="submit" 
                    disabled={isPending} 
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(147,51,234,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
                >
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></span>
                    <span className="relative">{isPending ? 'Sending...' : 'Send Message'}</span>
                </button>
                <button 
                    type="button"
                    onClick={handleBackToHome}
                    className="w-full bg-white/5 hover:bg-white/10 text-white font-semibold py-3 px-6 rounded-xl border border-white/20 hover:border-purple-400/50 transition-all duration-300 backdrop-blur-sm"
                >
                    ← Back to Home
                </button>
            </div>
            {message && (
                <div className="text-center p-4 bg-purple-600/10 border border-purple-500/30 rounded-lg">
                    <p className="text-gray-300">{message}</p>
                </div>
            )}
        </form>
    );
}

