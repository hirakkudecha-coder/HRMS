const fs = require('fs');
const path = require('path');

const directory = 'c:/FullStack_Project/EMS_Project/frontend/src';

function traverseAndReplace(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            traverseAndReplace(fullPath);
        } else if (stat.isFile() && (fullPath.endsWith('.jsx') || fullPath.endsWith('.js'))) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Replace io('http://localhost:5000')
            content = content.replace(/io\('http:\/\/localhost:5000'\)/g, "io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000')");
            
            // Replace `http://localhost:5000
            content = content.replace(/`http:\/\/localhost:5000/g, "`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}");
            
            fs.writeFileSync(fullPath, content);
        }
    }
}

traverseAndReplace(directory);
console.log('Replaced localhost URLs successfully.');
