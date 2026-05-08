import type { IconType } from "react-icons";
import { BiMessageRoundedDots, BiRefresh } from "react-icons/bi";
import { FiCamera, FiRefreshCw, FiX } from "react-icons/fi";
import { MdCampaign, MdContacts } from "react-icons/md";
import {
    RiArrowUpLine,
  RiDashboardLine,
  RiFlowChart,
  RiMoonLine,
  RiNotification3Line,
  RiSendPlaneLine,
  RiSettings3Line,
  RiSunLine,
} from "react-icons/ri";
import { SiBitcoin } from "react-icons/si";
import * as mdi from "@mdi/js";

type IconEntry = string | IconType;

export const iconMap: Record<string, IconEntry> = {
  // Material Design Icons
  "mdi:speedometer": mdi.mdiSpeedometer,

  // Remix Icons
  "ri:dashboard-line": RiDashboardLine,
  "ri:flow-chart": RiFlowChart,
  "ri:moon-line": RiMoonLine,
  "ri:send-plane-line": RiSendPlaneLine,
  "ri:notification-3-line": RiNotification3Line,
  "ri:settings-3-line": RiSettings3Line,
  "ri:sun-line": RiSunLine,
  "ri:arrow-up-line": RiArrowUpLine,

  // Boxicons
  "bi:message-rounded-dots": BiMessageRoundedDots,
  "bi:refresh": BiRefresh,

  // Material icons
  "md:contacts": MdContacts,
  "md:campaign": MdCampaign,

  // Feather icons
  "fi:camera": FiCamera,
  "fi:refresh-cw": FiRefreshCw,
  "fi:x": FiX,

  // Simple Icons
  "si:bitcoin": SiBitcoin,
};
