# Exa

**Use for:** Semantic web search, content extraction, research

## Endpoints

| Operation | Method | Path |
|-----------|--------|------|
| Search | POST | `search` |
| Extract content | POST | `contents` |

## Search

**POST `search`**

```json
{
  "query": "your search query",
  "numResults": 10,
  "type": "auto",
  "contents": {
    "text": true,
    "livecrawl": "always"
  }
}
```

| Parameter | Description | Default |
|-----------|-------------|---------|
| `query` | Natural language search query | required |
| `numResults` | Number of results (1-100) | 10 |
| `type` | `auto`, `neural`, `keyword` | `auto` |
| `contents` | Include page content | omit for URLs only |
| `contents.livecrawl` | Freshness: `always`, `preferred`, `fallback`, `never` | `never` |
| `includeDomains` | Limit to specific domains | none |
| `excludeDomains` | Exclude specific domains | none |

**Search types:**
- `auto` - Let Exa choose (recommended)
- `neural` - Semantic/meaning-based (best for niche content)
- `keyword` - Traditional keyword matching

## Extract Content

**POST `contents`**

```json
{
  "urls": ["https://example.com", "https://another.com"],
  "text": true,
  "livecrawl": "always"
}
```

| Parameter | Description |
|-----------|-------------|
| `urls` | Array of URLs to extract |
| `text` | Return text content (boolean) |
| `livecrawl` | `always` (recommended), `fallback`, `never` |

## Tips

- **Always use `livecrawl: "always"`** for fresh content
- **Exa excels at semantic search** - natural language queries work great
- **For JS-heavy sites** (Notion, React apps), content may be limited

## Full API Docs

https://docs.exa.ai
