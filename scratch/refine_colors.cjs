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
            
            // Sync primary buttons to Yellow (Primary) theme
            content = content.replace(/bg-jade-600 hover:bg-jade-700/g, 'bg-primary-600 hover:bg-primary-700');
            content = content.replace(/bg-jade-500/g, 'bg-primary-500'); // If used as main color
            content = content.replace(/shadow-jade-100/g, 'shadow-primary-100');
            content = content.replace(/shadow-jade-200/g, 'shadow-primary-200');
            
            // Keep icons and accents as Jade (already replaced by previous script)
            
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
