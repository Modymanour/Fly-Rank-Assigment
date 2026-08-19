import * as cheerio from 'cheerio';
import fs from 'fs';
import { error } from 'node:console';
import { setTimeout } from 'node:timers/promises';
import { record, z } from 'zod';

const BASE_URL = 'https://books.toscrape.com/';
const CACHE_DIR = '../cache';
const USER_AGENT = 'lyRankInternship-A9/1.0 (https://github.com/Modymanour/Fly-Rank-Assigment)';

async function fetchHtml(url) {
    const response = await fetch(url, {
        headers: { 'user-agent': USER_AGENT },
        signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
    }

    return response.text();
}

async function savePageToFile(pageNum){
    try{
        const cachePath = `${CACHE_DIR}/catalogue-page-${pageNum}.html`;
        if(fs.existsSync(cachePath)){
            console.log(`Page ${pageNum} already exists. Skipping download.`);
            return true;
        }
        
        await setTimeout(500); // Wait for half a sec before making the request
        const url = pageNum === 1 ? BASE_URL : `${BASE_URL}catalogue/page-${pageNum}.html`;
        const html = await fetchHtml(url);
        fs.writeFileSync(cachePath, html);
        console.log(`HTML content saved to catalogue-page-${pageNum}.html`);
        return true;
    }
    catch(err){
        console.error(`Error downloading page ${pageNum}:`, err.message);
        return false;
    }
}

async function getBooksLinks(html){
    try{
        const $ = cheerio.load(html);
        const bookLinks = [];
        $('.image_container a').each((index, element) => {
            const link = $(element).attr('href');
            if (link) bookLinks.push(link);
        });
        return bookLinks;
    }
    catch(err){
        console.error('Error accessing file:', err);
    }
}
async function getBookRecords(books, sourcePage){
    const errors = [];
    const records = [];
    const cachePath = `${CACHE_DIR}/books`;
    for (const bookPath of books) {
        const normalizedPath = bookPath.startsWith('catalogue/') ? bookPath : `catalogue/${bookPath}`;
        const url = new URL(normalizedPath, BASE_URL).href;
        const fetchedAt = new Date().toISOString();

        try{
            const $ = await cheerio.fromURL(url);
            const ratingClass = $('p.star-rating').attr('class')?.split(' ').find((value) => value !== 'star-rating');
            const description = $('#product_description').next('p').text().trim();
            const data = ({
                title: $('div.product_main h1').text().trim(),
                product_url: url,
                price_text: $('p.price_color').first().text().trim(),
                price_gbp: parseFloat($('p.price_color').first().text().trim().replace('£',''),),
                availability_text: $('p.instock.availability').first().text().trim(),
                rating_text: ratingClass ?? null,
                description: description || null,
                source_page: sourcePage,
                fetched_at: fetchedAt,
            });
            const validation = validateData(data);
            if(validation.success) records.push(validation.data);
            else{
                const error = {
                    product_url: url,
                    error: validation.error,
                    fetched_at: fetchedAt
                }
                errors.push(error);
                console.error("data did not pass", validation.error);
            }
        } catch (err) {
            console.error(`Error parsing ${url}:`, err.message);
        }
    };
    //saving books
    try{
        fs.mkdirSync('../output', { recursive: true });
        const savedBooks = fs.existsSync('../output/books.json')
            ? JSON.parse(fs.readFileSync('../output/books.json', 'utf-8'))
            : [];
        const existingUrls = new Set(savedBooks.map((book) => book.product_url));
        const newBooks = records.filter((book) => !existingUrls.has(book.product_url));
        fs.writeFileSync('../output/books.json', JSON.stringify([...savedBooks, ...newBooks], null, 2), 'utf-8');
        console.log(`${newBooks.length} new books saved.`);
    }
    catch(err){
        console.error("Error while trying to open file books", err)
    }
    //saving errors
    try{
        fs.mkdirSync('../output', { recursive: true });
        const savedErrors = fs.existsSync('../output/erros.json')
            ? JSON.parse(fs.readFileSync('../output/errors.json', 'utf-8'))
            : [];
        const existingUrls = new Set(savedErrors.map((error) => error.product_url));
        const newErrors = errors.filter((error) => !existingUrls.has(error.product_url));
        fs.writeFileSync('../output/errors.json', JSON.stringify([...savedErrors, ...newErrors], null, 2), 'utf-8');
    }
    catch(err){
        console.error("Error while trying to open file errors", err)
    }
    // console.log(records);
    return records;
}

function validateData(data){
    const validator = z.object({
        title: z.string(),
        product_url: z.string().includes('https://books.toscrape.com/'),
        price_text: z.string().includes('£'),
        price_gbp: z.float32(),
        availability_text: z.string(),
        rating_text: z.string(),
        description: z.string(),
        source_page: z.string(),
        fetched_at: z.string()
    });
    return validator.safeParse(data);
}

async function main(){
    const records = [];
    for(let i = 1; i <= 3; i++){
        try{
            const success = await savePageToFile(i);
            if(!success) {
                console.log(`Skipping page ${i} due to download failure.`);
                continue;
            }
            const html = fs.readFileSync(`${CACHE_DIR}/catalogue-page-${i}.html`, 'utf-8');
            const bookLinks = await getBooksLinks(html);
            const sourcePage = i === 1 ? BASE_URL : `${BASE_URL}catalogue/page-${i}.html`;
            records.push(...await getBookRecords(bookLinks, sourcePage));
        }
        catch(err){
            console.error('Error in main:', err);
        }
    }
    console.log(JSON.stringify(records[0], null, 2));
    console.log(`detail_pages=${records.length}`);
}

main();
