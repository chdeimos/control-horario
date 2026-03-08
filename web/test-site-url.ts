import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getSiteUrl } from './lib/get-site-url';
async function run() {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://horario.pandorasoft.com.es';
    console.log("Expected: https://horario.pandorasoft.com.es");
    console.log("Got:", await getSiteUrl());
}
run();
