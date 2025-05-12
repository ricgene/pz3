import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface MemoryStatusProps {
    userId: string;
    showDebug?: boolean;
}

interface MemoryData {
    user_memory: {
        name: string | null;
        last_interaction: number;
    };
    entity_memory: {
        name: string;
        last_updated: number;
    };
    conversation_memory: {
        messages: Array<{
            content: string;
            timestamp: number;
            type: 'human' | 'ai';
        }>;
        last_updated: number;
    };
}

export const MemoryStatus: React.FC<MemoryStatusProps> = ({ userId, showDebug = false }) => {
    const [isVisible, setIsVisible] = useState(showDebug);
    const [lastOperation, setLastOperation] = useState<string>('');

    const { data: memoryData, error, isLoading } = useQuery<MemoryData>({
        queryKey: ['memory', userId],
        queryFn: async () => {
            const response = await axios.get(`/api/memory/${userId}`);
            return response.data;
        },
        enabled: isVisible,
        refetchInterval: isVisible ? 5000 : false, // Poll every 5 seconds if visible
    });

    // Listen for memory operations
    useEffect(() => {
        const handleMemoryOperation = (event: CustomEvent) => {
            setLastOperation(event.detail.operation);
        };

        window.addEventListener('memoryOperation' as any, handleMemoryOperation);
        return () => {
            window.removeEventListener('memoryOperation' as any, handleMemoryOperation);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-md">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Memory Status</h3>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-gray-500 hover:text-gray-700"
                >
                    ×
                </button>
            </div>

            {isLoading && <div className="text-gray-500">Loading memory status...</div>}
            {error && <div className="text-red-500">Error loading memory: {error.message}</div>}
            
            {memoryData && (
                <div className="space-y-2">
                    <div className="text-sm">
                        <span className="font-medium">User Name:</span>{' '}
                        {memoryData.user_memory.name || 'Not set'}
                    </div>
                    <div className="text-sm">
                        <span className="font-medium">Last Interaction:</span>{' '}
                        {new Date(memoryData.user_memory.last_interaction).toLocaleString()}
                    </div>
                    <div className="text-sm">
                        <span className="font-medium">Messages:</span>{' '}
                        {memoryData.conversation_memory.messages.length}
                    </div>
                    {lastOperation && (
                        <div className="text-sm text-blue-500">
                            Last Operation: {lastOperation}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}; 