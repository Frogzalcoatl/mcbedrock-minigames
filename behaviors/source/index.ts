import "./commands/index";
import "./games/index";
import "./structures/index";
import "./miscEvents";
import { ChatCooldownManager } from "./tools/done/chatCooldown";

const chatCooldowns = new ChatCooldownManager(500);
chatCooldowns.init();
