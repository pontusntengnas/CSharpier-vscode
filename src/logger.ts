import { OutputChannel, window, workspace } from "vscode";

let outputChannel: OutputChannel | null = null;

export const log = (message: string): void => {
  const loggingEnabled = workspace
    .getConfiguration("csharpier")
    .get<boolean>("debugLog");

  if (!loggingEnabled) {
    return;
  }

  if (!outputChannel) {
    outputChannel = window.createOutputChannel("CSharpier");
  }

  outputChannel.appendLine(message);
};
