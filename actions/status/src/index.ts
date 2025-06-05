import { post } from "./steps/post";
import { main } from "./steps/main";
import { isPostStep } from "./utils/get-state";

if (isPostStep()) {
  post();
} else {
  main();
}
