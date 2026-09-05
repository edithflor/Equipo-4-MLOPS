import { z } from "zod";

export const SearchQueryRequestSchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, "El query de búsqueda es obligatorio")
    .max(200, "El query de búsqueda es demasiado largo"),
});

export const SearchQuerySchema = z.object({
  terms: z.array(z.string().min(1)).min(1),
});

export const SearchResultItemSchema = z.object({
  id: z.string().uuid(),
  filename: z.string().min(1),
  mimetype: z.string().min(1),
  size: z.number().int().nonnegative(),
  url: z.string().min(1),
});

export const SearchResponseSchema = z.object({
  items: z.array(SearchResultItemSchema),
  total: z.number().int().nonnegative(),
});

export type ParsedSearchQuery = z.infer<typeof SearchQuerySchema>;
export type SearchResultItem = z.infer<typeof SearchResultItemSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

const andBoundaryPattern = /\bAND\b/i;
const malformedAndPattern = /(^AND\b|\bAND$|\bAND\s+AND\b)/i;
const unsupportedOperatorPattern = /\b(OR|NOT)\b/i;
const searchTermPattern = /^[\p{L}\p{N}_-]+$/u;

export function parseSearchQuery(input: unknown): ParsedSearchQuery {
  const { q } = SearchQueryRequestSchema.parse(input);
  const normalizedQuery = q.replace(/\s+/g, " ");

  if (
    malformedAndPattern.test(normalizedQuery) ||
    unsupportedOperatorPattern.test(normalizedQuery)
  ) {
    throw new z.ZodError([
      {
        code: "custom",
        message: "Query de búsqueda malformado",
        path: ["q"],
      },
    ]);
  }

  const rawTerms = andBoundaryPattern.test(normalizedQuery)
    ? normalizedQuery.split(/\s+AND\s+/i)
    : [normalizedQuery];
  const terms = Array.from(new Set(rawTerms.map((term) => term.trim().toLowerCase())));

  if (terms.some((term) => !searchTermPattern.test(term))) {
    throw new z.ZodError([
      {
        code: "custom",
        message: "Query de búsqueda malformado",
        path: ["q"],
      },
    ]);
  }

  return SearchQuerySchema.parse({ terms });
}

export interface SearchReader {
  searchImagesByCategories(query: ParsedSearchQuery): Promise<SearchResponse>;
}

export class SearchService {
  public constructor(private readonly searchReader: SearchReader) {}

  public async search(input: unknown): Promise<SearchResponse> {
    const query = parseSearchQuery(input);
    const response = await this.searchReader.searchImagesByCategories(query);
    return SearchResponseSchema.parse(response);
  }
}
