import { ExtensionContext, languages, workspace } from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';
import { startLanguageClient } from './languageclient';
import { PactLinterProvider } from './linter';

let client: LanguageClient;

export async function activate(context: ExtensionContext) {
  const linterProvider = new PactLinterProvider();
  linterProvider.activate(context.subscriptions);
  const d = languages.registerHoverProvider('pact', linterProvider);
  context.subscriptions.push(d);
  if (workspace.getConfiguration().get('pact.enableLsp')!) {
    client = await startLanguageClient(context);
  }
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
