import { describe, expect } from "bun:test"
import { Effect } from "effect"
import { ai } from "../../src/effect.js"
import { OpenCodeGo } from "../../src/providers.js"
import { LLMClient } from "../../src/route.js"
import { type Call, dynamicResponse, json, observe } from "../lib/http.js"
import { it } from "../lib/effect.js"

const go = OpenCodeGo.configure({ apiKey: "go-key" })

describe("OpenCode Go provider", () => {
  it.effect("sends each API to Go's base URL with bearer auth and the caller's session header", () =>
    Effect.gen(function* () {
      const calls: Array<Call> = []
      const layer = dynamicResponse((input) =>
        observe(calls, input).pipe(Effect.map(() => json(input, { error: { message: "fixture" } }, { status: 400 }))),
      )
      const cases = [
        { model: go.model("glm-5.3-flash"), url: "https://opencode.ai/inference/go/openai/v1/chat/completions" },
        { model: go.responses("gpt-6-luna"), url: "https://opencode.ai/inference/go/openai/v1/responses" },
        { model: go.messages("claude-haiku-5-5"), url: "https://opencode.ai/inference/go/anthropic/v1/messages" },
        {
          model: go.gemini("gemini-4-argon"),
          url: "https://opencode.ai/inference/go/google/v1beta/models/gemini-4-argon:streamGenerateContent?alt=sse",
        },
      ]
      for (const item of cases) {
        expect(item.model.provider).toBe("opencode-go")
        yield* LLMClient.generate(
          ai.request({
            model: item.model,
            prompt: "Hello",
            http: { headers: { "x-opencode-session": "ses_fixture" } },
          }),
        ).pipe(Effect.exit, Effect.provide(layer))
      }
      expect(calls.map((call) => call.url)).toEqual(cases.map((item) => item.url))
      for (const call of calls) {
        expect(call.headers.get("authorization")).toBe("Bearer go-key")
        expect(call.headers.get("x-opencode-session")).toBe("ses_fixture")
      }
      expect(JSON.parse(calls[0].body)).toMatchObject({ model: "glm-5.3-flash", stream: true })
      expect(JSON.parse(calls[1].body)).toMatchObject({ model: "gpt-6-luna", store: false })
      expect(JSON.parse(calls[2].body)).toMatchObject({ model: "claude-haiku-5-5" })
      expect(JSON.parse(calls[3].body)).toMatchObject({ contents: [{ role: "user", parts: [{ text: "Hello" }] }] })
    }),
  )
})
