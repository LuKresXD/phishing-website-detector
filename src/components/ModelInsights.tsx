import React from 'react';
import { motion } from 'framer-motion';

interface ModelInsightsProps {
    prediction: number;
    confidence: number;
    features: Record<string, number>;
    modelMetadata?: {
        version: string;
        training_date: string;
        accuracy: number;
    };
}

const ModelInsights: React.FC<ModelInsightsProps> = ({
    prediction,
    confidence,
    features,
    modelMetadata
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-zinc-800 rounded-lg p-6 mt-4"
        >
            <h3 className="text-xl font-bold text-blue-300 mb-4">Model Insights</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 className="text-lg font-semibold text-blue-200 mb-2">Prediction Details</h4>
                    <div className="space-y-2">
                        <p className="text-blue-100">
                            Confidence: {(confidence * 100).toFixed(1)}%
                        </p>
                        <p className="text-blue-100">
                            Risk Score: {((1 - prediction) * 100).toFixed(1)}%
                        </p>
                    </div>
                </div>
                
                {modelMetadata && (
                    <div>
                        <h4 className="text-lg font-semibold text-blue-200 mb-2">Model Information</h4>
                        <div className="space-y-2">
                            <p className="text-blue-100">Version: {modelMetadata.version}</p>
                            <p className="text-blue-100">
                                Training Date: {new Date(modelMetadata.training_date).toLocaleDateString()}
                            </p>
                            <p className="text-blue-100">
                                Model Accuracy: {(modelMetadata.accuracy * 100).toFixed(1)}%
                            </p>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="mt-6">
                <h4 className="text-lg font-semibold text-blue-200 mb-2">Feature Analysis</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(features).map(([feature, value]) => (
                        <div
                            key={feature}
                            className="bg-zinc-700 rounded p-3"
                        >
                            <p className="text-sm font-medium text-blue-300">
                                {feature.replace(/_/g, ' ').toUpperCase()}
                            </p>
                            <p className="text-lg font-bold text-blue-100">
                                {typeof value === 'number' ? value.toFixed(2) : value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default ModelInsights;
