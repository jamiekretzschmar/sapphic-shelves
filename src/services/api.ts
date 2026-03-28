export const fetchBooksByAuthor = async (authorName: string) => {
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=inauthor:"${encodeURIComponent(authorName)}"&maxResults=40&orderBy=newest`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error(`Failed to fetch books for author ${authorName}:`, error);
    return [];
  }
};
