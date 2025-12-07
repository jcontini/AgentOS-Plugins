# Raindrop

**Use for:** Bookmark management, collections, saving links

## Endpoints

| Operation | Method | Path |
|-----------|--------|------|
| List collections | GET | `rest/v1/collections` |
| Get collection | GET | `rest/v1/collections/{id}` |
| Create collection | POST | `rest/v1/collections` |
| List bookmarks | GET | `rest/v1/raindrops/{collection_id}` |
| Add bookmark | POST | `rest/v1/raindrops` |
| Add multiple | POST | `rest/v1/raindrops/batch` |
| Delete bookmark | DELETE | `rest/v1/raindrops/{id}` |

## Special Collection IDs

| ID | Collection |
|----|------------|
| `0` | All bookmarks |
| `-1` | Unsorted |
| `-99` | Trash |

## Create Collection

```json
{
  "title": "My Collection",
  "public": false
}
```

**Nested collection:**
```json
{
  "title": "Subfolder",
  "parent": { "$id": 12345 },
  "public": false
}
```

## Add Bookmark

```json
{
  "link": "https://example.com",
  "title": "Optional custom title",
  "collectionId": 12345,
  "tags": ["reading", "tech"]
}
```

## Add Multiple Bookmarks

```json
{
  "items": [
    { "link": "https://site1.com" },
    { "link": "https://site2.com" }
  ],
  "collectionId": 12345
}
```

## Full API Docs

https://developer.raindrop.io
