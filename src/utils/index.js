import * as FlexWebChat from "@twilio/flex-webchat-ui";

export default {
  pushTaskToWrapping(token, channel) {
    const { attributes } = channel;

    if (!attributes.taskSid && !attributes.runTimeDomain) {
      return Promise.reject(
        "Not enough information to wrap the task automatically!"
      );
    }

    return new Promise((resolve, reject) => {
      fetch(`https://${attributes.runTimeDomain}/wrap-task`, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept-Version": "latest",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS, DELETE"
        },
        mode: "no-cors",
        method: "POST",
        body: `Token=${token}&taskSid=${attributes.taskSid}&channelSid=${
          channel.sid
        }`
      })
        .then(() => {
          resolve(channel);
        })
        .catch(e => {
          reject(e);
        });
    });
  }
};
