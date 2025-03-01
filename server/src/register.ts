import type { Core } from '@strapi/strapi';
import guestToken from "./strategies/guest-token";

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.get("auth").register("content-api", guestToken);
};

export default register;
