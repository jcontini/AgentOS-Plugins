/**
 * Search Result Item Component
 * 
 * Renders a single web search result with title, URL, and optional snippet.
 * Uses the Text primitive for consistent overflow and truncation handling.
 * Used by the Browser app's search view within a list component.
 * 
 * @example
 * ```yaml
 * - component: list
 *   data:
 *     capability: web_search
 *   item_component: items/search-result
 *   item_props:
 *     title: "{{title}}"
 *     url: "{{url}}"
 *     snippet: "{{snippet}}"
 * ```
 */

import React from 'react';
import { Text } from '../text';

interface SearchResultProps {
  /** Result title - displayed prominently */
  title: string;
  /** Result URL - displayed below title */
  url: string;
  /** Optional snippet/description */
  snippet?: string;
  /** Maximum lines for title (default: 2) */
  titleMaxLines?: number;
  /** Overflow behavior for URL (default: ellipsis) */
  urlOverflow?: 'truncate' | 'ellipsis' | 'wrap';
}

export function SearchResult({
  title,
  url,
  snippet,
  titleMaxLines = 2,
  urlOverflow = 'ellipsis',
}: SearchResultProps) {
  return (
    <div className="search-result">
      <Text
        variant="title"
        as="a"
        href={url}
        target="_blank"
        overflow="ellipsis"
        maxLines={titleMaxLines}
        className="search-result-title"
      >
        {title}
      </Text>
      <Text variant="url" overflow={urlOverflow} maxLines={1} className="search-result-url">
        {url}
      </Text>
      {snippet && (
        <Text variant="body" maxLines={3} className="search-result-snippet" as="p">
          {snippet}
        </Text>
      )}
    </div>
  );
}

export default SearchResult;
