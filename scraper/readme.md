## SCRAPING

### Target Classification
I will be web scraping from the page toscrape.com which is an open sandbox of books for people to practise webscraping on. I will be scraping the first 3 pages only. Scraping data from this website is fine since their consent is given fully.

### Accessing given link
After requesting https://books.toscrape.com/robots.txt, there were no robot files found

### IMPORTANT
I will not reuse this code for another site without checking its rules and terms first

### To run the scraper
Run the below command in the scraper folder which will result in books.json, errors.json and a run-report in the run-report.json
```bash
node . (if on the scraper folder)
```
### Sample run-report
This is a sample of one of the runs for the scraper
```http
{
    "start_time": "2026-08-19T15:39:53.009Z",
    "duration_ms": 55783,
    "pages_fetched": 3,
    "cache_hits": 3,
    "valid_records": 60,
    "invalid_records": 0,
    "failed_pages": 3
}
```