"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const post_1 = require("./steps/post");
const main_1 = require("./steps/main");
const get_state_1 = require("./utils/get-state");
if ((0, get_state_1.isPostStep)()) {
    (0, post_1.post)();
}
else {
    (0, main_1.main)();
}
