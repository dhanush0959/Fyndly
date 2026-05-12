const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace react-router-dom imports
  content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]react-router-dom['"];?/g, (match, p1) => {
    let newImports = [];
    if (p1.includes('useNavigate')) newImports.push("import { useRouter } from 'next/navigation';");
    if (p1.includes('Link')) newImports.push("import Link from 'next/link';");
    return newImports.join('\n');
  });

  // Replace useNavigate() with useRouter()
  content = content.replace(/const\s+navigate\s*=\s*useNavigate\(\);/g, "const router = useRouter();");
  
  // Replace navigate('/path') with router.push('/path')
  content = content.replace(/navigate\(/g, "router.push(");

  // Add "use client" at the top if it uses hooks
  if ((content.includes('useState') || content.includes('useEffect') || content.includes('useRouter')) && !content.includes('"use client"') && !content.includes("'use client'")) {
    content = "'use client';\n" + content;
  }

  // Replace CSS imports if they are relative to components/styles
  // Actually, we'll just keep the styles folder in components.

  fs.writeFileSync(filePath, content);
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.js')) {
      migrateFile(fullPath);
    }
  }
}

traverse(componentsDir);
console.log('Migration complete');
