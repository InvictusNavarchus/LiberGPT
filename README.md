# LiberGPT Discord Bot

A Discord bot that provides AI-powered chat capabilities with comprehensive memory management.

## Features

- **AI Chat Integration**: Supports multiple AI models (Copilot and Blackbox)
- **Memory System**: Remembers recent conversations per channel for contextual responses
- **Slash Commands**: Modern Discord slash command interface
- **Message Mentions**: Respond to mentions with AI-generated responses
- **Reply Context**: Handles message replies with proper context
- **Comprehensive Logging**: Detailed logging for debugging and monitoring

## Memory System

The bot features a robust memory system that remembers the last N messages from everyone in each channel:

- **Per-Channel Memory**: Each channel maintains its own conversation history
- **Configurable Memory Limit**: Set the number of messages to remember via `MEMORY_LIMIT` environment variable
- **Automatic Cleanup**: Inactive channels are cleaned up after 24 hours to prevent memory leaks
- **Context-Aware Responses**: AI responses include relevant conversation history for better context
- **Memory Management Commands**: Administrators can view, clear, and manage memory

### Memory Commands

- `/memory stats` - Show memory statistics for the current channel
- `/memory clear` - Clear memory for the current channel
- `/memory show` - Display recent memory for the current channel

## Setup

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env` and configure:
   ```
   TOKEN=your_discord_bot_token_here
   APPLICATION_ID=your_bot_id_here
   GUILD_ID=your_guild_id_here
   MEMORY_LIMIT=20
   MEMORY_CLEANUP_INTERVAL_HOURS=1
   MAX_TOTAL_INPUT_LENGTH=4000
   ```
4. (Optional) Customize the AI system prompt by editing `config/system-prompt.md`
5. Deploy commands: `pnpm run deploy:local` or `pnpm run deploy:global`
6. Start the bot: `pnpm start`

## Configuration

### System Prompt
The AI system prompt can be customized by editing the `config/system-prompt.md` file. This file contains the instructions that define the AI's personality and behavior. If the file is missing or unreadable, the bot will fall back to a default prompt.

## Environment Variables

- `TOKEN` - Discord bot token (required)
- `APPLICATION_ID` - Discord application ID/Client ID (required)
- `GUILD_ID` - Guild ID for local command deployment (optional, only needed for testing)
- `MEMORY_LIMIT` - Number of messages to remember per channel (default: 20, range: 1-100)
- `MEMORY_CLEANUP_INTERVAL_HOURS` - Hours between memory cleanup cycles (default: 1, range: 0.1-168)
- `MAX_TOTAL_INPUT_LENGTH` - Maximum total input length for AI context (default: 4000, range: 100-10000)

## Commands

### Main Commands
- `/ask <prompt> [model]` - Ask the AI a question with optional model selection

### Utility Commands
- `/ping` - Check bot latency
- `/server` - Display server information
- `/user [target]` - Display user information
- `/memory <stats|clear|show>` - Manage bot memory

## AI Models

- **Copilot** (default) - General-purpose AI model
- **Blackbox** - Specialized AI model with reference support

## Usage

### Slash Commands
```
/ask prompt:What is the weather like? model:copilot
```

### Message Mentions
```
@LiberGPT What do you think about our previous conversation?
```

The bot will use conversation history to provide contextual responses.

### Reply Context
Reply to any message and mention the bot to get responses that consider the original message context.

## Project Structure

```
├── commands/
│   ├── main/
│   │   └── ask.js
│   └── utility/
│       ├── memory.js
│       ├── ping.js
│       ├── server.js
│       └── user.js
├── config/
│   └── system-prompt.md
├── events/
│   ├── interactionCreate.js
│   ├── messageCreate.js
│   └── ready.js
├── helpers/
│   ├── fetchRequest.js
│   ├── logger.js
│   ├── memoryManager.js
│   ├── safeReply.js
│   └── splitMessage.js
├── logs/
└── index.js
```

## Memory System Technical Details

The memory system implements:
- **Circular Buffer**: Maintains a fixed-size buffer per channel
- **Role-Based Storage**: Stores messages with user/assistant/system roles
- **Context Formatting**: Intelligently formats conversation history for AI context
- **Memory Cleanup**: Automatic cleanup of inactive channels
- **Performance Optimization**: Limits content length and context size to prevent performance issues

## Development

### Scripts
- `pnpm start` - Start the bot
- `pnpm run deploy:local` - Deploy commands to test guild
- `pnpm run deploy:global` - Deploy commands globally
- `pnpm run reset:local` - Reset local commands
- `pnpm run reset:global` - Reset global commands

### Dependencies
- discord.js - Discord API wrapper
- dotenv - Environment variable management
- winston - Logging framework
- winston-daily-rotate-file - Log rotation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.
