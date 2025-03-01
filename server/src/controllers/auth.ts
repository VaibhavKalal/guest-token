import type {Core} from '@strapi/strapi';

const controller = ({strapi}: { strapi: Core.Strapi }) => ({
  async token(ctx) {
    ctx.body = await strapi
      .plugin('guest-token')
      .service('auth')
      .getToken(ctx);
  },
  async refreshToken(ctx) {
    ctx.body = await strapi
      .plugin('guest-token')
      .service('auth')
      .getRefreshToken(ctx);
  }
});

export default controller;
