import { useUser, useUpdateUser } from "./auth";
import once from "../utils/once";

function tour() {
  const mql = window.matchMedia("(max-width: 1023px)");
  const isMobile = mql.matches;

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
      element: isMobile ? "#mobile-new-link" : "#new-link",
      on: "bottom",
    },
    buttons: [
      {
        text: "Got it",
        action: t.next,
      },
    ],
  });

  if (isMobile) {
    t.addStep({
      id: "mobile-nav",
      text: "Click here to show your link sorting controls.",
      attachTo: {
        element: "#mobile-nav",
        on: "bottom",
      },
      buttons: [
        {
          text: "Next",
          action() {
            document.getElementById("mobile-nav").click();
            setTimeout(this.next, 500);
          },
        },
      ],
    });
  }

  t.addStep({
    id: "filter-controls",
    text: "You can search, sort, group, and filter your links with these controls.",
    attachTo: {
      element: isMobile ? "#mobile-filter-controls" : "#filter-controls",
      on: isMobile ? "bottom" : "right",
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
      element: isMobile ? "#mobile-auto-tag-controls" : "#auto-tag-controls",
      on: isMobile ? "top" : "right",
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
    text: isMobile
      ? "Finally, you can create folders to organize your links the way you want. Click anywhere in the dimmed area to close the sidebar."
      : "Finally, you can create folders to organize your links the way you want.",
    attachTo: {
      element: isMobile ? "#mobile-folder-controls" : "#folder-controls",
      on: isMobile ? "top" : "right",
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
