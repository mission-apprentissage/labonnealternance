# Blocked CFA Detection Optimization

## Context

The job [server/src/jobs/offrePartenaire/blockJobsPartnersFromCfaList.ts](server/src/jobs/offrePartenaire/blockJobsPartnersFromCfaList.ts) blocks partner offers when a blacklisted CFA is detected in one of these fields:

- `workplace_name`
- `offer_description`
- `workplace_description`

The matching logic currently lives in [server/src/jobs/offrePartenaire/isCompanyInBlockedCfaList.ts](server/src/jobs/offrePartenaire/isCompanyInBlockedCfaList.ts).

## Current Implementation

The current implementation keeps the blacklist as a simple `cfaCompanyList` string array. Adding a new blocked CFA only requires adding a new string entry to that array.

Matching behavior is:

- case-insensitive
- accent-insensitive
- punctuation normalized to spaces
- able to detect a blocked CFA mention inside a longer text

This simplicity is intentional and is kept for now.

## Observed Scale

Current order of magnitude:

- blacklist size: about 1810 entries
- `offer_description` count: 383170
- `offer_description` average length: about 445 chars
- `offer_description` p90/p95/p99: about 1984 / 2851 / 4892 chars
- `offer_description` max length: 14428 chars
- `workplace_description` average length: about 55 chars
- `workplace_description` p90/p95/p99: about 261 / 405 / 1050 chars
- `workplace_description` max length: 4019 chars

With those inputs, the current linear scan remains acceptable short term, but it may become a bottleneck on full collection runs if text lengths or blacklist size keep growing.

## Why Aho-Corasick

If this detection needs to be optimized, Aho-Corasick is the preferred direction over a giant compiled regex.

Reasons:

- it is designed for multi-pattern search
- it scales better with a large blacklist
- it is more predictable on long text fields
- it keeps the source of truth unchanged: `cfaCompanyList`

A compiled regex would be simpler to introduce, but with a blacklist of this size it is more of an intermediate solution than a durable one.

## Deferred Refactor Plan

If optimization becomes necessary:

1. Add a small server-side Aho-Corasick matcher utility.
2. Keep `cfaCompanyList` unchanged in [server/src/jobs/offrePartenaire/isCompanyInBlockedCfaList.ts](server/src/jobs/offrePartenaire/isCompanyInBlockedCfaList.ts).
3. Keep the current normalization pipeline unchanged.
4. Build the automaton once at module load.
5. Replace the current linear substring scan with the matcher.
6. Keep existing tests unchanged as the behavioral contract.

## Decision

The current implementation is kept for now.

Reason:

- the feature is correct
- the blacklist remains easy to maintain
- the current runtime cost is acceptable short term
- the Aho-Corasick path is documented and ready if optimization becomes necessary
