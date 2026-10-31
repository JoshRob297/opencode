import type { ProviderPackage } from "../provider-package.js"
import type { OpenAIResponses } from "../protocols/openai-responses.js"
import { OpenCodeShared } from "./opencode-shared.js"

export type {
  ChatOptionsInput,
  Config,
  GeminiOptionsInput,
  MessagesOptionsInput,
  ResponsesOptionsInput,
  Settings,
} from "./opencode-shared.js"

// Go answers 400 without an `x-opencode-session` header; send a stable ID per conversation in
// `request.http.headers`. https://opencode.ai/v2/docs/console/go/#where-can-i-use-it
const go = OpenCodeShared.textAPIs("opencode-go", "https://opencode.ai/inference/go")

export const id = go.id
export const routes = go.routes

export const configure = (input: OpenCodeShared.Config = {}) => {
  const text = go.configure(input)
  return {
    id,
    model: text.chat,
    chat: text.chat,
    responses: text.responses,
    messages: text.messages,
    gemini: text.gemini,
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

export const chat = provider.chat
export const responses = provider.responses
export const messages = provider.messages
export const gemini = provider.gemini

export * as OpenCodeGo from "./opencode-go.js"
