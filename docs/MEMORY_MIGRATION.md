# Memory System Migration Guide

## Overview

The Discord bot now includes a comprehensive memory system that remembers conversations per channel. This guide explains the changes and how to configure the new system.

## New Features

### 1. Memory Management
- **Per-Channel Memory**: Each channel maintains its own conversation history
- **Configurable Limits**: Control how many messages to remember via environment variables
- **Automatic Cleanup**: Inactive channels are cleaned up automatically
- **Context-Aware AI**: AI responses now include conversation history for better context

### 2. New Commands
- `/memory stats` - View memory statistics
- `/memory clear` - Clear channel memory (requires Manage Messages permission)
- `/memory show` - Display recent conversation history

### 3. Enhanced AI Context
- AI models now receive conversation history for more contextual responses
- Better understanding of ongoing conversations
- Improved handling of follow-up questions

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
# Memory System Configuration
MEMORY_LIMIT=20  # Number of messages to remember per channel (default: 20)
MEMORY_CLEANUP_INTERVAL_HOURS=1  # Hours between cleanup cycles (default: 1)
```

### Recommended Settings

- **Small servers** (< 100 users): `MEMORY_LIMIT=25`
- **Medium servers** (100-1000 users): `MEMORY_LIMIT=20`
- **Large servers** (> 1000 users): `MEMORY_LIMIT=15`

## Memory Usage

The memory system is designed to be lightweight:
- Message content is truncated to 1000 characters
- Memory context is limited to 1500 characters for AI requests
- Automatic cleanup prevents memory leaks
- Inactive channels are cleaned after 24 hours

## Migration Steps

1. **Update Environment**: Add `MEMORY_LIMIT` and `MEMORY_CLEANUP_INTERVAL_HOURS` to your `.env` file
2. **Restart Bot**: No database migration needed - memory starts fresh
3. **Test Commands**: Try the new `/memory` commands
4. **Monitor Performance**: Check logs for memory usage statistics

## Performance Considerations

### Memory Impact
- Each message: ~200-300 bytes in memory
- Per channel with 20 messages: ~4-6 KB
- 100 active channels: ~400-600 KB total

### Performance Benefits
- Better AI responses due to context
- No external database required
- Automatic cleanup prevents bloat
- Configurable limits for scalability

## Troubleshooting

### High Memory Usage
- Reduce `MEMORY_LIMIT` value
- Check logs for cleanup activity
- Monitor channel count with `/memory stats`

### Context Not Working
- Verify `MEMORY_LIMIT` is set correctly
- Check that messages are being stored with `/memory show`
- Ensure bot has proper permissions in channels

### Commands Not Available
- Redeploy commands: `pnpm run deploy:local` or `pnpm run deploy:global`
- Check bot permissions (Manage Messages for memory commands)

## Logging

New log entries include:
- `[MemoryManager]` - Memory system operations
- Memory context length in API calls
- Memory statistics in command execution

## Backward Compatibility

- All existing functionality remains unchanged
- No breaking changes to existing commands
- Memory system runs in background without affecting current features

## Support

If you encounter issues:
1. Check the logs for memory-related errors
2. Verify environment variable configuration
3. Test with a fresh channel to isolate issues
4. Use `/memory stats` to diagnose memory state
