import * as cheerio from 'cheerio';
import fs from 'fs';
import { setTimeout } from 'node:timers/promises';

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
            records.push({
                title: $('div.product_main h1').text().trim(),
                product_url: url,
                price_text: $('p.price_color').first().text().trim(),
                availability_text: $('p.instock.availability').first().text().trim(),
                rating_text: ratingClass ?? null,
                description: description || null,
                source_page: sourcePage,
                fetched_at: fetchedAt,
            });
        } catch (err) {
            console.error(`Error parsing ${url}:`, err.message);
        }
    }
    records.forEach(book => {
        const json = JSON.stringify(book);
        try{
            if(fs.existsSync(`${cachePath}/${book.title}`)){
                console.log(`${book.title} already exists in cache`);
            }
            else{
                fs.writeFileSync(`${cachePath}/${book.title}.json`,json,'utf-8')
                console.log(`${book.title} saved to cache successfully`);
            }
        }
        catch(err){
            console.error("Error while saving book data:", err)
        }
    });
    return records;
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
