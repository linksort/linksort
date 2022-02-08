import React from "react";
import { useDrag } from "react-dnd";
import { ListItem } from "@chakra-ui/react";
import { motion } from "framer-motion";

import { useLinkOperations } from "../hooks/links";
import {
  useViewSetting,
  VIEW_SETTING_CONDENSED,
  VIEW_SETTING_TALL,
  VIEW_SETTING_TILES,
} from "../hooks/views";
import LinkItemCondensed from "./LinkItemCondensed";
import LinkItemTall from "./LinkItemTall";
import LinkItemTile from "./LinkItemTile";

export default function LinkItem({ link, idx = 0 }) {
  const { setting: viewSetting } = useViewSetting();
  const { handleMoveToFolder } = useLinkOperations(link);

  const [, dragRef] = useDrag(() => ({
    type: "LINK",
    item: link,
    options: { dropEffect: "move" },
    end: (_, monitor) => {
      if (monitor.didDrop()) {
        const { parent } = monitor.getDropResult();
        handleMoveToFolder(parent.id);
      }
    },
  }));

  return (
    <ListItem minWidth={0} ref={dragRef}>
      <motion.div
        key={link.id}
        variants={{
          hidden: { opacity: 0 },
          show: (i) => ({
            opacity: 1,
            transition: { delay: i * 0.03 },
          }),
        }}
        custom={idx}
        initial="hidden"
        animate="show"
      >
        {
          {
            [VIEW_SETTING_CONDENSED]: <LinkItemCondensed link={link} />,
            [VIEW_SETTING_TALL]: <LinkItemTall link={link} />,
            [VIEW_SETTING_TILES]: <LinkItemTile link={link} />,
          }[viewSetting]
        }
      </motion.div>
    </ListItem>
  );
}
