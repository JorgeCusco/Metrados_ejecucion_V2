import fs from 'fs';
import path from 'path';

function searchInDir(dir, query) {
    if (!fs.existsSync(dir)) {
        console.log(`Directory ${dir} does not exist`);
        return;
    }
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            searchInDir(fullPath, query);
        } else if (file.endsWith('.js') || file.endsWith('.html')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(query)) {
                console.log(`Found "${query}" in file: ${fullPath}`);
            }
        }
    }
}

console.log("=== Inspecting 'dist/' directory ===");
searchInDir('dist', 'tvallyxjyhubcvzpnivg');
searchInDir('dist', 'cdinoxmyukpasihkkkmd');
