import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { WebSocket, WebSocketServer } from 'ws';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);

interface UserMemory {
    name: string | null;
    preferences: Record<string, any>;
    last_interaction: number;
    conversation_history: any[];
}

interface EntityMemory {
    name: string;
    last_updated: number;
    source: string;
    email?: string;
    id?: string;
}

interface ConversationMemory {
    messages: Array<{
        content: string;
        timestamp: number;
        type: 'human' | 'ai';
    }>;
    last_updated: number;
}

interface MemoryData {
    user_memory: UserMemory;
    entity_memory: EntityMemory;
    conversation_memory: ConversationMemory;
    last_updated: number;
}

export class MemoryService {
    private memoryDir: string;
    private wss: WebSocketServer;

    constructor(wss: WebSocketServer) {
        this.memoryDir = path.join(process.cwd(), 'memory');
        this.wss = wss;
        this.ensureMemoryDir();
    }

    private async ensureMemoryDir() {
        try {
            await mkdir(this.memoryDir, { recursive: true });
        } catch (error) {
            console.error('Error creating memory directory:', error);
        }
    }

    private getMemoryFilePath(userKey: string): string {
        return path.join(this.memoryDir, `${userKey}_memory.json`);
    }

    private emitMemoryOperation(userId: string, operation: string) {
        this.wss.clients.forEach((client: WebSocket) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'memoryOperation',
                    userId,
                    operation,
                    timestamp: Date.now()
                }));
            }
        });
    }

    async saveMemory(userKey: string, memoryData: MemoryData): Promise<void> {
        try {
            const filePath = this.getMemoryFilePath(userKey);
            await writeFile(filePath, JSON.stringify(memoryData, null, 2));
            console.log(`💾 Saved memory for user ${userKey}`);
            this.emitMemoryOperation(userKey, 'memory_saved');
        } catch (error) {
            console.error(`❌ Error saving memory for user ${userKey}:`, error);
            this.emitMemoryOperation(userKey, 'memory_save_error');
            throw error;
        }
    }

    async loadMemory(userKey: string): Promise<MemoryData | null> {
        try {
            const filePath = this.getMemoryFilePath(userKey);
            const data = await readFile(filePath, 'utf-8');
            console.log(`📖 Loaded memory for user ${userKey}`);
            this.emitMemoryOperation(userKey, 'memory_loaded');
            return JSON.parse(data);
        } catch (error) {
            console.log(`📝 No existing memory found for user ${userKey}`);
            this.emitMemoryOperation(userKey, 'memory_not_found');
            return null;
        }
    }

    async updateUserMemory(userKey: string, updates: Partial<UserMemory>): Promise<void> {
        try {
            const memoryData = await this.loadMemory(userKey) || this.getDefaultMemoryData();
            memoryData.user_memory = { ...memoryData.user_memory, ...updates };
            memoryData.last_updated = Date.now();
            await this.saveMemory(userKey, memoryData);
            this.emitMemoryOperation(userKey, 'user_memory_updated');
        } catch (error) {
            console.error(`❌ Error updating user memory for ${userKey}:`, error);
            this.emitMemoryOperation(userKey, 'user_memory_update_error');
            throw error;
        }
    }

    async updateEntityMemory(userKey: string, entityName: string, updates: Partial<EntityMemory>): Promise<void> {
        try {
            const memoryData = await this.loadMemory(userKey) || this.getDefaultMemoryData();
            memoryData.entity_memory = { ...memoryData.entity_memory, ...updates };
            memoryData.last_updated = Date.now();
            await this.saveMemory(userKey, memoryData);
            this.emitMemoryOperation(userKey, 'entity_memory_updated');
        } catch (error) {
            console.error(`❌ Error updating entity memory for ${userKey}:`, error);
            this.emitMemoryOperation(userKey, 'entity_memory_update_error');
            throw error;
        }
    }

    async addConversationMessage(userKey: string, message: { content: string; type: 'human' | 'ai' }): Promise<void> {
        try {
            const memoryData = await this.loadMemory(userKey) || this.getDefaultMemoryData();
            memoryData.conversation_memory.messages.push({
                ...message,
                timestamp: Date.now()
            });
            memoryData.conversation_memory.last_updated = Date.now();
            memoryData.last_updated = Date.now();
            await this.saveMemory(userKey, memoryData);
            this.emitMemoryOperation(userKey, 'conversation_message_added');
        } catch (error) {
            console.error(`❌ Error adding conversation message for ${userKey}:`, error);
            this.emitMemoryOperation(userKey, 'conversation_message_error');
            throw error;
        }
    }

    private getDefaultMemoryData(): MemoryData {
        return {
            user_memory: {
                name: null,
                preferences: {},
                last_interaction: Date.now(),
                conversation_history: []
            },
            entity_memory: {
                name: '',
                last_updated: Date.now(),
                source: 'default'
            },
            conversation_memory: {
                messages: [],
                last_updated: Date.now()
            },
            last_updated: Date.now()
        };
    }
} 