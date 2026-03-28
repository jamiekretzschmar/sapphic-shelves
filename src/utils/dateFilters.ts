export const filterUpcomingAndRecentBooks = (booksArray: any[]) => {
  if (!booksArray || !Array.isArray(booksArray)) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  return booksArray.filter(book => {
    const publishedDateStr = book.volumeInfo?.publishedDate;
    if (!publishedDateStr) return false;

    let publishedDate: Date;

    // Handle different date formats: YYYY, YYYY-MM, YYYY-MM-DD
    if (publishedDateStr.length === 4) {
      publishedDate = new Date(`${publishedDateStr}-01-01`);
    } else if (publishedDateStr.length === 7) {
      publishedDate = new Date(`${publishedDateStr}-01`);
    } else {
      publishedDate = new Date(publishedDateStr);
    }

    if (isNaN(publishedDate.getTime())) return false;

    // A) Published strictly within the last 30 days
    const isRecent = publishedDate >= thirtyDaysAgo && publishedDate <= today;
    
    // B) Published in the future
    const isFuture = publishedDate > today;

    return isRecent || isFuture;
  });
};
