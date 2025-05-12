import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import { expect } from 'chai';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const SERVER_URL = 'http://localhost:3001';
const TEST_USER_ID = 'test-user-123';
const MEMORY_DIR = path.join(process.cwd(), 'server', 'memory');

async function startServer() {
    console.log('🚀 Starting server...');
    try {
        await execAsync('cd server && npm run dev');
    } catch (error) {
        console.error('Error starting server:', error);
        throw error;
    }
}

async function startClient() {
    console.log('🎨 Starting client...');
    try {
        await execAsync('npm run dev');
    } catch (error) {
        console.error('Error starting client:', error);
        throw error;
    }
}

async function waitForServer() {
    console.log('⏳ Waiting for server to be ready...');
    let retries = 5;
    while (retries > 0) {
        try {
            await axios.get(`${SERVER_URL}/health`);
            console.log('✅ Server is ready!');
            return;
        } catch (error) {
            retries--;
            if (retries === 0) throw new Error('Server failed to start');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

async function testMemoryPersistence() {
    console.log('\n=== Testing Memory Persistence ===\n');

    // Test 1: Name Introduction
    console.log('Test 1: Name Introduction');
    const nameResponse = await axios.post(`${SERVER_URL}/api/chat`, {
        userId: TEST_USER_ID,
        message: 'My name is Test User'
    });
    expect(nameResponse.data.response).to.include('Test User');
    console.log('✅ Name introduction successful');

    // Test 2: Name Recall
    console.log('\nTest 2: Name Recall');
    const recallResponse = await axios.post(`${SERVER_URL}/api/chat`, {
        userId: TEST_USER_ID,
        message: 'What is my name?'
    });
    expect(recallResponse.data.response).to.include('Test User');
    console.log('✅ Name recall successful');

    // Test 3: Persistence
    console.log('\nTest 3: Persistence');
    const persistenceResponse = await axios.post(`${SERVER_URL}/api/chat`, {
        userId: TEST_USER_ID,
        message: 'Do you remember my name?'
    });
    expect(persistenceResponse.data.response).to.include('Test User');
    console.log('✅ Memory persistence successful');

    // Test 4: Check Memory File
    console.log('\nTest 4: Checking Memory File');
    const memoryResponse = await axios.get(`${SERVER_URL}/api/memory/${TEST_USER_ID}`);
    expect(memoryResponse.data.user_memory.name).to.equal('Test User');
    console.log('✅ Memory file verification successful');
}

async function testErrorHandling() {
    console.log('\n=== Testing Error Handling ===\n');

    // Test 1: Invalid User ID
    console.log('Test 1: Invalid User ID');
    try {
        await axios.post(`${SERVER_URL}/api/chat`, {
            userId: '',
            message: 'Hello'
        });
        throw new Error('Should have failed with invalid user ID');
    } catch (error) {
        expect(error.response.status).to.equal(400);
        console.log('✅ Invalid user ID handled correctly');
    }

    // Test 2: Invalid Message
    console.log('\nTest 2: Invalid Message');
    try {
        await axios.post(`${SERVER_URL}/api/chat`, {
            userId: TEST_USER_ID,
            message: ''
        });
        throw new Error('Should have failed with invalid message');
    } catch (error) {
        expect(error.response.status).to.equal(400);
        console.log('✅ Invalid message handled correctly');
    }

    // Test 3: Non-existent Memory
    console.log('\nTest 3: Non-existent Memory');
    try {
        await axios.get(`${SERVER_URL}/api/memory/non-existent-user`);
        throw new Error('Should have failed with non-existent memory');
    } catch (error) {
        expect(error.response.status).to.equal(404);
        console.log('✅ Non-existent memory handled correctly');
    }
}

async function testRecovery() {
    console.log('\n=== Testing Recovery ===\n');

    // Test 1: Corrupt Memory File
    console.log('Test 1: Corrupt Memory File');
    const memoryFilePath = path.join(MEMORY_DIR, `${TEST_USER_ID}_memory.json`);
    const originalContent = fs.readFileSync(memoryFilePath, 'utf-8');
    
    // Corrupt the file
    fs.writeFileSync(memoryFilePath, 'invalid json content');
    
    // Try to load memory
    try {
        await axios.get(`${SERVER_URL}/api/memory/${TEST_USER_ID}`);
        throw new Error('Should have failed with corrupt memory file');
    } catch (error) {
        expect(error.response.status).to.equal(500);
        console.log('✅ Corrupt memory file handled correctly');
    }

    // Restore the file
    fs.writeFileSync(memoryFilePath, originalContent);
    
    // Verify recovery
    const recoveryResponse = await axios.get(`${SERVER_URL}/api/memory/${TEST_USER_ID}`);
    expect(recoveryResponse.data.user_memory.name).to.equal('Test User');
    console.log('✅ Memory recovery successful');
}

async function runTests() {
    try {
        // Start server and client
        await startServer();
        await startClient();
        await waitForServer();

        // Run tests
        await testMemoryPersistence();
        await testErrorHandling();
        await testRecovery();

        console.log('\n🎉 All tests passed successfully!');
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

// Run the tests
runTests(); 