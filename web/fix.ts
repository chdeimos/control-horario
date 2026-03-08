import fs from 'fs';
import path from 'path';

const files = [
    'app/(d105)/d105/users/actions.ts',
    'app/(d105)/d105/companies/actions.ts',
    'app/(admin)/admin/users/actions.ts',
    'app/(admin)/admin/companies/actions.ts',
    'app/(gestion)/gestion/employees/actions.ts',
    'app/(fichaje)/fichaje/employees/actions.ts',
    'app/(gestion)/gestion/empleados/actions.ts',
    'app/(dashboard)/employees/actions.ts'
];

files.forEach(f => {
    const filePath = path.join(process.cwd(), f);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if it already has getSiteUrl import
    if (!content.includes('getSiteUrl')) {
        content = content.replace(/import { revalidatePath } from 'next\/cache'/, "import { revalidatePath } from 'next/cache'\nimport { getSiteUrl } from '@/lib/get-site-url'");
    }

    const regex = /const { headers } = await import\('next\/headers'\)[\s\S]*?const siteUrl[^\n]+/g;

    // If we find the block
    if (regex.test(content)) {
        content = content.replace(regex, 'const siteUrl = await getSiteUrl()');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed:', f);
    }
});
