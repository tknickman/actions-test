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
exports.setCommitStatus = setCommitStatus;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const get_status_for_job_1 = require("./get-status-for-job");
const wait_1 = require("./wait");
async function setCommitStatus({ stage, }) {
    const context = github.context;
    if (context.eventName !== "repository_dispatch") {
        core.warning(`This is not a repository_dispatch event: eventName=${context.eventName}`);
        return;
    }
    const sha = context.payload.client_payload?.git?.sha;
    if (!sha) {
        core.warning("No SHA found in client_payload.git.sha. Skipping status update.");
        return;
    }
    const token = core.getInput("github_token");
    const octokit = github.getOctokit(token);
    if (stage === "post") {
        // Give time for steps to propagate conclusions
        core.info("Waiting 5 seconds for job completion to propagate...");
        await (0, wait_1.wait)(5 * 1000);
    }
    const jobs = await octokit.rest.actions.listJobsForWorkflowRun({
        owner: context.repo.owner,
        repo: context.repo.repo,
        run_id: context.runId,
        filter: "latest",
        per_page: 100,
    });
    const octokitJob = jobs.data.jobs.find((j) => j.name === context.job);
    if (!octokitJob) {
        throw new Error(`Job not found: ${context.job}`);
    }
    // Convert Octokit job to our Job type
    const job = {
        steps: octokitJob.steps?.map((step) => ({
            conclusion: step.conclusion || "success",
        })) || [],
    };
    const state = (0, get_status_for_job_1.getStatusForJob)({ stage, job });
    core.info(`Setting commit status for SHA: ${sha}, state: ${state}`);
    const resp = await octokit.rest.repos.createCommitStatus({
        owner: context.repo.owner,
        repo: context.repo.repo,
        sha,
        state,
        context: `${context.workflow} / ${context.job}`,
        target_url: octokitJob.html_url || undefined,
    });
    core.debug(JSON.stringify(resp, null, 2));
}
