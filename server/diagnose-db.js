import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";
import net from "net";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "./.env") });

async function diagnose() {
    console.log("------------------------------------------");
    console.log("🔍 MongoDB Connection Deep Diagnosis (Fast Mode)");
    console.log(`📡 URI Detected: ${process.env.MONGO_URI ? 'YES' : 'MISSING'}`);
    console.log("------------------------------------------");

    // 1. IP TEST
    console.log("1. Checking Your Public IP...");
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        console.log(`✅ Your Public IP is: ${data.ip}`);
        console.log(`📡 Is this IP whitelisted in Atlas? (Or 0.0.0.0/0)`);
    } catch (e) {
        console.warn("⚠️ IP Check failed (Maybe no internet?)");
    }

    // 2. DNS TEST
    console.log("\n2. Testing Atlas DNS...");
    const host = "cluster0.jqdaq6a.mongodb.net";
    try {
        const addr = await dns.promises.resolve(host, 'ANY');
        console.log(`✅ Host ${host} found!`);
    } catch (e) {
        console.error(`❌ DNS Failure for ${host}: ${e.message}`);
        console.log("💡 Try changing your PC's DNS to 8.8.8.8 (Google DNS).");
    }

    // 3. PORT TEST (27017)
    console.log("\n3. Testing Port 27017 reachability...");
    const shardHost = "ac-jqdaq6a-shard-00-00.jqdaq6a.mongodb.net";
    const socket = new net.Socket();
    const portPromise = new Promise((resolve) => {
        socket.setTimeout(3000);
        socket.on('connect', () => { 
            console.log(`✅ Port 27017 on ${shardHost} is OPEN!`); 
            socket.destroy(); 
            resolve(true); 
        });
        socket.on('timeout', () => { 
            console.error(`❌ Port 27017 Timeout! Your ISP/Firewall is blocking MongoDB connections.`); 
            socket.destroy(); 
            resolve(false); 
        });
        socket.on('error', (e) => { 
            console.error(`❌ Connection Error to ${shardHost}: ${e.message}`); 
            resolve(false); 
        });
        socket.connect(27017, shardHost);
    });
    await portPromise;

    // 4. HANDSHAKE TEST
    console.log("\n4. Final Driver Handshake Test...");
    try {
        mongoose.set("bufferCommands", false);
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log("✅ SUCCESS: Application is now connected to Cloud!");
        await mongoose.disconnect();
    } catch (e) {
        console.error(`❌ Handshake Failed: ${e.message}`);
    }
    console.log("------------------------------------------");
}

diagnose();
