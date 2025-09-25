# LocalSite AI - now with Thinking Model Support!


A modern web application that uses AI to generate HTML, CSS, and JavaScript code based on natural language prompts. Simply describe what you want to build, and the AI will create a complete, self-contained web page for you.

## Features

- **AI-Powered Code Generation**: Generate complete web pages from text descriptions
- **Live Preview**: See your generated code in action with desktop, tablet, and mobile views
- **Code Editing**: Edit the generated code directly in the browser
- **Multiple AI Providers**: Support for Azure OpenAI and Google Gemini
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, dark-themed interface with a focus on usability

## Tech Stack

- [Next.js 15](https://nextjs.org/)
- [React 19](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [OpenAI SDK](https://github.com/openai/openai-node) (for Azure OpenAI compatibility)
- [Google Generative AI SDK](https://github.com/google/generative-ai-js)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.17 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- API keys from Azure OpenAI and/or Google Gemini

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/weise25/LocalSite-ai.git
   cd LocalSite-ai
   ```

2. Install the dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Rename the `.env.example` file in the root directory to `.env.local` and add your API keys:
   ```
   # Azure OpenAI Configuration
   AZURE_OPENAI_API_BASE=https://YOUR_RESOURCE_NAME.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT_NAME
   AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
   AZURE_OPENAI_API_VERSION=2024-02-01 # Or your desired API version
   AZURE_OPENAI_DEPLOYMENT_NAMES=your_deployment_name1,your_deployment_name2 # Comma-separated list of deployed models

   # Google Gemini Configuration
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL_NAMES=gemini-pro,gemini-1.5-flash # Optional: Comma-separated list of model names

   # Default Provider (choose 'azure_openai' or 'gemini')
   DEFAULT_PROVIDER=azure_openai
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Supported AI Providers

### Azure OpenAI

1. Create an Azure OpenAI resource and deploy your models (e.g., `gpt-35-turbo`, `gpt-4`).
2. Obtain your endpoint URL, API key, and deployment names from the Azure portal.
3. Set the `AZURE_OPENAI_API_BASE`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_API_VERSION`, and `AZURE_OPENAI_DEPLOYMENT_NAMES` environment variables in your `.env.local` file.

### Google Gemini

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey) and generate an API key.
2. Set the `GEMINI_API_KEY` environment variable in your `.env.local` file.
3. Optionally, set `GEMINI_MODEL_NAMES` to specify the Gemini models you want to use.

## Deployment

### Deploying on Vercel

[Vercel](https://vercel.com) is the recommended platform for hosting your Next.js application:

1. Create an account on Vercel and connect it to your GitHub account.
2. Import your repository.
3. Add the environment variables for your desired provider (Azure OpenAI and/or Google Gemini).
4. Click "Deploy".

### Other Hosting Options

The application can also be deployed on:
- [Netlify](https://netlify.com)
- [Cloudflare Pages](https://pages.cloudflare.com)
- Any platform that supports Next.js applications

## Usage

1. Enter a prompt describing what kind of website you want to create.
2. Select an AI provider and model from the dropdown menu.
3. Click "GENERATE".
4. Wait for the code to be generated.
5. View the live preview and adjust the viewport (Desktop, Tablet, Mobile).
6. Toggle edit mode to modify the code if needed.
7. Copy the code or download it as an HTML file.

## Roadmap

### AI Models and Providers
- [x] Integration with Azure OpenAI
- [x] Integration with Google Gemini
- [ ] Adding more predefined providers (Anthropic, Groq, etc.)

### Advanced Code Generation
- [ ] Choose between different Frameworks and Libraries (React, Vue, Angular, etc.)
- [ ] File-based code generation (multiple files)
- [ ] Save and load projects
- [ ] Agentic diff-editing capabilities

### UI/UX Improvements
- [ ] Dark/Light theme toggle
- [ ] Customizable code editor settings
- [ ] Drag-and-drop interface for UI components
- [ ] History of generated code

### Accessibility
- [ ] Transcription and voice input for prompts
- [ ] Anything; feel free to make suggestions 

### Desktop App
- [ ] Turning into a cross-platform desktop app (Electron)


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

