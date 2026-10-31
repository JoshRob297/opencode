import { ProviderID, type ModelID, type ProviderOptions } from "../schema/index.js"
import type { ProviderPackage } from "../provider-package.js"
import { AuthOptions, type ProviderAuthOption } from "../route/auth-options.js"
import type { RouteDefaultsInput } from "../route/client.js"
import { AnthropicMessages } from "../protocols/anthropic-messages.js"
import { Gemini } from "../protocols/gemini.js"
import { OpenAICompatibleChat } from "../protocols/openai-compatible-chat.js"
import { OpenAIResponses } from "../protocols/openai-responses.js"
import { withOpenAIOptions, type OpenAIProviderOptionsInput } from "./openai-options.js"

export type ChatOptionsInput = OpenAIProviderOptionsInput
export type ResponsesOptionsInput = OpenAIProviderOptionsInput
export type MessagesOptionsInput = AnthropicMessages.ProviderOptionsInput
export type GeminiOptionsInput = Gemini.ProviderOptionsInput

export type Config = Omit<RouteDefaultsInput, "providerOptions"> &
  ProviderAuthOption<"optional"> & {
    /** Overrides the selected API's base URL, including its version prefix. */
    readonly baseURL?: string
    readonly providerOptions?: ProviderOptions
  }

export type Settings<Options = {}> = ProviderPackage.Settings &
  Options & {
    readonly apiKey?: string | false
    readonly baseURL?: string
  }

/**
 * Zen and Go serve each model over one of four API families under one inference root:
 * https://opencode.ai/v2/docs/console/api/inference/
 */
export const textAPIs = (provider: string, root: string) => {
  const id = ProviderID.make(provider)
  const chatRoute = OpenAICompatibleChat.route.with({ id: `${provider}-chat`, provider: id })
  const responsesRoute = OpenAIResponses.route.with({ id: `${provider}-responses`, provider: id })
  const messagesRoute = AnthropicMessages.route.with({ id: `${provider}-messages`, provider: id })
  const geminiRoute = Gemini.route.with({ id: `${provider}-gemini`, provider: id })

  const configure = (input: Config) => {
    const { apiKey: _apiKey, auth: _auth, baseURL, ...defaults } = input
    // Both services document bearer auth for every API family.
    const auth = AuthOptions.bearer(input, "OPENCODE_API_KEY")
    const endpoint = (path: string) => ({ baseURL: baseURL ?? `${root}/${path}` })
    return {
      auth,
      chat: (modelID: string | ModelID) =>
        chatRoute.with({ ...defaults, endpoint: endpoint("openai/v1"), auth }).model<ChatOptionsInput>({ id: modelID }),
      responses: (modelID: string | ModelID) =>
        responsesRoute
          .with({ ...withOpenAIOptions(String(modelID), defaults), endpoint: endpoint("openai/v1"), auth })
          .model<ResponsesOptionsInput>({ id: modelID }),
      messages: (modelID: string | ModelID) =>
        messagesRoute
          .with({ ...defaults, endpoint: endpoint("anthropic/v1"), auth })
          .model<MessagesOptionsInput>({ id: modelID }),
      gemini: (modelID: string | ModelID) =>
        geminiRoute
          .with({ ...defaults, endpoint: endpoint("google/v1beta"), auth })
          .model<GeminiOptionsInput>({ id: modelID }),
    }
  }

  return { id, routes: [chatRoute, responsesRoute, messagesRoute, geminiRoute], configure }
}

export const config = ({ apiKey, baseURL, body, headers, ...providerOptions }: Settings = {}) => ({
  apiKey,
  baseURL,
  headers,
  http: body === undefined ? undefined : { body },
  providerOptions,
})

export * as OpenCodeShared from "./opencode-shared.js"
