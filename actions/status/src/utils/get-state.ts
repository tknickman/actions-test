const POST_STEP_ENV_KEY = "STATE_isPost";

export function isPostStep(): boolean {
  return process.env.GITHUB_ACTION_STEP_STATE === POST_STEP_ENV_KEY;
}
