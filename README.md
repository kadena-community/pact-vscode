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

### `pact.version`

- **Type**: `string`
- **Description**: The version of the pact you want to install using pactup

### `pact.executable`

- **Type**: `string`
- **Default**: `"pact"`
- **Description**: The name or path to the pact executable, if version is not pact 5 we will run `npx pactup install nightly` to install pact 5

### `pact.enableTrace`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable pact trace output.

### `pact.enableCoverage`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Enable code coverage. Requires coverage extension for display.

### `pact.enableLsp`

- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable the pact-lsp.

## Extension commands

`Pact: Restart Language Server` to restart pact lsp.

## Development

To get started with local development

- Make sure you have nodejs and pnpm installed.
- `pnpm i` install dependencies.
- Press F5 to run `pnpm dev` and launch vscode extension debug host

Testing, Linting and Type checking

- `pnpm test` for vitest.
- `pnpm lint` for eslint.
- `pnpm typecheck` for typescript type checking

Building

- `pnpm package` to create `.vsix` file.

Update version and create a release tag.

- `pnpm release` it will ask for version pump type then will update package.json version and creates a git tag and pushes.

Publishing

- Run `pnpm run publish` to package and publish the extension.
