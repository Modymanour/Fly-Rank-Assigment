import * as cheerio from 'cheerio';
import fs from 'fs';
import { setTimeout } from 'node:timers/promises';

async function savePageToFile(pageNum){
    try{
        if(fs.existsSync(`../cache/catalogue-page-${pageNum}.html`)){
            console.log(`Page ${pageNum} already exists. Skipping download.`);
            return true;
        }
        
        await setTimeout(500); // Wait for half a sec before making the request
        var $;
        if(pageNum == 1){
            $ = await cheerio.fromURL(`https://books.toscrape.com/`, {
                method: 'GET',
                headers: {
                    'user-agent': 'lyRankInternship-A9/1.0 (https://github.com/Modymanour/Fly-Rank-Assigment)'
                },
                timeout: 10000,
            });
        }
        else{
            $ = await cheerio.fromURL(`https://books.toscrape.com/catalogue/page-${pageNum}.html`, {
              method: 'GET',
              headers: {
                'user-agent': 'lyRankInternship-A9/1.0 (https://github.com/Modymanour/Fly-Rank-Assigment)'
              },
              timeout: 10000,
            });
        }
        
        const html = $.html();
        fs.writeFileSync(`../cache/catalogue-page-${pageNum}.html`, html);
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
            bookLinks.push(link);
        });
        return bookLinks;
    }
    catch(err){
        console.error('Error accessing file:', err);
    }
}

async function main(){
    for(let i = 1; i <= 3; i++){
        try{
            const success = await savePageToFile(i);
            if(!success) {
                console.log(`Skipping page ${i} due to download failure.`);
                continue;
            }
            const html = fs.readFileSync(`../cache/catalogue-page-${i}.html`, 'utf-8');
            const bookLinks = await getBooksLinks(html);
            console.log(bookLinks);
        }
        catch(err){
            console.error('Error in main:', err);
        }
    }
}

main();
