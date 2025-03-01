export default {
  "kind": "collectionType",
  "collectionName": "Token Store",
  "info": {
    "singularName": "token-store",
    "pluralName": "token-stores",
    "displayName": "Token Store"
  },
  "attributes": {
    "access_token": {
      "type": "string"
    },
    "access_token_expires_at": {
      "type": "datetime"
    },
    "refresh_token": {
      "type": "string"
    },
    "refresh_token_expires_at": {
      "type": "datetime"
    },
    "client": {
      "type": "json"
    },
    "user": {
      "type": "json"
    },
    "guest_id": {
      "type": "string"
    }
  }
}

