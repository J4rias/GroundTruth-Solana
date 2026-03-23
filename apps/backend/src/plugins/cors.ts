import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { env } from '../config/env.js';

export const corsPlugin = fp(async (fastify) => {
  await fastify.register(cors, {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'OPTIONS'],
  });
});
