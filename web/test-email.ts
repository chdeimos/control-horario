import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { sendEmailNotification } from './lib/email';
async function run() {
    try {
        const res = await sendEmailNotification('test@example.com', 'Test', '<h1>Hello</h1>');
        console.log("Result:", res);
    } catch (err) {
        console.error("Crash:", err);
    }
}
run();
