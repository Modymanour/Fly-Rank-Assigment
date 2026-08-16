import * as cheerio from 'cheerio';
import fs from 'fs';

try{
    if(fs.existsSync('../cache/catalogue-page-1.html')){
        console.log('File already exists. Skipping download.');
    }
    else{
        const $ = await cheerio.fromURL('https://books.toscrape.com/', {
          method: 'GET',
          headers: {
            'user-agent': 'lyRankInternship-A9/1.0 (https://github.com/Modymanour/Fly-Rank-Assigment)'
          },
          timeout: 10000,
        });
        
        
        const html = $.html();
        try{
            fs.writeFileSync('../cache/catalogue-page-1.html', html);
            console.log('HTML content saved to catalogue-page-1.html');
        }
        catch(err){
            console.error('Error writing to file:', err);
        }
    }
}
catch(err){
    console.error('Error accessing file:', err);
}


