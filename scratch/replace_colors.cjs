const fs = require('fs');
const path = require('path');

const directories = ['pages', 'components'];

function processDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            processDir(filePath);
        } else if (file.endsWith('.tsx')) {
            console.log(`Processing ${filePath}`);
            let content = fs.readFileSync(filePath, 'utf8');
            content = content.replace(/indigo/g, 'jade');
            fs.writeFileSync(filePath, content, 'utf8');
        }
    });
}

directories.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
        processDir(fullPath);
    }
});
