# Token usage

Token counts for the Claude Code session that built Ichimai, from 21 Oct 2026 to 22 Oct 2026. They're totalled from the session log and run up to the request that created this repo; the few calls after that (writing these files and pushing) aren't included.

## Summary

- **Model:** Claude Opus 5.5 (`claude-opus-5-5`) for all 79 model calls. No subagents were used.
- **Total tokens processed:** 18,306,610
- **Estimated cost:** about **$12.15** at Anthropic API list prices
- **Prompts:** 12 typed prompts (see [PROMPTS.md](PROMPTS.md))

## Breakdown

| Category | Tokens | Rate ($ per 1M) | Est. cost |
| --- | ---: | ---: | ---: |
| Input (uncached) | 160 | 4.00 | $0.00 |
| Output | 189,092 | 20.00 | $3.78 |
| Cache writes, 1-hour TTL | 608,244 | 8.00 | $4.87 |
| Cache writes, 5-minute TTL | 0 | 5.00 | $0.00 |
| Cache reads | 17,509,114 | 0.20 | $3.50 |
| **Total** | **18,306,610** | | **$12.15** |

## How to read this

- **Most tokens are cache reads.** Each model call re-reads the conversation so far, and prompt caching bills those re-reads at 5% of the normal input rate. That's why 17.5M tokens cost only about $3.50.
- **Output is the smallest count but a large share of cost:** the code, the fold geometry for 13 models, and the replies.
- **Rates** are Claude Opus 5.5 API list prices: $4 per 1M input, $20 per 1M output, $0.20 per 1M cache reads. Cache writes bill at 2× input for the 1-hour TTL ($8) and 1.25× for 5 minutes ($5). This session used only the 1-hour TTL.

## Assumptions

- The dollar figure is an estimate at API rates. Claude Code on a subscription plan is billed differently, so it isn't what we were charged.
- Counts come from the `usage` field on each model response in the local session log, with each response counted once.
