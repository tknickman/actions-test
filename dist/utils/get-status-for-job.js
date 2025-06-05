"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatusForJob = getStatusForJob;
function getStatusForJob({ stage, job, }) {
    if (stage === "post") {
        return "pending";
    }
    const failedStep = job.steps.find((step) => step.conclusion === "failure");
    if (failedStep) {
        return "failure";
    }
    return "success";
}
