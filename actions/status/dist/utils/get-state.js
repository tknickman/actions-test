"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPostStep = isPostStep;
const POST_STEP_ENV_KEY = "STATE_isPost";
function isPostStep() {
    console.log(process.env);
    return process.env.GITHUB_ACTION_STEP_STATE === POST_STEP_ENV_KEY;
}
