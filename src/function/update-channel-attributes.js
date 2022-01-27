exports.handler = async function (context, event, callback) {
    console.log("hit ");
    let responseObject = null;
    let available_timings = "Our representatives are available Monday through Friday 7:00 AM to 7:00 PM, Saturday 9:00 AM to 4:00 PM Central Time Zone.";
    let channelSid = event.channelSid;
    let outcome = event.outcome;
    let client = context.getTwilioClient();

    let channel = await client.chat.services(context.CHAT_SERVICE_SID).channels(channelSid).fetch();
    let newAttributes = JSON.parse(channel.attributes);

    if (outcome === 'bot-escalated-chat') {
        let category = event.category;
        console.log("category: ", category);
        let accountsDisabledStatus = event.accountsDisabledStatus;
        console.log("accountsDisabledStatus: ", accountsDisabledStatus);
        let cardsDisabledStatus = event.cardsDisabledStatus;
        console.log("cardsDisabledStatus: ", cardsDisabledStatus);
        let loansDisabledStatus = event.loansDisabledStatus;
        console.log("loansDisabledStatus: ", loansDisabledStatus);

        let isDisabled = (category === 'Accounts' && accountsDisabledStatus === 'true') || (category === 'Cards' && cardsDisabledStatus === 'true') || (category === 'Loans' && loansDisabledStatus === 'true');
        console.log("isDisabled: ", isDisabled);

        if (!isDisabled) {
            Object.assign(newAttributes, {
                escalated: true,
                endChatOnCreate: false,
                chatTransferOn: false
            });
        } else {
            let messageBody = "We apologize for the inconvenience. \nCurrently our representatives are not available due to technical difficulties on our end. \nPlease try again later. \n" + available_timings + "\n- Ask me another question \n- Type 'end chat' to end this chat.";
            await client.chat.services(context.CHAT_SERVICE_SID)
                .channels(channelSid)
                .messages
                .create({
                    body: messageBody,
                    from: 'Randy'
                })
                .then(message => console.log(message.sid));
            callback("NOT OK");
        }
    }

    if (outcome === 'bot-ended-chat') {
        Object.assign(newAttributes, {
            botEndChat: true
        });
    }

    await client.chat.services(context.CHAT_SERVICE_SID).channels(channelSid).update({
        attributes: JSON.stringify(newAttributes)
    });
    console.log("updated channel");

    callback(null);
}