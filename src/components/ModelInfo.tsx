import { motion } from 'framer-motion';
import { Shield, Brain, LineChart, Database, CheckCircle2, AlertTriangle, Settings, RefreshCw } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <div className="flex items-start space-x-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:border-blue-500/50 transition-colors duration-300">
        <div className="mt-1">
            <Icon className="w-5 h-5 text-blue-500" />
        </div>
        <div>
            <h4 className="text-sm font-semibold text-blue-100">{title}</h4>
            <p className="text-sm text-blue-100/70">{description}</p>
        </div>
    </div>
);

const ModelInfo = () => {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            initial="hidden"
            animate="show"
            variants={container}
            className="w-full max-w-5xl mx-auto px-4 py-16 space-y-12"
        >
            <motion.div variants={item} className="text-center space-y-4">
                <h2 className="text-4xl font-bold text-blue-100 font-poppins">
                    Dual Analysis System
                </h2>
                <p className="text-blue-100/80 text-lg max-w-2xl mx-auto leading-relaxed">
                    Our comprehensive security assessment combines two powerful detection methods
                    to provide the most accurate results.
                </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* VirusTotal Analysis */}
                <motion.div variants={item} className="space-y-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <Shield className="w-8 h-8 text-blue-500" />
                        <h3 className="text-2xl font-semibold text-blue-100">VirusTotal Analysis</h3>
                    </div>

                    <p className="text-blue-100/80 leading-relaxed">
                        Leverages VirusTotal's powerful API to aggregate results from multiple antivirus
                        engines and website scanners, providing comprehensive threat detection.
                    </p>

                    <div className="space-y-3">
                        <FeatureCard
                            icon={Database}
                            title="Multi-Engine Scanning"
                            description="Aggregates results from 70+ antivirus scanners and website security services"
                        />
                        <FeatureCard
                            icon={CheckCircle2}
                            title="Verified Results"
                            description="Provides instant access to historical and current website security data"
                        />
                        <FeatureCard
                            icon={RefreshCw}
                            title="Real-time Updates"
                            description="Detailed security reports including malware detection and website reputation"
                        />
                    </div>
                </motion.div>

                {/* Custom ML Model */}
                <motion.div variants={item} className="space-y-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <Brain className="w-8 h-8 text-blue-500" />
                        <h3 className="text-2xl font-semibold text-blue-100">Custom ML Model</h3>
                    </div>

                    <p className="text-blue-100/80 leading-relaxed">
                        Our machine learning model analyzes URL patterns and website characteristics
                        to identify potential phishing attempts with high accuracy.
                    </p>

                    <div className="space-y-3">
                        <FeatureCard
                            icon={Settings}
                            title="Advanced Features"
                            description="Examines 27+ URL and domain characteristics to detect suspicious patterns"
                        />
                        <FeatureCard
                            icon={AlertTriangle}
                            title="Pattern Recognition"
                            description="Identifies common phishing techniques and suspicious URL structures"
                        />
                        <FeatureCard
                            icon={LineChart}
                            title="High Accuracy"
                            description="93% accuracy rate based on extensive training with verified datasets"
                        />
                    </div>
                </motion.div>
            </div>

            <motion.div
                variants={item}
                className="max-w-2xl mx-auto mt-12 p-6 rounded-lg bg-blue-500/10 border border-blue-500/20"
            >
                <div className="text-center space-y-3">
                    <h4 className="text-xl font-semibold text-blue-100">
                        Combined Strength
                    </h4>
                    <p className="text-blue-100/80">
                        By combining VirusTotal's extensive database with our custom ML model,
                        we provide highly accurate phishing detection while minimizing false positives.
                        This dual approach ensures comprehensive protection against both known and emerging threats.
                    </p>
                </div>
            </motion.div>

            <motion.div variants={item} className="text-center">
                <p className="text-blue-100/60 text-sm">
                    Our system is continuously updated and improved to maintain high accuracy in phishing detection.
                </p>
            </motion.div>
        </motion.div>
    );
};

export default ModelInfo;