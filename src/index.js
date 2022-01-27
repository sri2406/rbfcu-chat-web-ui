// Uncomment to add polyfills to run on IE (e.g. IE11)
// import 'react-app-polyfill/ie9';
// import 'ie-array-find-polyfill';
// import 'array-findindex-polyfill';

import React from "react";
import ReactDOM from "react-dom";
import "regenerator-runtime/runtime";
import App from "./App";
import * as FlexWebChat from "@twilio/flex-webchat-ui";
import Utils from "./utils/index";

const brandColor0 = "#1976d2";
const brandColorMe = "#E2E2E2";
const brandColorOthers = "#1c488E";
const brandTextColor = "#ffffff";
const brandTextColorMe = "#666666";

const personalizedColors = {
  darkBlueBackground: "#1C488E",
  whiteText: "#FFFFFF",
  entryPointBackground: "rgb(0, 120, 231)",
  lighterBackground: "#ecedf1",
  primaryButtonBackground: "#1976d2",
  primaryButtonColor: "#FFFFFF",
  secondaryButtonBackground: "#6e7180",
  secondaryButtonColor: "#FFFFFF"
};

const brandMessageBubbleColors = bgColor => ({
  Bubble: {
    background: bgColor,
    color: brandTextColor
  },
  Avatar: {
    background: bgColor,
    color: brandTextColor
  },
  Header: {
    color: brandTextColor
  }
});

const brandMessageBubbleColorsMe = bgColor => ({
  Bubble: {
    background: bgColor,
    color: brandTextColorMe
  },
  Avatar: {
    background: bgColor,
    color: brandTextColorMe
  },
  Header: {
    color: brandTextColorMe
  }
});

const brandedColors = {
  Chat: {
    MessageListItem: {
      FromOthers: brandMessageBubbleColors(brandColorOthers),
      FromMe: brandMessageBubbleColorsMe(brandColorMe)
    },
    MessageInput: {
      Button: {
        background: brandColor0,
        color: brandTextColor
      }
    },
    MessageCanvasTray: {
      Container: {
        background: personalizedColors.darkBlueBackground,
        color: personalizedColors.whiteText
      }
    }
  },
  MainHeader: {
    Container: {
      background: personalizedColors.darkBlueBackground,
      color: personalizedColors.whiteText
    },
    Logo: {
      fill: brandTextColor
    }
  },
  EntryPoint: {
    Container: {
      background: personalizedColors.whiteText,
      color: personalizedColors.entryPointBackground
    }
  }
};

const appConfig = {
  startEngagementOnInit: false,
  colorTheme: {
    overrides: brandedColors
  },
  componentProps: {
    MainHeader: {
      imageUrl: "assets/images/icons/rbfcu-spin-logo-white.svg"
    },
    MessagingCanvas: {
      showTrayOnInactive: false,
      showReadStatus: false,
      showWelcomeMessage: false,
    },
    EntryPoint: {
      tagline: "ACTIVE",
      isEntryPointExpanded: true,
      bottom: "5%",
      right: "3%"
    },
    MessageListItem: {
      useFriendlyName: false
    },
    MainContainer: {
      height: "70%",
      width: "315px;",
      bottom: "8%",
      right: "2%"
    }
  }
};

let isLoaded = false;
let rootContainer;
let chatContainer;
const containerId = "flex-webchat-container";

window.loadFlexWebchat = function (overrides) {
  const config = Object.assign(appConfig, overrides);

  if (isLoaded) {
    return Promise.resolve();
  }

  rootContainer = document.getElementById(config.container);
  chatContainer = document.createElement("div");
  chatContainer.id = containerId;

  rootContainer.appendChild(chatContainer);

  return new Promise((resolve, reject) => {
    isLoaded = true;
    ReactDOM.render(
      <App configuration={config} resolve={resolve} reject={reject} />,
      document.getElementById(containerId)
    );
  });
};

function checkLoaded() {
  if (!isLoaded) {
    throw new Error("Flex is not initialized");
  }
}

window.isLoadedFlex = function () {
  return isLoaded;
};

window.toggleFlexEntryPoint = function () {
  checkLoaded();
  if (rootContainer.style.display === "none") {
    rootContainer.style.display = "";
  } else {
    rootContainer.style.display = "none";
  }
};

window.showFlex = function () {
  if (rootContainer) {
    rootContainer.style.display = "";
  }
};

window.hideFlex = function () {
  if (rootContainer) {
    rootContainer.style.display = "none";
  }
};

window.toggleFlexWebchat = function () {
  checkLoaded();
  FlexWebChat.Actions.invokeAction("ToggleChatVisibility");
};

window.waitForChannel = function () {
  return new Promise((resolve, reject) => {
    let maxTries = 50;
    let interval = setInterval(() => {
      let channel = window.Twilio.FlexWebChat.manager.store.getState().flex.chat
        .channels;
      let locatedChannel = channel[Object.keys(channel)[0]];
      if (undefined !== locatedChannel) {
        clearInterval(interval);
        resolve(locatedChannel.source);
      }
      maxTries--;
      if (maxTries < 0) {
        clearInterval(interval);
        reject("Could not initialize the chat.");
      }
    }, 250);
  });
};

window.flexIdleTimeOutOrSignOut = function () {
  checkLoaded();

  window.Twilio.FlexWebChat.manager.store.dispatch({
    type: "SET_RBFCU_SHOW_SPINNER",
    payload: {
      showSpinner: true
    }
  });
  const {
    token
  } = window.Twilio.FlexWebChat.manager.store.getState().flex.session.tokenPayload;
  var event = new CustomEvent("flexChatEngagementAbandoned", {
    detail: {
      Token: token
    }
  });
  window.dispatchEvent(event);
  window.hideFlex();
  FlexWebChat.Actions.invokeAction("RestartEngagement");
};


window.restartEngagement = function () {
  checkLoaded();

  window.Twilio.FlexWebChat.manager.store.dispatch({
    type: "SET_RBFCU_SHOW_SPINNER",
    payload: {
      showSpinner: true
    }
  });

  window
    .waitForChannel()
    .then(channel => {
      const {
        token
      } = window.Twilio.FlexWebChat.manager.store.getState().flex.session.tokenPayload;
      Utils.pushTaskToWrapping(token, channel)
        .then(() => {
          window.hideFlex();
          FlexWebChat.Actions.invokeAction("RestartEngagement");
          window.Twilio.FlexWebChat.manager.store.dispatch({
            type: "SET_RBFCU_SHOW_SPINNER",
            payload: {
              showSpinner: false
            }
          });
        })
        .catch(e => {
          console.error(e);
          window.Twilio.FlexWebChat.manager.store.dispatch({
            type: "SET_RBFCU_SHOW_SPINNER",
            payload: {
              showSpinner: false
            }
          });
        });
    })
    .catch(e => {
      console.error(e);
      window.Twilio.FlexWebChat.manager.store.dispatch({
        type: "SET_RBFCU_SHOW_SPINNER",
        payload: {
          showSpinner: false
        }
      });
    });
};
