const fs = require('fs');
const path = require('path');

// Manually parse .env because we can't easily rely on nextjs loader here
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

console.log('--- .env content length ---');
console.log(envContent.length);

const lines = envContent.split('\n');
const keyLine = lines.find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT_KEY='));

if (keyLine) {
    console.log('--- Found Key Line ---');
    const value = keyLine.split('FIREBASE_SERVICE_ACCOUNT_KEY=')[1];

    // Remove surrounding quotes if present (simplistic)
    let jsonStr = value;
    if (jsonStr.startsWith("'") && jsonStr.endsWith("'")) {
        jsonStr = jsonStr.slice(1, -1);
    }

    try {
        console.log('--- Attempting to Parse JSON ---');
        const parsed = JSON.parse(jsonStr);
        console.log('Success!');
        console.log('Project ID:', parsed.project_id);
    } catch (e) {
        console.log('Parse Error:', e.message);
        console.log('First 50 chars of value:', jsonStr.substring(0, 50));
    }
} else {
    console.log('Key not found in .env');
}
