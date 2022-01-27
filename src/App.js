import React from "react";
import * as FlexWebChat from "@twilio/flex-webchat-ui";
import FlextendedState from "./store/FlextendedState";
import RBFCUReducer from "./store/reducers/RBFCUReducer";
import ChatBadges from "./ChatBadges";
import ChatHeader from "./ChatHeader";
import FindAgent from "./FindAgent";
import ShowSpinner from "./Spinner";
import ClickableMessages from './ClickableMessages';

class App extends React.Component {
  state = {};

  constructor(props) {
    super(props);

    const { configuration, resolve } = props;

    this.getChannel = this.getChannel.bind(this);
    this.getChatClient = this.getChatClient.bind(this);
    this.setUpChannelListeners = this.setUpChannelListeners.bind(this);
    this.scrollView = this.scrollView.bind(this);
    this.manageSpinnerHideShow = this.manageSpinnerHideShow.bind(this);

    // Workaround fix due in 2.0.1
    FlexWebChat.EntryPoint.defaultProps.tagline =
      configuration.componentProps.EntryPoint.tagline;

    // Alter the predefined Message
    FlexWebChat.MessagingCanvas.defaultProps.predefinedMessage.body =
      "Hello, my name is Brooke, your RBFCU Virtual Assistant. How can I help you today?";
    FlexWebChat.MessagingCanvas.defaultProps.predefinedMessage.authorName =
      "Brooke";

    FlexWebChat.Manager.create(configuration)
      .then(manager => {
        // set some variables on the global window object
        // these help us determine if flex has loaded or not
        window.Twilio = window.Twilio || {};
        FlexWebChat.manager = manager;
        window.Twilio.FlexWebChat = FlexWebChat;

        FlextendedState.addReducer("rbfcu", RBFCUReducer);
        manager.store.replaceReducer(FlextendedState.combinedReducers());

        this.setState({
          manager: manager
        });

        FlexWebChat.Actions.on("afterStartEngagement", payload => {
          window.showFlex();
          let currentState = manager.store.getState().flex;
          if (!currentState.session.isEntryPointExpanded) {
            window.toggleFlexWebchat();
          }

          this.getChatClient().then(client => {
            const { channelSid } = manager.store.getState().flex.session;
            client.getChannelBySid(channelSid).then(channel => {
              manager.store.dispatch({
                type: "SET_RBFCU_CHANNEL",
                payload: {
                  channel: channel
                }
              });
              this.setState({ channel });
              this.setUpChannelListeners();
              this.manageSpinnerHideShow(channel);

              const { question } = payload.formData;
              if (!question) return;
              channel.sendMessage(question);
              const {
                token
              } = window.Twilio.FlexWebChat.manager.store.getState().flex.session.tokenPayload;
              var event = new CustomEvent("flexAutopilotSessionStarted", {
                detail: {
                  channelSid: channelSid,
                  Token: token
                }
              });
              window.dispatchEvent(event);
            });
          });
        });

        FlexWebChat.Actions.replaceAction(
          "RestartEngagement",
          (payload, original) => {
            window.hideFlex();
            manager.store.dispatch({
              type: "SET_RBFCU_FINDING_AGENT",
              payload: {
                showFindingAgent: false
              }
            });
            manager.store.dispatch({
              type: "SET_RBFCU_CHANNEL_LISTENERS",
              payload: {
                listeners: false
              }
            });
            manager.store.dispatch({
              type: "SET_RBFCU_SHOW_SPINNER",
              payload: {
                showSpinner: false
              }
            });
            var event = new Event("flexChatEngagementEnded");
            window.dispatchEvent(event);
            return original(payload);
          }
        );

        FlexWebChat.Actions.on("afterToggleChatVisibility", () => {
          let { session } = manager.store.getState().flex;
          if (session.isEntryPointExpanded) {
            manager.store.dispatch({
              type: "SET_RBFCU_UNREAD_COUNT",
              payload: {
                unreadCount: 0
              }
            });
          }
        });

        resolve();

        // hide entry point if configured to do so
        if (configuration.hideEntryPoint) {
          FlexWebChat.RootContainer.Content.remove("entrypoint");
        }

        // remove FlexWebChat Canvas Tray (displayed when channel goes inactive)
        FlexWebChat.MessagingCanvas.Content.remove("tray");

        // replace the default chat header
        FlexWebChat.MainHeader.Content.replace(
          <ChatHeader manager={manager} key="ChatHeader" />,
          { sortOrder: 1 }
        );

        // add chat badges to the entry point component
        FlexWebChat.EntryPoint.Content.add(<ChatBadges key="ChatBadges" />, {
          sortOrder: 1
        });

        FlexWebChat.MessageList.WelcomeMessage.Content.remove();

        // Finding Agent Spinner
        FlexWebChat.MessagingCanvas.Content.add(<FindAgent key="FindAgent"></FindAgent>, {
          sortOrder: 1
        })

        FlexWebChat.MainContainer.Content.add(<ShowSpinner key="ShowSpinner"></ShowSpinner>, {
          sortOrder: 1
        })

        FlexWebChat.MessageInput.Content.add(<ClickableMessages key="ClickableMessages" />, {
          sortOrder: -1
        });

      }).catch(error => this.setState({ error }));
  }

  scrollView() {
    document.getElementsByClassName('Twilio-MessageList')[0].scrollTop = document.getElementsByClassName('Twilio-MessageList')[0].scrollHeight
  }

  getChannel() {
    return new Promise((resolve, reject) => {
      let maxTries = 25;
      let interval = setInterval(() => {
        if (this.state.channel) {
          clearInterval(interval);
          resolve(this.state.channel);
        }
        maxTries--;
        if (maxTries < 0) {
          clearInterval(interval);
          reject("Could not initialize the chat.");
        }
      }, 250);
    });
  }

  getChatClient() {
    return new Promise((resolve, reject) => {
      let maxTries = 25;
      let interval = setInterval(() => {
        if (this.state.manager && this.state.manager.chatClient) {
          clearInterval(interval);
          resolve(this.state.manager.chatClient);
        }
        maxTries--;
        if (maxTries < 0) {
          clearInterval(interval);
          reject("Could not initialize the chat client.");
        }
      }, 250);
    });
  }

  manageSpinnerHideShow(channel) {
    if (channel.members.size < 2 && channel.attributes.escalated) {
      this.state.manager.store.dispatch({
        type: "SET_RBFCU_FINDING_AGENT",
        payload: {
          showFindingAgent: true
        }
      });
    }
    if (!channel.attributes.escalated || channel.attributes.endChatOnCreate || (!channel.attributes.chatTransferOn && !channel.attributes.escalated)) {
      this.state.manager.store.dispatch({
        type: "SET_RBFCU_FINDING_AGENT",
        payload: {
          showFindingAgent: false
        }
      });
    }
    if (channel.attributes.chatTransferOn) {
      this.state.manager.store.dispatch({
        type: "SET_RBFCU_FINDING_AGENT",
        payload: {
          showFindingAgent: true
        }
      });
    }
  }

  setUpChannelListeners() {
    if (this.state.setUpChannelListeners) {
      return;
    }

    this.getChannel().then(cachedChannel => {
      cachedChannel.on("messageAdded", message => {
        var event = new Event("flexMessageSentToChannel");
        window.dispatchEvent(event);

        let { session } = this.state.manager.store.getState().flex;
        if (session.isEntryPointExpanded) {
          this.state.manager.store.dispatch({
            type: "SET_RBFCU_UNREAD_COUNT",
            payload: {
              unreadCount: 0
            }
          });
          return;
        }
        message.channel
          .getUnconsumedMessagesCount()
          .then(count => {
            this.state.manager.store.dispatch({
              type: "SET_RBFCU_UNREAD_COUNT",
              payload: {
                unreadCount: count
              }
            });
          })
          .catch(e => {
            console.log(e);
          });
      });

      window.addEventListener("timeOutSignOutRestartEngagement", e => {
        window.Twilio.FlexWebChat.Actions.invokeAction("RestartEngagement");
        window.hideFlex();
      });

      cachedChannel.on("updated", ({ channel, updateReasons }) => {
        if (
          updateReasons.indexOf("attributes") !== -1 &&
          channel.state.attributes.status === "INACTIVE"
        ) {
          window.Twilio.FlexWebChat.Actions.invokeAction("RestartEngagement");
        }
        this.manageSpinnerHideShow(channel);
        if (channel.members.size < 2 && channel.attributes.escalated) {
          var event = new Event("flexAutopilotSessionEnded");
          window.dispatchEvent(event);
        }
        if (channel.attributes.endChatOnCreate) {
          window.hideFlex();
        }
        if (channel.attributes.botEndChat) {
          var event = new Event("flexRandyEndCalled");
          window.dispatchEvent(event);
          window.Twilio.FlexWebChat.Actions.invokeAction("RestartEngagement");
        }
        if (undefined !== channel.attributes.clickableMessages && updateReasons.indexOf("attributes") !== -1) {
         // console.log("clickableMessages: ", channel.attributes.clickableMessages);
          setTimeout(() => {
            //console.log("clickableMessages: ", channel.attributes.clickableMessages);
            this.state.manager.store.dispatch({
              type: 'SET_RBFCU_SHOW_CLICKABLE_MESSAGES',
              payload: {
                clickableMessages: channel.attributes.clickableMessages
              }
            })
            this.scrollView();
          }, 500);
        } else {
          this.state.manager.store.dispatch({
            type: 'SET_RBFCU_SHOW_CLICKABLE_MESSAGES',
            payload: {
              clickableMessages: []
            }
          })
          this.scrollView();
        }
      });

      cachedChannel.on("memberJoined", member => {
        if (
          cachedChannel.members.size > 1 &&
          cachedChannel.attributes.escalated
        ) {
          var event = new Event("flexAgentJoinedChat");
          window.dispatchEvent(event);
          this.state.manager.store.dispatch({
            type: "SET_RBFCU_FINDING_AGENT",
            payload: {
              showFindingAgent: false
            }
          });
        }
      });

      this.state.manager.store.dispatch({
        type: "SET_RBFCU_CHANNEL_LISTENERS",
        payload: {
          listeners: true
        }
      });
    });
  }

  render() {
    const { manager, error } = this.state;
    if (manager) {
      return (
        <FlexWebChat.ContextProvider manager={manager}>
          <FlexWebChat.RootContainer />
        </FlexWebChat.ContextProvider>
      );
    }

    if (error) {
      console.error("Failed to initialize Flex Web Chat", error);
    }

    return null;
  }
}

export default App;
