"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function setStatus(octokit, state, context, description) {
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
async function run() {
    try {
        // Check if this is a repository_dispatch event
        if (github.context.eventName !== "repository_dispatch") {
            core.setFailed("This action can only be used by a repository_dispatch event");
            return;
        }
        // Access the client_payload from the repository dispatch event
        const clientPayload = github.context.payload.client_payload;
        if (!clientPayload) {
            core.setFailed("No client_payload found in the repository dispatch event");
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
            if (stdout)
                core.info(stdout);
            if (stderr)
                core.warning(stderr);
            await setStatus(octokit, "success", contextName, "Command succeeded");
        }
        catch (error) {
            const err = error;
            if (err.stderr)
                core.error(err.stderr);
            await setStatus(octokit, "failure", contextName, "Command failed");
            core.setFailed(`Command failed with exit code ${err.code}`);
        }
    }
    catch (err) {
        const e = err;
        core.setFailed(`Action failed: ${e.message}`);
    }
}
run();
