import {assets} from "../../assets/assets.js";

const HeroSection = ({openSignIn, openSignUp}) => {
        return (
                <div className="landing-page-content relative min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 animate-gradient-move">
                        <style>{`
                                @keyframes cloudDraw {
                                    to { stroke-dashoffset: 0; }
                                }
                                @keyframes cloudFillFade {
                                    from { opacity: 0; }
                                    to { opacity: 1; }
                                }
                                @keyframes floatY {
                                    0% { transform: translateY(30px); }
                                    50% { transform: translateY(10px); }
                                    100% { transform: translateY(30px); }
                                }
                                .cloud-outline {
                                    stroke-dasharray: 1200;
                                    stroke-dashoffset: 1200;
                                    animation: cloudDraw 3s cubic-bezier(.77,0,.18,1) forwards;
                                }
                                .cloud-fill {
                                    opacity: 0;
                                    animation: cloudFillFade 2s 2.2s forwards;
                                }
                                .animate-gradient-move {
                                    background-size: 200% 200%;
                                    animation: gradientMove 8s ease-in-out infinite;
                                }
                                @keyframes gradientMove {
                                    0% { background-position: 0% 50%; }
                                    50% { background-position: 100% 50%; }
                                    100% { background-position: 0% 50%; }
                                }
                                .dashboard-float {
                                    animation: floatY 4s ease-in-out infinite;
                                }
                        `}</style>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="pt-20 pb-16 sm:pt-24 sm:pb-20 lg:pt-32 lg:pb-28">
                    <div className="text-center">
                        <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl flex flex-col items-center justify-center">
                            <span className="block">Share Files Securely with</span>
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 drop-shadow-lg font-extrabold flex items-center justify-center gap-2">
                                CrossCloud
                                {/* Larger, animated cloud with stroke formation effect */}
                                <svg width="70" height="50" viewBox="0 0 70 50" className="ml-2 animate-cloud-outline" style={{display:'inline-block',verticalAlign:'middle'}}>
                                    <defs>
                                        <linearGradient id="cloudStrokeGradient" x1="0" y1="0" x2="1" y2="1">
                                            <stop offset="0%" stopColor="#60a5fa" />
                                            <stop offset="100%" stopColor="#a78bfa" />
                                        </linearGradient>
                                    </defs>
                                    <path
                                        className="cloud-stroke-animate"
                                        d="M10 36Q7 27 18 24Q16 11 33 11Q37 3 48 9Q58 9 58 20Q70 20 67 33Q65 43 52 43H22Q15 43 10 36Z"
                                        fill="none"
                                        stroke="url(#cloudStrokeGradient)"
                                        strokeWidth="2.7"
                                        strokeLinejoin="round"
                                        strokeLinecap="round"
                                        filter="drop-shadow(0 2px 4px #a5b4fc33)"
                                    />
                                </svg>
                                <style>{`
                                    .cloud-stroke-animate {
                                        stroke-dasharray: 220;
                                        stroke-dashoffset: 220;
                                        animation: cloudStrokeDraw 2.2s cubic-bezier(.77,0,.18,1) forwards;
                                    }
                                    @keyframes cloudStrokeDraw {
                                        to { stroke-dashoffset: 0; }
                                    }
                                    @keyframes cloudOutline {
                                        0% { transform: translateY(0); }
                                        50% { transform: translateY(-6px); }
                                        100% { transform: translateY(0); }
                                    }
                                    .animate-cloud-outline {
                                        animation: cloudOutline 2.5s ease-in-out infinite;
                                    }
                                `}</style>
                            </span>
                        </h1>
                        <p className="mt-3 max-w-md mx-auto text-base text-gray-600 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                            Upload, manage, and share your files securely. Accessible anywhere, anytime.
                        </p>
                        <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
                            <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                                <button
                                    onClick={() => openSignUp()}
                                    className="flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 hover:from-pink-500 hover:to-purple-500 md:py-4 md:text-lg md:px-10 transition-all duration-200 shadow-xl hover:shadow-2xl backdrop-blur-lg">Get Started</button>
                                <button
                                    onClick={() => openSignIn()}
                                    className="flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 transition-all duration-200 shadow-lg hover:shadow-2xl">Sign In</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative flex justify-center mt-8">
                    <div className="aspect-w-16 rounded-xl shadow-2xl overflow-hidden bg-white/80 backdrop-blur-lg border border-purple-100 transition-transform duration-300 hover:scale-105 hover:shadow-3xl dashboard-float" style={{maxWidth:'900px', margin:'0 auto'}}>
                        <img src={assets.dashboard} alt="cross cloud dashboard" className="w-full h-full object-cover" style={{boxShadow:'0 12px 40px 0 rgba(80,0,180,0.15)', borderRadius:'1.25rem'}} />
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="mt-4 text-base text-gray-600 font-medium">
                        All your files are encrypted and stored securely with enterprise-grade security protocols.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default HeroSection;