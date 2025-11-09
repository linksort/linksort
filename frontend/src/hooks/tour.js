import { useUser, useUpdateUser } from "./auth";
import once from "../utils/once";

function tour() {
  const mql = window.matchMedia("(max-width: 1023px)");
  const isMobile = mql.matches;

  // Skip tour on mobile screens
  if (isMobile) {
    return;
  }

  const t = new window.Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      classes: "shadow-md bg-purple-dark",
      scrollTo: true,
    },
  });

  t.addStep({
    id: "welcome",
    text: "Welcome to Linksort! Use this button to save new links. It's most useful when you have a URL that your're ready to copy-paste in.",
    attachTo: {
      element: "#new-link",
      on: "bottom",
    },
    buttons: [
      {
        text: "Got it",
        action: t.next,
      },
    ],
  });

  t.addStep({
    id: "filter-controls",
    text: "You can search, sort, group, and filter your links with these controls.",
    attachTo: {
      element: "#filter-controls",
      on: "right",
    },
    buttons: [
      {
        text: "Next",
        action: t.next,
      },
    ],
  });

  t.addStep({
    id: "auto-tag-controls",
    text: "As you save links, they will be automatically tagged based on their content and organized for you here.",
    attachTo: {
      element: "#auto-tag-controls",
      on: "right",
    },
    buttons: [
      {
        text: "Next",
        action: t.next,
      },
    ],
  });

  t.addStep({
    id: "folder-controls",
    text: "Finally, you can create folders to organize your links the way you want.",
    attachTo: {
      element: "#folder-controls",
      on: "right",
    },
    buttons: [
      {
        text: "Done",
        action: t.next,
      },
    ],
  });

  t.start();
}

const loadShepherd = once((cb) => {
  const link = document.createElement("link");
  link.setAttribute("rel", "stylesheet");
  link.setAttribute(
    "href",
    "https://cdn.jsdelivr.net/npm/shepherd.js@8.3.1/dist/css/shepherd.css"
  );

  const script = document.createElement("script");
  script.setAttribute(
    "src",
    "https://cdn.jsdelivr.net/npm/shepherd.js@8.3.1/dist/js/shepherd.min.js"
  );
  script.onload = tour;

  document.head.appendChild(link);
  document.head.appendChild(script);

  cb();
});

export function useTour() {
  const user = useUser();
  const mutation = useUpdateUser();

  function markTourCompleted() {
    mutation.mutate({ hasSeenWelcomeTour: true });
  }

  if (!user?.hasSeenWelcomeTour) {
    loadShepherd(markTourCompleted);
  }
}
