import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
// import * as myExtension from '../../extension';

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Sample test", () => {
    openFile("namespace X");
  });
});

export async function openFile(content: string): Promise<vscode.TextDocument> {
  const document = await vscode.workspace.openTextDocument({
    language: "csharp",
    content,
  });

  vscode.window.showTextDocument(await document);
  return document;
}

export async function doc(content: string, language?: string) {
  return await vscode.workspace.openTextDocument({
    language,
    content,
  });
}
