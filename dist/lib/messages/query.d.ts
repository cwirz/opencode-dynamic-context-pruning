import type { PluginConfig } from "../config";
import type { WithParts } from "../state";
export declare const getLastUserMessage: (messages: WithParts[], startIndex?: number) => WithParts | null;
export declare const messageHasCompress: (message: WithParts) => boolean;
export declare const isIgnoredUserMessage: (message: WithParts) => boolean;
/** Remove plugin/UI-only user messages before the request reaches the model. */
export declare function removeIgnoredUserMessages(messages: WithParts[]): number;
/** Avoid sending a second full copy of each summary in completed compress tool history. */
export declare function minimizeCompletedCompressInputs(messages: WithParts[]): number;
export declare function isProtectedUserMessage(config: PluginConfig, message: WithParts): boolean;
//# sourceMappingURL=query.d.ts.map