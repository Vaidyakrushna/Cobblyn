import os
import re

def migrate_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'react-router-dom' not in content:
        return

    # 1. Replace <Link to="..."> with <Link href="...">
    content = re.sub(r'<Link([^>]*)to=', r'<Link\1href=', content)

    # 2. Replace NavLink with Link
    content = re.sub(r'<NavLink([^>]*)to=', r'<Link\1href=', content)
    content = content.replace('</NavLink>', '</Link>')

    # 3. Extract react-router-dom imports
    import_pattern = r'import\s+\{([^}]+)\}\s+from\s+[\'"]react-router-dom[\'"];?'
    
    match = re.search(import_pattern, content)
    if match:
        imports = [i.strip() for i in match.group(1).split(',')]
        
        new_imports = []
        if 'Link' in imports or 'NavLink' in imports:
            new_imports.append("import Link from 'next/link';")
            if 'Link' in imports: imports.remove('Link')
            if 'NavLink' in imports: imports.remove('NavLink')
            
        nav_imports = []
        for i in imports:
            if i == 'useNavigate':
                nav_imports.append('useRouter')
                content = content.replace('useNavigate()', 'useRouter()')
            elif i == 'useLocation':
                nav_imports.append('usePathname')
                content = content.replace('useLocation()', 'usePathname()')
            elif i == 'useParams':
                nav_imports.append('useParams')
            elif i == 'Outlet':
                pass # usually handled in layout
            
        if nav_imports:
            # Need to unique the list since we might have multiple
            nav_imports = list(set(nav_imports))
            new_imports.append(f"import {{ {', '.join(nav_imports)} }} from 'next/navigation';")
            
        content = re.sub(import_pattern, '\n'.join(new_imports), content)

    # Variable replacements
    content = content.replace('const location = useLocation();', 'const pathname = usePathname();')
    content = content.replace('location.pathname', 'pathname')
    content = content.replace('location.search', '""') # searchParams in Next.js is different, this is a patch
    
    content = content.replace('const navigate = useNavigate();', 'const router = useRouter();')
    content = content.replace('navigate(', 'router.push(')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    for root, dirs, files in os.walk('src'):
        for file in files:
            if file.endswith('.js') or file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                migrate_file(filepath)
                print(f"Migrated {filepath}")

if __name__ == '__main__':
    main()
