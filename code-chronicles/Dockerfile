
# 1. Install dependencies only when needed
FROM node:20-alpine AS deps

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
# libc6-compat is often needed for some native modules
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json ./
RUN npm ci

# 2. Rebuild the source code only when needed
FROM node:20-alpine AS builder

# Define arguments for build time variables
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
# Persist them as environment variables during the build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

# Build the Next.js application
RUN npm run build

# 3. Production image, copy all the files and run next
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Environment variables must be passed at runtime, but we can set default PORT
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

USER nextjs

EXPOSE 3000

# We need to run the custom server. 
# Since we are using "output: standalone", the server is inside server.js (Next.js default)
# BUT we have a CUSTOM server in server/multiplayer.ts.
# The standalone build primarily captures dependencies for the standard Next.js server.
# For a custom server, we might need to copy our compiled custom server and run that.
# However, modifying the build process to output a custom standalone entry is complex.
#
# SIMPLIFIED STRATEGY FOR STANDALONE + CUSTOM SERVER:
# The standalone output includes minimal node_modules.
# We will run our custom server file using 'node'. 
# Since 'server/multiplayer.ts' is TypeScript, we need to compile it or run it with ts-node (bad for prod) or use 'tsx'.
# 
# A better approach for Docker + Custom Server is often NOT to use standalone, or to ensure custom server is compiled.
# Let's try to keep it simple: Use 'npm start' which we will define to run 'tsx server/multiplayer.ts'.
# And we WON'T use standalone mode in next.config.ts (it wasn't there anyway).
# So we need to copy node_modules.

FROM node:20-alpine AS runner-simple
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server ./server

# Change permission
RUN chown -R nextjs:nodejs /app/.next

USER nextjs

EXPOSE 3000

# Run the custom server using npm start (which will use tsx or node)
CMD ["npm", "start"]
