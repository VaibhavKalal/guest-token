// See https://oauth2-server.readthedocs.io/en/latest/model/spec.html for what you can do with this
import crypto from "crypto";
import type {
  ClientCredentialsModel,
  RefreshTokenModel,
  AuthorizationCodeModel
} from '@node-oauth/oauth2-server'

const MODEL_CLIENT_CREDENTIALS = 'plugin::guest-token.client-credential';
const MODEL_TOKEN_STORE = 'plugin::guest-token.token-store';

const db = {
  // Here is a fast overview of what your db model should look like
  authorizationCode: {
    authorizationCode: "", // A string that contains the code
    expiresAt: new Date(), // A date when the code expires
    redirectUri: "", // A string of where to redirect to with this code
    client: {}, // See the client section
    user: {}, // Whatever you want... This is where you can be flexible with the protocol
  },
  client: {
    // Application wanting to authenticate with this server
    clientId: "myClientId", // Unique string representing the client
    clientSecret: "myClientSecret", // Secret of the client; Can be null
    grants: [], // Array of grants that the client can use (ie, `authorization_code`)
    redirectUris: [], // Array of urls the client is allowed to redirect to
  },
  token: {
    accessToken: "", // Access token that the server created
    accessTokenExpiresAt: new Date(), // Date the token expires
    client: {}, // Client associated with this token
    user: {}, // User associated with this token
  },
} as any;

export default ({strapi}) => ({
  getClient: async (clientId, clientSecret) => {
    const client = await strapi.db.query(MODEL_CLIENT_CREDENTIALS).findOne(
      {
        where: {
          $and: [
            {
              client_id: clientId,
            },
            {
              client_secret: clientSecret,
            },
          ],
        },
      }
    );

    if (!client?.id) {
      return null;
    }

    return {
      clientId: client.client_id,
      clientSecret: client.client_secret,
      grants: client.grants,
      redirectUris: client.redirectUris,
    };
  },
  saveToken: async (token, client, user) => {
    const guestId = user?.guest_id || crypto.randomUUID();

    let tokenStore = await strapi.db.query(MODEL_TOKEN_STORE).create(
      {
        data: {
          access_token: token.accessToken,
          access_token_expires_at: token.accessTokenExpiresAt,
          refresh_token: token.refreshToken, // NOTE this is only needed if you need refresh tokens down the line
          refresh_token_expires_at: token.refreshTokenExpiresAt,
          client: client,
          user: user,
          guest_id: guestId,
        },
      }
    );

    return {
      accessToken: tokenStore.access_token,
      accessTokenExpiresAt: new Date(tokenStore.access_token_expires_at),
      refreshToken: tokenStore.refresh_token, // NOTE this is only needed if you need refresh tokens down the line
      refreshTokenExpiresAt: tokenStore.refresh_token_expires_at
        ? new Date(tokenStore.refresh_token_expires_at)
        : null,
      client: tokenStore.client,
      user: {
        guest_id: tokenStore.guest_id,
      },
      guest_id: tokenStore.guest_id,
    };
  },
  getAccessToken: async (token) => {
    /* This is where you select the token from the database where the code matches */
    const tokenStore = await strapi.db.query(MODEL_TOKEN_STORE).findOne(
      {
        where: {
          access_token: token,
        },
      }
    );

    if (!tokenStore?.id) {
      return false;
    }

    return {
      accessToken: tokenStore.access_token, // Access token that the server created
      accessTokenExpiresAt: new Date(tokenStore.access_token_expires_at), // Date the token expires
      client: tokenStore.client, // Client associated with this token
      user: {
        guest_id: tokenStore.guest_id,
      },
    };
  },
  getRefreshToken: async (token) => {
    /* Retrieves the token from the database */
    const tokenStore = await strapi.db.query(MODEL_TOKEN_STORE).findOne(
      {
        where: {
          access_token: token,
        },
      }
    );

    return {
      accessToken: tokenStore.access_token, // Access token that the server created
      accessTokenExpiresAt: new Date(tokenStore.access_token_expires_at), // Date the token expires
      refreshToken: "", // NOTE this is only needed if you need refresh tokens down the line
      refreshTokenExpiresAt: null,
      client: tokenStore.client,
      user: {
        guest_id: tokenStore.guest_id,
      }, // User associated with this token
    };
  },
  revokeToken: async (token) => {
    /* Delete the token from the database */
    if (!token) return false;

    await strapi.db.query(MODEL_TOKEN_STORE).deleteMany({
      where: {
        access_token: token.accessToken
      },
    });
    return new Promise((resolve) => resolve(true));
  },
  generateAuthorizationCode: (client, user, scope) => {
    /*
    For this to work, you are going have to hack this a little bit:
    1. navigate to the node_modules folder
    2. find the oauth_server folder. (node_modules/express-oauth-server/node_modules/oauth2-server)
    3. open lib/handlers/authorize-handler.js
    4. Make the following change (around line 136):

    AuthorizeHandler.prototype.generateAuthorizationCode = function (client, user, scope) {
      if (this.model.generateAuthorizationCode) {
        // Replace this
        //return promisify(this.model.generateAuthorizationCode).call(this.model, client, user, scope);
        // With this
        return this.model.generateAuthorizationCode(client, user, scope)
      }
      return tokenUtil.generateRandomToken();
    };
    */

    const seed = crypto.randomBytes(256);
    return crypto.createHash("sha1").update(seed).digest("hex");
  },
  saveAuthorizationCode: (code, client, user) => {
    /* This is where you store the access code data into the database */
    db.authorizationCode = {
      authorizationCode: code.authorizationCode,
      expiresAt: code.expiresAt,
      client: client,
      user: user,
    };

    return new Promise((resolve) =>
      resolve(
        Object.assign(
          {
            redirectUri: `${code.redirectUri}`,
          },
          db.authorizationCode
        )
      )
    );
  },
  getAuthorizationCode: (authorizationCode) => {
    /* this is where we fetch the stored data from the code */
    return new Promise((resolve) => {
      resolve(db.authorizationCode);
    });
  },
  revokeAuthorizationCode: (authorizationCode) => {
    /* This is where we delete codes */
    db.authorizationCode = {
      // DB Delete in this in memory example :)
      authorizationCode: "", // A string that contains the code
      expiresAt: new Date(), // A date when the code expires
      redirectUri: "", // A string of where to redirect to with this code
      client: null, // See the client section
      user: null, // Whatever you want... This is where you can be flexible with the protocol
    };
    const codeWasFoundAndDeleted = true; // Return true if code found and deleted, false otherwise
    return new Promise((resolve) => resolve(codeWasFoundAndDeleted));
  },
  verifyScope: (token, scope) => {
    /* This is where we check to make sure the client has access to this scope */
    const userHasAccess = true; // return true if this user / client combo has access to this resource
    return new Promise((resolve) => resolve(userHasAccess));
  },
  getUserFromClient: (token) => {
    return new Promise((resolve) => resolve({username: "username"}));
  },
} as unknown as ClientCredentialsModel | RefreshTokenModel | AuthorizationCodeModel);
