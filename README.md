# PromptMesh

A modern AI agent pipeline orchestration platform with a stateless server architecture and client-side configuration management.

## Architecture Overview

PromptMesh uses a **stateless server architecture** where:

- **Frontend (React + IndexedDB)**: Manages all pipeline configurations, agent settings, and user data
- **Backend (Go)**: Handles only temporary pipeline execution sessions
- **No Persistent Server Storage**: The server doesn't store any pipeline configurations or agent data

### Key Benefits

1. **Frontend Control**: All pipeline management happens in the browser
2. **Stateless Server**: Server only handles execution, no persistent data
3. **Automatic Cleanup**: Execution sessions are automatically cleaned up after 1 hour
4. **Scalability**: Server can handle multiple concurrent executions without state conflicts
5. **Privacy**: All sensitive configuration data stays in the user's browser

## Features

- 🤖 **AI Agent Pipeline Orchestration**: Chain multiple AI agents together
- 🔧 **Visual Pipeline Builder**: Drag-and-drop interface for pipeline configuration
- 💾 **Client-Side Storage**: All configurations stored in IndexedDB
- ⚡ **Stateless Execution**: Server only handles temporary execution sessions
- 🔄 **Real-time Monitoring**: Live execution logs and progress tracking
- 🎯 **Multi-Provider Support**: OpenAI, Anthropic, Google AI, Cohere, Hugging Face

## Quick Start

### Prerequisites

- Go 1.21+
- Node.js 18+
- API keys for your chosen AI providers

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/PromptMesh.git
   cd PromptMesh
   ```

2. **Set up environment variables**

   ```bash
   # Required for AI providers (choose the ones you need)
   export OPENAI_API_KEY="your-openai-key"
   export ANTHROPIC_API_KEY="your-anthropic-key"
   export GOOGLE_API_KEY="your-google-key"
   export COHERE_API_KEY="your-cohere-key"
   export HUGGINGFACEHUB_API_TOKEN="your-huggingface-key"

   # Frontend (production) API URL for Vite build
   export VITE_API_URL="https://your-api.example.com"
   ```

3. **Start the backend server**

   ```bash
   go run main.go
   ```

4. **Start the frontend development server**

   ```bash
   cd dashboard
   npm install
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` to access the PromptMesh dashboard.

## Usage

### Creating a Pipeline

1. **Configure Pipeline**: Set the pipeline name and initial prompt
2. **Add Agents**: Configure AI agents with roles, system messages, and providers
3. **Execute**: Run the pipeline and monitor execution in real-time
4. **Save Results**: Results are automatically saved to IndexedDB

### Pipeline Configuration

All pipeline configurations are stored locally in your browser's IndexedDB:

- Pipeline metadata (name, description)
- Agent configurations (roles, system messages, providers)
- Execution history and results
- User preferences

### Execution Flow

1. **Frontend** creates a temporary execution session on the server
2. **Server** receives pipeline configuration and agent details
3. **Server** executes the pipeline and returns results
4. **Frontend** saves results to IndexedDB
5. **Server** automatically cleans up the execution session after 1 hour

## API Reference

The server provides two endpoints for pipeline execution:

- `POST /pipelines/execute` - Execute a pipeline and return the final result
- `POST /pipelines/execute/stream` - Execute with Server-Sent Events (SSE) updates

See [API Documentation](dashboard/src/api/api.md) for detailed endpoint specifications.

## Development

### Project Structure

```
PromptMesh/
├── agents/           # AI agent implementations
├── dashboard/        # React frontend application
├── orchestration/    # Pipeline orchestration logic
├── server/          # Go backend server
├── shared/          # Shared constants and utilities
└── main.go          # Server entry point
```

### Frontend Development

```bash
cd dashboard
npm install
npm run dev
```

### Backend Development

```bash
go run main.go
```

### Testing

```bash
# Backend tests
go test ./...

# Frontend tests
cd dashboard
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

PromptMesh is licensed under the [GNU AGPL-3.0](LICENSE).
Copyright (C) 2025 Alexsander Hamir.
