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
    let invalidRecords = 0;
    const cachePath = `${CACHE_DIR}/books`;
    books.push("wrong url");
    for (const bookPath of books) {
        const normalizedPath = bookPath.startsWith('catalogue/') ? bookPath : `catalogue/${bookPath}`;
        const url = new URL(normalizedPath, BASE_URL).href;
        const fetchedAt = new Date().toISOString();

        try{
            const data = await getData(url,sourcePage,fetchedAt);
            if(data.status != 200){
                const er = new Error("Server error");
                er.status = data.status;
                throw er;
            }
            const validation = validateData(data);
            if(validation.success) records.push(validation.data);
            else{
                invalidRecords++;
                console.error("data did not pass", validation.error);
                const er = new Error("Couldn't parse");
                er.status = validation.data.status ?? 200;
                throw er;
            }
        } catch (err) {
            const error = {
                product_url: url,
                error: err.message,
                fetched_at: fetchedAt,
                status: err.status
            }
            errors.push(error);
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
        const savedErrors = fs.existsSync('../output/errors.json')
            ? JSON.parse(fs.readFileSync('../output/errors.json', 'utf-8'))
            : [];
        const existingTimes = new Set(savedErrors.map((error) => error.fetched_at));
        const newErrors = errors.filter((error) => !existingTimes.has(error.fetched_at));
        fs.writeFileSync('../output/errors.json', JSON.stringify([...savedErrors, ...newErrors], null, 2), 'utf-8');
    }
    catch(err){
        console.error("Error while trying to open file errors", err)
    }
    // console.log(records);
    return { records, validRecords: records.length, invalidRecords, failedPages: errors.length };
}
async function getData(url,sourcePage,fetchedAt){
    const retryCodes = new Set([
        408,
        429,
        500,
        502,
        503,
        504
    ]);
    let response = await fetch(url)
    if(response.status == 200){
        console.log(`url: ${url} has passed`);
    }
    else if(!retryCodes.has(response.status)){
        console.error(`url: ${url} is returning status code ${response.status}. skipping it...`)
        return {status: response.status};
    }
    else{
        console.log(`got code ${response.status}. Will retry in a second`);
        await setTimeout(1000);
        response = await fetch(url);
        if(response.status != 200){
            console.error(`Website will not return the data currently. status code: ${response.status}`);
            return {status: response.status};
        }
    }
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
        status: 200,
        });
    // console.log(data);
    return data;
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
        fetched_at: z.string(),
        status: z.int().check(num => num == 200),
    });
    return validator.safeParse(data);
}
function createReport(start_time,duration_ms,pages_fetched,cache_hits,valid_records,invalid_records,failed_pages){
    try{
        fs.mkdirSync('../output', { recursive: true });
        const savedRunsData = fs.existsSync('../output/run-report.json')
            ? JSON.parse(fs.readFileSync('../output/run-report.json', 'utf-8'))
            : [];
        const savedRuns = Array.isArray(savedRunsData) ? savedRunsData : [savedRunsData];
        const existingTimes = new Set(savedRuns.map((run) => run.start_time));
        if(existingTimes.has(start_time)){
            console.log("Error happend while tryint to save run");
            return false;
        }
        else{
            savedRuns.push({
                start_time: start_time,
                duration_ms: duration_ms,
                pages_fetched: pages_fetched,
                cache_hits: cache_hits,
                valid_records: valid_records,
                invalid_records: invalid_records,
                failed_pages: failed_pages,
            });
            fs.writeFileSync('../output/run-report.json', JSON.stringify(savedRuns, null, 2), 'utf-8');
            console.log("New run report saved");
        }
    }
    catch(err){
        console.error("Error while saving run report", err)
    }
}

async function main(){
    const records = [];
    const startTime = new Date();
    let pagesFetched = 0;
    let cacheHits = 0;
    let validRecords = 0;
    let invalidRecords = 0;
    let failedPages = 0;
    for(let i = 1; i <= 3; i++){
        try{
            const cachePath = `${CACHE_DIR}/catalogue-page-${i}.html`;
            const cacheHit = fs.existsSync(cachePath);
            const success = await savePageToFile(i);
            if(!success) {
                console.log(`Skipping page ${i} due to download failure.`);
                continue;
            }
            pagesFetched++;
            if(cacheHit) cacheHits++;
            const html = fs.readFileSync(cachePath, 'utf-8');
            const bookLinks = await getBooksLinks(html);
            const sourcePage = i === 1 ? BASE_URL : `${BASE_URL}catalogue/page-${i}.html`;
            const result = await getBookRecords(bookLinks, sourcePage);
            records.push(...result.records);
            validRecords += result.validRecords;
            invalidRecords += result.invalidRecords;
            failedPages += result.failedPages;
        }
        catch(err){
            console.error('Error in main:', err);
        }
    }
    const duration = Date.now() - startTime.getTime();
    createReport(startTime,duration,pagesFetched,cacheHits,validRecords,invalidRecords,failedPages)
    
}

main();
