# Welcome to Pact VSCode plugin

The Pact VSCode plugin supports syntax highlighting and completion for the Pact Programming Language, used on the Kadena Blockchain.

<picture>
  <source srcset="./images/kadena-logo-white.png" media="(prefers-color-scheme: dark)"/>
  <img src="./images/kadena-logo-black.png" width="200" alt="kadena logo" />
</picture>
  
  
Pact is an open-source programming language for writing smart contracts.  
  
It’s designed from the ground up to support the unique challenges of developing solutions to run on a blockchain. Pact empowers developers to create robust and high-performance logic for transactions. It facilitates execution of mission-critical business operations quickly and effectively.  
  
Pact is designed with safety in mind. Its design is informed by existing approaches to smart contracts as well as stored procedure languages like SQL and LISP. Pact resembles a general-purpose, Turing-complete language. It includes LISP-like syntax, user functions, modules, and imperative style.  
  
For more information please visit:

<https://docs.kadena.io/build/>  
<https://www.kadena.io/>

## Features

- Syntax-highting
- Linting
- Completion

## Requirements

- For tracing and coverage: [pact](https://github.com/kadena-io/pact)
- For LSP: [pact-5](https://github.com/kadena-io/pact-5) if not installed we use [pactup](https://github.com/kadena-community/pactup) to install it.

## Extension Settings

## `pact.executable`

- **Type**: `string`
- **Default**: `"pact"`
- **Description**: The name or path to the pact executable, if version is not pact 5 we will run `npx pactup install development-latest` to install pact 5

## `pact.enableTrace`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable pact trace output.

## `pact.enableCoverage`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Enable code coverage. Requires coverage extension for display.

## `pact.enableLsp`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable the pact-lsp.
-
- `pact.pactExecutable` pact binary path if not provider we use

## Release Notes

### 0.0.6

Added Code Coverage
Added new logo

### 0.0.5

Added Pact LSP client

### 0.0.4

Added linting support

### 0.0.3

Updated the description and on request of the Kadena Team added a Kadena logo to the extension.

### 0.0.2

Fixed support for .repl files and lowered the minimal required VSCode version

### 0.0.1

Initial release of the highlighting syntax

---
