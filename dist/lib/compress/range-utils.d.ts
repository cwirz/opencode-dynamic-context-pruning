import type { CompressionBlock, SessionState } from "../state";
import type { BoundaryReference, CompressRangeToolArgs, InjectedSummaryResult, ParsedBlockPlaceholder, ResolvedRangeCompression, SearchContext } from "./types";
export declare function validateArgs(args: CompressRangeToolArgs): void;
export declare function resolveRanges(args: CompressRangeToolArgs, searchContext: SearchContext, state: SessionState): ResolvedRangeCompression[];
export declare function validateNonOverlapping(plans: ResolvedRangeCompression[]): void;
export declare function parseBlockPlaceholders(summary: string): ParsedBlockPlaceholder[];
export declare function validateSummaryPlaceholders(placeholders: ParsedBlockPlaceholder[], requiredBlockIds: number[], _startReference: BoundaryReference, _endReference: BoundaryReference, summaryByBlockId: Map<number, CompressionBlock>): number[];
export declare function injectBlockPlaceholders(summary: string, placeholders: ParsedBlockPlaceholder[], summaryByBlockId: Map<number, CompressionBlock>, _startReference: BoundaryReference, _endReference: BoundaryReference): InjectedSummaryResult;
export declare function collectConsumedBlockIds(requiredBlockIds: number[], placeholders: ParsedBlockPlaceholder[], summaryByBlockId: Map<number, CompressionBlock>): number[];
export declare function appendMissingBlockSummaries(summary: string, missingBlockIds: number[], summaryByBlockId: Map<number, CompressionBlock>, consumedBlockIds: number[]): InjectedSummaryResult;
//# sourceMappingURL=range-utils.d.ts.map