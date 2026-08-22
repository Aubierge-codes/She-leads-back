const fs = require('fs');
const path = require('path');
const srcDir = path.join(__dirname, 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        if (fs.statSync(file).isDirectory()) results = results.concat(walk(file));
        else if (file.endsWith('.ts')) results.push(file);
    });
    return results;
}

for (const file of walk(srcDir)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix duplicate Post
    if (content.includes('Post , Post')) {
        content = content.replace(/Post , Post/g, 'Post');
    }
    
    // Fix ensureExists in services that don't have it
    if (file.endsWith('.service.ts')) {
        if (!content.includes('ensureExists(id: string)') && !content.includes('ensureExists(id)')) {
             content = content.replace(/await this\.ensureExists\(id\);/g, '');
        }
    }
    
    fs.writeFileSync(file, content);
}
