
import { DocumentFilter, ExtensionContext, languages } from "vscode";

import { PactLinterProvider } from "./linter";

export async function activate(context: ExtensionContext) {
    console.log("pact has been activated.");
    const linterProvider = new PactLinterProvider();
    linterProvider.activate(context.subscriptions);
}