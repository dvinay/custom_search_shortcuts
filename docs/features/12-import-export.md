# Import/Export Configuration

Backup and share your entire configuration, or just a selection of shortcuts, as a portable JSON file.

## Export

1. Go to the **Options** page

2. Click **Export Configuration**

   ![Export Configuration button](../images/features/import-export-01.png)

3. Save the generated JSON file to your computer

   ![Saving the exported JSON file](../images/features/import-export-02.png)

### Exporting a Selection Only

1. In **Options → Search URLs**, select specific shortcuts using their checkboxes
2. Use the bulk action bar's **Export** option to export only the selected shortcuts

   ![Exporting a selection of shortcuts](../images/features/import-export-03.png)

## Import

1. Go to the **Options** page

2. Click **Import Configuration**

   ![Import Configuration button](../images/features/import-export-04.png)

3. Select your previously exported JSON file

   ![Choosing a JSON file to import](../images/features/import-export-05.png)

4. Your searches, variables, environments, categories, favorites, trash, and settings are restored

   ![Configuration restored after import](../images/features/import-export-06.png)

## Configuration Format

```json
{
  "urls": [
    {
      "id": "custom-search-1234567890",
      "name": "Google",
      "url": "https://www.google.com/search?q=%s",
      "category": "cat-1234567890"
    }
  ],
  "variables": [
    {
      "name": "api_host",
      "defaultValue": "api.example.com"
    }
  ],
  "environments": [
    {
      "id": "env-1234567890",
      "name": "Dev",
      "values": [
        {
          "key": "api_host",
          "value": "dev-api.example.com"
        }
      ]
    }
  ],
  "categories": [
    {
      "id": "cat-1234567890",
      "name": "Dev Tools",
      "icon": "🔧"
    }
  ],
  "trash": [
    {
      "id": "custom-search-9876543210",
      "name": "Old Search",
      "url": "https://example.com/search?q=%s",
      "deletedAt": 1714567890000
    }
  ],
  "favorites": [
    "custom-search-1234567890"
  ],
  "settings": {
    "trashDays": 15,
    "tabPosition": "next",
    "defaultCategory": ""
  },
  "keyboardShortcuts": [
    {
      "urlId": "custom-search-1234567890",
      "shortcut": "Ctrl+Shift+G"
    }
  ]
}
```

## Related Features

- [Custom Search Engines](01-custom-search-engines.md)
- [Environment Variables & Dynamic URL Templates](02-environment-variables.md)
- [Productivity Features](09-productivity.md)
