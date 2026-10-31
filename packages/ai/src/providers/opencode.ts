import type { ModelID, ProviderOptions } from "../schema/index.js"
import type { ProviderPackage } from "../provider-package.js"
import type { OpenAIResponses } from "../protocols/openai-responses.js"
import { SystemOne } from "../protocols/system-one.js"
import { OpenCodeShared } from "./opencode-shared.js"

export type {
  ChatOptionsInput,
  Config,
  GeminiOptionsInput,
  MessagesOptionsInput,
  ResponsesOptionsInput,
  Settings,
} from "./opencode-shared.js"

const zen = OpenCodeShared.textAPIs("opencode", "https://opencode.ai/inference")

export const id = zen.id
export const routes = zen.routes

export const configure = (input: OpenCodeShared.Config = {}) => {
  const text = zen.configure(input)
  const decisionRoute = SystemOne.route.with({
    provider: id,
    providerMetadataKey: "opencode",
    endpoint: { baseURL: input.baseURL ?? "https://opencode.ai/inference/systemone/v1" },
    auth: text.auth,
    // Zen forwards TypeSafe's image opt-in header; text-only requests are unchanged with it.
    headers: { "TypeSafe-Danger-Zone-Images": "true", ...input.headers },
    http: input.http,
  })
  const decision = (modelID: string | ModelID, providerOptions?: ProviderOptions) =>
    decisionRoute.model({ id: modelID, providerOptions })
  return {
    id,
    model: text.chat,
    chat: text.chat,
    responses: text.responses,
    messages: text.messages,
    gemini: text.gemini,
    decision,
    configure,
  }
}

export const provider = configure()

export const model: ProviderPackage.Model<
  OpenCodeShared.Settings<OpenCodeShared.ChatOptionsInput>,
  OpenCodeShared.ChatOptionsInput
> = (modelID, settings) => configure(OpenCodeShared.config(settings)).chat(modelID)
export const responsesModel: ProviderPackage.Model<
  OpenCodeShared.Settings<OpenCodeShared.ResponsesOptionsInput>,
  OpenCodeShared.ResponsesOptionsInput,
  typeof OpenAIResponses.route.compact
> = (modelID, settings) => configure(OpenCodeShared.config(settings)).responses(modelID)
export const messagesModel: ProviderPackage.Model<
  OpenCodeShared.Settings<OpenCodeShared.MessagesOptionsInput>,
  OpenCodeShared.MessagesOptionsInput
> = (modelID, settings) => configure(OpenCodeShared.config(settings)).messages(modelID)
export const geminiModel: ProviderPackage.Model<
  OpenCodeShared.Settings<OpenCodeShared.GeminiOptionsInput>,
  OpenCodeShared.GeminiOptionsInput
> = (modelID, settings) => configure(OpenCodeShared.config(settings)).gemini(modelID)
export const decisionModel = (modelID: string, settings?: OpenCodeShared.Settings) => {
  const input = OpenCodeShared.config(settings)
  return configure(input).decision(modelID, input.providerOptions)
}

export const chat = provider.chat
export const responses = provider.responses
export const messages = provider.messages
export const gemini = provider.gemini
export const decision = provider.decision

export * as OpenCode from "./opencode.js"
