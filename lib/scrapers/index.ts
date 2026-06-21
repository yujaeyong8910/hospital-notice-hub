import { scrapeKHA } from './kha'
import { scrapeMOHW } from './mohw'
import { scrapeNHIS } from './nhis'
import { scrapeHIRA } from './hira'
import { CrawledNotice } from '@/types'

export async function scrapeAll(): Promise<CrawledNotice[]> {
  const results = await Promise.allSettled([
    scrapeKHA(),
    scrapeMOHW(),
    scrapeNHIS(),
    scrapeHIRA(),
  ])

  return results
    .filter((r): r is PromiseFulfilledResult<CrawledNotice[]> => r.status === 'fulfilled')
    .flatMap((r) => r.value)
}

export { scrapeKHA, scrapeMOHW, scrapeNHIS, scrapeHIRA }
