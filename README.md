# Tailwind to Flutter Unit Converter

![A screenshot of the Tailwind to Flutter Converter in action, showing the input 'max-w-xl p-4' and the output '[BoxConstraints(maxWidth: 576.0), 16.0]'.](art/art1.png)

A fast, interactive web tool designed to bridge the gap between Tailwind CSS's design system and Flutter's styling. This utility instantly converts Tailwind's spacing, sizing, and constraint classes into their equivalent Flutter values, streamlining the process of translating web designs into mobile app layouts.

This project is built with **Vite**, **Tailwind CSS**, and vanilla **JavaScript** for a blazing-fast development experience and a highly optimized final build.

## 🤔 Motivation

As developers increasingly work across both web and mobile platforms, the need for a consistent design language is crucial. Tailwind CSS has become a standard for rapid UI development on the web, but its utility-first approach doesn't have a direct equivalent in Flutter.

This project was born out of the repetitive and time-consuming task of manually translating Tailwind's spacing, sizing, and layout values into Flutter's `double`s, `BoxConstraints`, and `BorderRadius` objects. The goal is to:

-   **Accelerate Development**: Eliminate the need to constantly reference Tailwind's documentation and perform manual calculations.
-   **Reduce Errors**: Prevent typos and miscalculations that can occur during manual conversion.
-   **Bridge the Gap**: Create a seamless workflow for developers and teams who use Tailwind for web mockups or products and Flutter for their mobile applications.

By automating this conversion, we hope to make the developer experience smoother and more efficient.

## ✨ Features

- **Live Conversion**: Get instant feedback as you type.
- **Multi-Class Parsing**: Input a full string of classes like `p-4 m-8` and get a Flutter-ready `List<dynamic>`.
- **BoxConstraints Support**: Automatically detects `min-w-`, `max-w-`, `min-h-`, and `max-h-` classes and converts them into a `BoxConstraints` object.
- **Comprehensive Unit Translation**:
    - Converts standard spacing units (`p-4`, `m-2.5`) to `double` values.
    - Handles keywords like `w-full` and `h-screen`.
    - Parses fractional values like `w-1/2` into percentages.
    - Translates `rounded-*` classes to their corresponding `double` values for `BorderRadius`.
- **Intelligent Output**: Displays a single value for one class and automatically switches to a list format for multiple classes.
- **Copy to Clipboard**: Easily grab the generated Flutter code with a single click.

## 🚀 Getting Started

This project has been set up using Vite, which provides a modern, fast, and efficient development environment.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.x or higher recommended) or
- [Bun](https://bun.sh)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/tailwind-flutter-converter.git](https://github.com/your-username/tailwind-flutter-converter.git)
    ```

2.  **Navigate to the project directory:**
    ```bash
    cd tailwind-flutter-converter
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Run the development server:**
    This command starts the Vite dev server with Hot Module Replacement (HMR).
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or the next available port).

5.  **Build for production:**
    This command bundles the application into the `dist/` directory, ready for deployment.
    ```bash
    npm run build
    ```

## ⚙️ How It Works

The core logic resides in the JavaScript file, which performs the following steps on each input change:

1.  **Input Parsing**: The input string is split into an array of individual class names.
2.  **Keyword Matching**: It first checks if a class is a direct keyword match (e.g., `w-full`).
3.  **Structured Parsing**: If not a keyword, the class is broken down into its constituent parts (e.g., `max-w-lg` -> `max`, `w`, `lg`).
4.  **Type Identification**: The script identifies the type of utility:
    - **Constraint**: `min-w`, `max-h`, etc.
    - **Spacing/Sizing**: `p`, `m`, `w`, `h`, `gap`, etc.
    - **Radius**: `rounded`, `rounded-t-lg`, etc.
5.  **Value Conversion**: Based on the type, the corresponding value is calculated (e.g., `5` becomes `20.0`, `lg` becomes `512.0`).
6.  **Aggregation**: All `BoxConstraints` values are grouped into a single object, while other values are collected separately.
7.  **Output Formatting**: The final values are formatted into a clean, Flutter-compatible string, ready to be copied.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

This project was developed and refined with the help of [Gemini](https://gemini.google.com).
