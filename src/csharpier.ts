import { spawn } from "child_process";

export const formatFileWithCSharpierInPlace = (documentName: string) =>
  spawn("dotnet", ["csharpier", documentName, "--fast"], {
    timeout: 2000,
  });

export const formatCodeWithCSharpier = (
  code: string
): Promise<string | Error | undefined> =>
  new Promise((resolve) => {
    const csharpierProcess = spawn(
      "dotnet",
      ["csharpier", "--fast", "--write-stdout"],
      {
        timeout: 2000,
      }
    );

    const output: Array<string> = [];

    csharpierProcess.stdout.on("data", (chunk: Buffer) => {
      output.push(chunk.toString());
    });

    csharpierProcess.on("error", resolve);

    csharpierProcess.on("exit", () => {
      if (output.length <= 0 && code.length > 0) {
        // HACK: if this is true then file could not compile.
        // Need to find a better way for this.
        resolve(undefined);
      }

      resolve(output.join());
    });

    csharpierProcess.stdin.write(code);
    csharpierProcess.stdin.end();
  });
