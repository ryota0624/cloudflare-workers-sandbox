/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Router } from 'itty-router'
const router = Router()
const missingHandler = new Response('Not found.', { status: 404 })

router.get("/:id/:method", async (req, env) => {
  let id = env.COUNTER.idFromName(req.params?.id);
  let counter: Counter = env.COUNTER.get(id);
  let response = await counter.fetch(new Request(""))
  return new Response("Durable Object 'A' count: " + await response.text());
}).all('*', () => missingHandler) // catch any missed routes


export default {
  fetch: router.handle
}

// Durable Object

export class Counter implements DurableObject {
  state: any
  constructor(state, env) {
    this.state = state;
  }

  // Handle HTTP requests from clients.
  async fetch(request) {
    return Router()
    .all("/:id/increment", async (req) => {
      await this.increment()
      return new Response(await this.state.storage.get("value"))
    })
    .all("/:id/decrement", async (req) => {
      await this.decrement()
      return new Response(await this.state.storage.get("value"))
    })
    .all('*', () => missingHandler).handle(request);
  }

  async increment() {
    let value = await this.state.storage.get("value") || 0;
    ++value;
    await this.state.storage.put("value", value);
  }

  async decrement() {
    let value = await this.state.storage.get("value") || 0;
    --value;
    await this.state.storage.put("value", value);
  }
}
