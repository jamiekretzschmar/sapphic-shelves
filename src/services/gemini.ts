import { GoogleGenAI, Type } from "@google/genai";
import { fetchBookCover } from './coverService';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface Author {
  id: string;
  name: string;
  biography: string;
  bibliography: AuthorBook[];
  isFavorite?: boolean;
  hasUpcomingRelease?: boolean;
  lastPulseCheck?: string;
}

export interface AuthorBook {
  title: string;
  year: number;
  releaseDate?: string; // YYYY-MM-DD format
  description: string;
}

export interface DiscoveredBook {
  title: string;
  author: string;
  description: string;
  coverUrl?: string;
  releaseDate?: string;
  genre?: string;
  publicationYear?: number;
  rating?: number;
}

export class QuotaExceededError extends Error {
  constructor(message: string = "You have exceeded your Gemini API quota. Please try again later.") {
    super(message);
    this.name = "QuotaExceededError";
  }
}

const isQuotaError = (error: any): boolean => {
  const message = error?.message || "";
  const status = error?.status || "";
  return message.includes("429") || message.includes("RESOURCE_EXHAUSTED") || status === "RESOURCE_EXHAUSTED";
};

const parseJson = (text: string) => {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]);
  }
  
  const genericMatch = text.match(/```\s*([\s\S]*?)\s*```/);
  if (genericMatch) {
    return JSON.parse(genericMatch[1]);
  }

  // Fallback: try to find the first '{' or '[' and the last '}' or ']'
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  
  let start = -1;
  let end = -1;
  
  if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = lastBrace;
  } else if (firstBracket !== -1 && lastBracket !== -1) {
    start = firstBracket;
    end = lastBracket;
  }
  
  if (start !== -1 && end !== -1) {
    return JSON.parse(text.substring(start, end + 1));
  }
  
  return JSON.parse(text);
};

export const searchForAuthor = async (authorName: string): Promise<Author | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find information about the author "${authorName}", specifically focusing on their sapphic or queer literature if applicable. Provide a short biography and a list of their books with publication years, exact release dates, and short descriptions. 
      
      You MUST return your response as a valid JSON object with the following structure:
      {
        "name": "Author Name",
        "biography": "Short biography...",
        "bibliography": [
          { "title": "Book Title", "year": 2023, "releaseDate": "2023-05-15", "description": "Short description..." }
        ]
      }
      Do not include any markdown formatting or other text outside the JSON object.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    if (response.text) {
      try {
        const data = parseJson(response.text);
        return {
          id: crypto.randomUUID(),
          ...data,
        };
      } catch (parseError) {
        console.error("Failed to parse author JSON:", parseError, response.text);
        return null;
      }
    }
    return null;
  } catch (error) {
    if (isQuotaError(error)) throw new QuotaExceededError();
    console.error("Error searching for author:", error);
    return null;
  }
};

export const searchForNovels = async (query: string): Promise<DiscoveredBook[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for new or upcoming novels based on this query: "${query}". Focus on sapphic, queer, or LGBTQ+ literature if relevant. 
      Return ONLY a JSON array of objects with this structure:
      [
        {
          "title": "Book Title",
          "author": "Author Name",
          "description": "Short description...",
          "coverUrl": "https://example.com/image.jpg",
          "releaseDate": "YYYY-MM-DD",
          "genre": "Fantasy",
          "publicationYear": 2024,
          "rating": 4.5
        }
      ]
      
      CRITICAL: For "coverUrl", find a valid, high-quality image URL. 
      Prefer OpenLibrary (https://covers.openlibrary.org/b/title/{title}-{author}-L.jpg) or direct image links from reliable sources. 
      If you cannot find a specific, accurate cover URL, set it to null. 
      Do not include markdown formatting outside the JSON object.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    const text = response.text || "[]";
    try {
      return parseJson(text);
    } catch (parseError) {
      console.error("Failed to parse novels JSON:", parseError, text);
      return [];
    }
  } catch (error) {
    if (isQuotaError(error)) throw new QuotaExceededError();
    console.error("Error searching for novels:", error);
    return [];
  }
};

export const findLocalBookstores = async (location: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find good local bookstores near ${location} that might carry queer or sapphic literature.`,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });
    return {
      text: response.text || "No results found.",
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    if (isQuotaError(error)) throw new QuotaExceededError();
    console.error("Error finding bookstores:", error);
    return { text: "An error occurred while searching.", groundingChunks: [] };
  }
};

export const analyzeBookshelf = async (base64Data: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: "Analyze this image of a bookshelf. Extract all the visible book titles and their authors. Format the output as a clean markdown list. If you notice any queer or sapphic literature, highlight it with a brief note." }
        ]
      }
    });
    return response.text || "No books found.";
  } catch (error) {
    if (isQuotaError(error)) throw new QuotaExceededError();
    console.error("Error analyzing bookshelf:", error);
    return "An error occurred while analyzing the image.";
  }
};

export const getAuthorPulse = async (authorName: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Do a deep-research dive on the author "${authorName}". Find their latest news, upcoming book releases, recent interviews, or any relevant updates in the literary world. Format as a concise markdown summary.`,
      config: { tools: [{ googleSearch: {} }] }
    });
    return response.text || "No recent updates found.";
  } catch (error) {
    if (isQuotaError(error)) throw new QuotaExceededError();
    console.error("Error getting author pulse:", error);
    return "An error occurred while fetching the author's pulse.";
  }
};

export const checkUpcomingReleases = async (authorName: string, currentDate: string): Promise<{ hasUpcoming: boolean, newBooks: AuthorBook[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for upcoming book releases by the author "${authorName}" that are scheduled to be published AFTER ${currentDate}. 
      Return ONLY a JSON object with this structure:
      {
        "hasUpcoming": true/false,
        "newBooks": [
          { "title": "Book Title", "year": 2026, "releaseDate": "YYYY-MM-DD", "description": "Short description..." }
        ]
      }
      If there are no upcoming releases found, set hasUpcoming to false and newBooks to an empty array. Do not include markdown formatting outside the JSON object.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      }
    });
    const text = response.text || '{"hasUpcoming":false,"newBooks":[]}';
    try {
      return parseJson(text);
    } catch (parseError) {
      console.error("Failed to parse upcoming releases JSON:", parseError, text);
      return { hasUpcoming: false, newBooks: [] };
    }
  } catch (error) {
    if (isQuotaError(error)) throw new QuotaExceededError();
    console.error("Error checking upcoming releases:", error);
    return { hasUpcoming: false, newBooks: [] };
  }
};

export const enrichBookData = async (title: string, author: string): Promise<{ coverUrl?: string, description?: string, publicationYear?: number, genre?: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find the ISBN (10 or 13), a short description, the publication year, and the primary genre for the book "${title}" by ${author}. 
      Return ONLY a JSON object with this structure:
      {
        "isbn": "ISBN-10 or ISBN-13",
        "description": "A short description...",
        "publicationYear": 2023,
        "genre": "Fantasy"
      }
      If you cannot find the ISBN, set it to null.`,
      config: {
        responseMimeType: "application/json",
      },
    });
    const text = response.text || "{}";
    let data;
    try {
      data = parseJson(text);
    } catch (parseError) {
      console.error("Failed to parse enriched book JSON:", parseError, text);
      return {};
    }

    const coverUrl = await fetchBookCover(title, author, data.isbn);

    return {
      coverUrl: coverUrl || undefined,
      description: data.description,
      publicationYear: data.publicationYear,
      genre: data.genre
    };
  } catch (error) {
    if (isQuotaError(error)) throw new QuotaExceededError();
    console.error("Error enriching book:", error);
    return {};
  }
};

export const suggestBookTags = async (title: string, author: string, description?: string): Promise<Record<string, string[]>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest relevant tags for the book "${title}" by ${author}. 
      ${description ? `Here is the description: ${description}` : ''}
      
      CRITICAL INSTRUCTIONS:
      - Group the tags into categories: "Genre", "Trope", "Setting", and "Vibe".
      - Provide 2-3 tags per category.
      - Return ONLY a JSON object where keys are categories and values are arrays of strings.
      - Example: {"Genre": ["Fantasy", "Romance"], "Trope": ["Enemies to Lovers", "Slow Burn"], "Setting": ["High Fantasy", "Magic School"], "Vibe": ["Angsty", "Dark"]}
      Do not include markdown formatting outside the JSON object.`,
      config: {
        responseMimeType: "application/json",
      },
    });
    const text = response.text || "{}";
    try {
      return parseJson(text);
    } catch (parseError) {
      console.error("Failed to parse suggested tags JSON:", parseError, text);
      return {};
    }
  } catch (error) {
    if (isQuotaError(error)) throw new QuotaExceededError();
    console.error("Error suggesting tags:", error);
    return {};
  }
};

export const analyzeBookshelfForIngestion = async (base64Data: string, mimeType: string): Promise<{ title: string, author: string, genre?: string, publicationYear?: number }[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: `Analyze this image of a bookshelf or book stack. Extract all visible book titles and their authors. If possible, also identify the primary genre and publication year for each book.
          Return ONLY a JSON array of objects with this structure:
          [
            { "title": "Book Title", "author": "Author Name", "genre": "Fantasy", "publicationYear": 2023 }
          ]` }
        ]
      },
      config: {
        responseMimeType: "application/json",
      }
    });
    const text = response.text || "[]";
    try {
      return parseJson(text);
    } catch (parseError) {
      console.error("Failed to parse bookshelf ingestion JSON:", parseError, text);
      return [];
    }
  } catch (error) {
    if (isQuotaError(error)) throw new QuotaExceededError();
    console.error("Error analyzing bookshelf for ingestion:", error);
    return [];
  }
};

export const generateBookCover = async (title: string, author: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `A book cover for "${title}" by ${author}. High quality, professional book cover design, no text.` }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4",
          imageSize: "1K"
        }
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Failed to generate cover", error);
    return null;
  }
};

export const findResources = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for current and upcoming resources for queer and sapphic literature. Include: 1. Available ARCs (Advance Reader Copies) 2. Writing contests or submission calls 3. Free queer editions or giveaways. Format as a beautifully structured markdown document.`,
      config: { tools: [{ googleSearch: {} }] }
    });
    return response.text || "No resources found.";
  } catch (error) {
    if (isQuotaError(error)) throw new QuotaExceededError();
    console.error("Error finding resources:", error);
    return "An error occurred while fetching resources.";
  }
};

export const getRecommendations = async (followedAuthors: string[], readBooks: DiscoveredBook[]): Promise<DiscoveredBook[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on the user's followed authors: ${followedAuthors.join(', ')} and previously read books: ${readBooks.map(b => b.title).join(', ')}, suggest 5 new sapphic/queer novels they might enjoy.
      
      Return ONLY a JSON array of objects with this structure:
      [
        {
          "title": "Book Title",
          "author": "Author Name",
          "description": "Short description...",
          "coverUrl": "...",
          "releaseDate": "YYYY-MM-DD",
          "genre": "...",
          "publicationYear": 2024,
          "rating": 4.5
        }
      ]
      Do not include markdown formatting outside the JSON object.`,
      config: {
        responseMimeType: "application/json",
      }
    });
    const text = response.text || "[]";
    try {
      return parseJson(text);
    } catch (parseError) {
      console.error("Failed to parse recommendations JSON:", parseError, text);
      return [];
    }
  } catch (error) {
    if (isQuotaError(error)) throw new QuotaExceededError();
    console.error("Error getting recommendations:", error);
    return [];
  }
};
