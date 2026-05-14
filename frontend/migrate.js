const fs = require('fs');
const path = require('path');

const baseDirs = [
    path.join(__dirname, 'src', 'pages'),
    path.join(__dirname, 'src', 'components'),
    path.join(__dirname, 'app')
];

function processDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (!content.startsWith('"use client";') && !content.startsWith("'use client';")) {
                if (/useState|useEffect|useRouter|usePathname|useAuth|useSearchParams|useContext|useCallback/.test(content)) {
                    content = '"use client";\n' + content;
                    fs.writeFileSync(fullPath, content);
                    console.log(`Added "use client" to ${fullPath}`);
                }
            }
        }
    }
}

baseDirs.forEach(processDirectory);
console.log('Migration complete.');
