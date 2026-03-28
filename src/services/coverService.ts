export const getOpenLibraryCoverUrl = (isbn: string, size: 'S' | 'M' | 'L' = 'M'): string => {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg?default=false`;
};

export const getGoogleBooksCoverUrl = async (title: string, author: string): Promise<string | null> => {
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}&maxResults=1`);
    const data = await response.json();
    if (data.items?.[0]?.volumeInfo?.imageLinks) {
      return data.items[0].volumeInfo.imageLinks.thumbnail || data.items[0].volumeInfo.imageLinks.smallThumbnail || null;
    }
  } catch (error) {
    console.error("Error fetching cover from Google Books:", error);
  }
  return null;
};

export const fetchBookCover = async (title: string, author: string, isbn?: string): Promise<string | null> => {
  // 1. Try ISBN with Open Library
  if (isbn) {
    const openLibraryUrl = getOpenLibraryCoverUrl(isbn, 'L');
    try {
      const response = await fetch(openLibraryUrl, { method: 'HEAD' });
      if (response.ok) return openLibraryUrl;
    } catch (e) {
      console.error("Error checking Open Library cover:", e);
    }
  }

  // 2. Fallback to Google Books
  const googleUrl = await getGoogleBooksCoverUrl(title, author);
  if (googleUrl) return googleUrl;

  // 3. Fallback to Open Library by Title/Author (if ISBN not available or failed)
  // Open Library doesn't have a direct title/author cover API, but we can try to search for it.
  // For now, return null if all else fails.
  return null;
};
