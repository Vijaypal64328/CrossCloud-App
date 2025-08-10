import {ArrowUpCircle, Clock, CreditCard, FileText, Share2, Shield, Wallet} from "lucide-react";

const FeaturesSection = ({features}) => {
    const renderIcon = (iconName, iconColor) => {
        const iconProps = {size: 25, className: iconColor};

        switch (iconName) {
            case 'ArrowUpCirlce':
                return <ArrowUpCircle {...iconProps} />;
            case 'Shield':
                return <Shield {...iconProps} />;
            case 'Share2':
                return <Share2 {...iconProps} />;
            case 'CreditCard':
                return <CreditCard {...iconProps} />;
            case 'FileText':
                return <FileText {...iconProps} />;
            case 'Clock':
                return <Clock {...iconProps} />;
            default:
                return <FileText {...iconProps} />;
        }
    }
    return (
    <div className="py-16 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 animate-gradient-move">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Everything you need for the file sharing
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                        CrossCloud provides all the tools you need to manage your digital content
                    </p>
                </div>
                <div className="mt-16">
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="pt-5 border border-gray-100 rounded-xl shadow-sm bg-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-purple-300 hover:bg-gradient-to-br hover:from-blue-50 hover:via-purple-50 hover:to-pink-50 group"
                                style={{cursor:'pointer'}}
                            >
                                <div className="flow-root bg-gray-50 rounded-xl px-6 pb-8 group-hover:bg-white/80 transition-colors duration-300">
                                    <div className="-mt-6">
                                        <div className="inline-flex items-center justify-center p-3 bg-white rounded-md shadow-lg group-hover:bg-gradient-to-r group-hover:from-purple-100 group-hover:to-blue-100 transition-colors duration-300">
                                            {renderIcon(feature.iconName, feature.iconColor)}
                                        </div>
                                        <h3 className="mt-5 text-lg font-medium text-gray-900 tracking-tight group-hover:text-purple-700 transition-colors duration-300">
                                            {feature.title}
                                        </h3>
                                        <p className="mt-2 text-base text-gray-500 group-hover:text-blue-500 transition-colors duration-300">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FeaturesSection;