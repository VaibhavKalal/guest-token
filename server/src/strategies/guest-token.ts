import type {Context} from 'koa';
import {castArray} from 'lodash/fp';
import {errors} from '@strapi/utils';

const {UnauthorizedError, ForbiddenError} = errors;

const getService = (name) => strapi.service(`plugin::guest-token.${name}`);

/**
 * Authenticate the validity of the token
 //  */
const authenticate = async (ctx: Context) => {
  const authentication = await getService('auth').authenticate(ctx);
  if (!authentication) {
    return {authenticated: false};
  }

  const permissions = await getService('auth').getActions(authentication.client);

  const ability = await strapi.contentAPI.permissions.engine.generateAbility(permissions);

  return {authenticated: true, ability, credentials: authentication};
};

/**
 * Verify the token has the required abilities for the requested scope
 *
 *  @type {import('.').VerifyFunction}
 */
const verify = (auth: any, config: any) => {
  const {credentials: authentication, ability} = auth;

  if (!authentication) {
    throw new UnauthorizedError();
  }

  if (!ability) {
    throw new ForbiddenError();
  }

  const scopes = castArray(config.scope);

  const isAllowed = scopes.every((scope) => ability.can(scope));

  if (isAllowed) {
    return;
  }

  throw new ForbiddenError();
};

export const name = 'guest-token';

export default {
  name: 'guest-token',
  authenticate,
  verify,
};
