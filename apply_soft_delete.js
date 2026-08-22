const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.service.ts') || file.endsWith('.controller.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(srcDir);

for (const file of files) {
    // skip participants, auth, app, prisma
    if (file.includes('participants.service.ts') || file.includes('participants.controller.ts') || 
        file.includes('auth.service.ts') || file.includes('app.service.ts') || 
        file.includes('prisma.service.ts')) {
        continue;
    }

    let content = fs.readFileSync(file, 'utf8');
    const isService = file.endsWith('.service.ts');
    const isController = file.endsWith('.controller.ts');
    
    const baseName = path.basename(file).split('.')[0];
    let modelName = '';
    if (baseName === 'schools') modelName = 'school';
    else if (baseName === 'communities') modelName = 'community';
    else if (baseName === 'cleanup') modelName = 'cleanupEvent';
    else if (baseName === 'waste') modelName = 'wasteRecord';
    else if (baseName === 'inventory') modelName = 'inventoryItem';
    else if (baseName === 'clubs') modelName = 'environmentalClub';
    else if (baseName === 'reports') modelName = 'weeklyReport';
    else if (baseName === 'users') modelName = 'user';
    
    if (!modelName) continue;
    
    if (isService) {
        // update findAll
        content = content.replace(/findMany\(\{(?![\s\S]*where\s*:)/g, 'findMany({ where: { deletedAt: null }, ');
        content = content.replace(/findMany\(\s*\)/g, 'findMany({ where: { deletedAt: null } })');
        
        // update findOne
        content = content.replace(/findUnique\(\{[\s]*where:[\s]*\{[\s]*id[\s]*\}[\s]*\}\)/g, 'findFirst({ where: { id, deletedAt: null } })');
        content = content.replace(/findUnique\(\{[\s]*where:[\s]*\{[\s]*id[\s]*\},/g, 'findFirst({ where: { id, deletedAt: null },');
        
        // update remove
        content = content.replace(/delete\(\{[\s]*where:[\s]*\{[\s]*id[\s]*\}[\s]*\}\)/g, `update({ where: { id }, data: { deletedAt: new Date() } })`);
        
        // add restore
        if (!content.includes('restore(id')) {
            const restoreCode = `\n  async restore(id: string) {\n    await this.ensureExists(id);\n    return this.prisma.${modelName}.update({ where: { id }, data: { deletedAt: null } });\n  }\n`;
            content = content.replace(/}\s*$/g, restoreCode + '}');
        }
    }
    
    if (isController) {
        if (!content.includes('restore(')) {
            // Add Post if missing
            if (!content.includes('Post,')) {
                content = content.replace(/import \{([^}]+)\} from '@nestjs\/common';/, "import { $1, Post } from '@nestjs/common';");
            }
            
            const serviceMatch = content.match(/constructor\(private readonly ([a-zA-Z]+Service):/);
            if (serviceMatch) {
                const serviceName = serviceMatch[1];
                const restoreEndpoint = `\n  @Post(':id/restore')\n  restore(@Param('id') id: string) {\n    return this.${serviceName}.restore(id);\n  }\n`;
                content = content.replace(/}\s*$/g, restoreEndpoint + '}');
            }
        }
    }
    
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
}
