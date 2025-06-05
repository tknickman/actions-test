import * as core from "@actions/core";
import * as github from "@actions/github";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function setStatus(
  octokit: ReturnType<typeof github.getOctokit>,
  state: "pending" | "success" | "failure",
  context: string,
  description: string
): Promise<void> {
  const { owner, repo } = github.context.repo;
  const sha = github.context.sha;

  await octokit.rest.repos.createCommitStatus({
    owner,
    repo,
    sha,
    state,
    context,
    description,
  });
}

async function run(): Promise<void> {
  try {
    // Check if this is a repository_dispatch event
    if (github.context.eventName !== "repository_dispatch") {
      core.setFailed(
        "This action can only be used by a repository_dispatch event"
      );
      return;
    }

    // Access the client_payload from the repository dispatch event
    const clientPayload = github.context.payload.client_payload;
    if (!clientPayload) {
      core.setFailed(
        "No client_payload found in the repository dispatch event"
      );
      return;
    }

    // Example of accessing specific fields from client_payload
    const projectName = clientPayload.project?.name;
    const stateType = clientPayload.state?.type;

    core.info(`Processing deployment for project: ${projectName}`);
    core.info(`State type: ${stateType}`);

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error("GITHUB_TOKEN is not set in environment variables.");
    }

    const contextName = core.getInput("context-name", { required: true });
    const command = core.getInput("command", { required: true });

    const octokit = github.getOctokit(token);

    // Set the status to pending
    await setStatus(octokit, "pending", contextName, "Command is running...");

    core.info(`Executing: ${command}`);
    try {
      const { stdout, stderr } = await execAsync(command, {
        shell: "/bin/bash",
      });
      if (stdout) core.info(stdout);
      if (stderr) core.warning(stderr);

      await setStatus(octokit, "success", contextName, "Command succeeded");
    } catch (error) {
      const err = error as { stdout?: string; stderr?: string; code?: number };
      if (err.stderr) core.error(err.stderr);
      await setStatus(octokit, "failure", contextName, "Command failed");
      core.setFailed(`Command failed with exit code ${err.code}`);
    }
  } catch (err) {
    const e = err as Error;
    core.setFailed(`Action failed: ${e.message}`);
  }
}

run();
