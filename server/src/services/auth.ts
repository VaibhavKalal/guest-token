import type {Core} from '@strapi/strapi';
import OAuth2Server from '@node-oauth/oauth2-server';
import model from "../utils/model";

const MODEL_CLIENT_CREDENTIALS = 'plugin::guest-token.client-credential';

const Request = OAuth2Server.Request;
const Response = OAuth2Server.Response;

const service = ({strapi}: { strapi: Core.Strapi }) => {
  const oauth2Server = new OAuth2Server({
    model: model({ strapi }),
    accessTokenLifetime: strapi.config.get('plugin::guest-token.accessTokenLifetime'),
    refreshTokenLifetime: strapi.config.get('plugin::guest-token.refreshTokenLifetime'),
    alwaysIssueNewRefreshToken: true,
    allowEmptyState: true,
    allowExtendedTokenAttributes: true,
  });

  return {
    getToken: async (ctx) => {
      const request = new Request({
        method: "POST",
        query: {},
        body: ctx.request.body,
        headers: ctx.req.headers,
      });

      const response = new Response({
        headers: {},
      });

      const token = await oauth2Server.token(request, response, {
        requireClientAuthentication: {
          // whether client needs to provide client_secret
          authorization_code: false,
        },
      });


      return {
        access_token: token.accessToken,
        access_token_expires_at: token.accessTokenExpiresAt,
        token_type: "Bearer",
        guest_id: token.guest_id,
        created_at: new Date(),
        expires_in:
          strapi.config.get("constants.ACCESS_TOKEN_LIFETIME") ||
          60 * 60 * 24 * 15,
      };
    },
    getRefreshToken: async (ctx) => {
      const request = new Request({
        method: "POST",
        query: {},
        body: ctx.request.body,
        headers: ctx.req.headers,
      });

      const response = new Response({
        headers: {},
      });

      await oauth2Server.authenticate(request, response);

      const token = await oauth2Server.token(request, response, {
        requireClientAuthentication: {
          // whether client needs to provide client_secret
          authorization_code: false,
        },
      });

      return {
        access_token: token.accessToken,
        access_token_expires_at: token.accessTokenExpiresAt,
        token_type: "Bearer",
        refresh_token: token.refreshToken,
        guest_id: token.guest_id,
        created_at: new Date(),
        expires_in:
          strapi.config.get("constants.ACCESS_TOKEN_LIFETIME") ||
          60 * 60 * 24 * 15,
      };
    },
    authenticate: async (ctx) => {
      const request = new Request({
        method: "POST",
        query: {},
        body: ctx.request.body,
        headers: ctx.req.headers,
      });

      const response = new Response({
        headers: {},
      });

      return await oauth2Server.authenticate(request, response);
    },
    getActions: async (client) => {
      const clientApp = await strapi.db.query(MODEL_CLIENT_CREDENTIALS).findOne(
        {
          where: {
            $and: [
              {
                client_id: client.clientId,
              },
              {
                client_secret: client.clientSecret,
              },
            ],
          },
        }
      );

      if (!clientApp || !Array.isArray(clientApp.actions)) {
        return [];
      }

      return clientApp.actions?.map((action) => ({action}));
    }
  }
};

export default service;
