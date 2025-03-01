export default {
  "kind": "collectionType",
  "collectionName": "Client Credential",
  "info": {
    "singularName": "client-credential",
    "pluralName": "client-credentials",
    "displayName": "Client Credential"
  },
  "attributes": {
    "client_name": {
      "type": "string"
    },
    "client_id": {
      "type": "string"
    },
    "client_secret": {
      "type": "string"
    },
    "grants": {
      "type": "json"
    },
    "redirectUris": {
      "type": "json"
    },
    "actions": {
      "type": "json"
    }
  }
}
