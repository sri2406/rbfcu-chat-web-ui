import React from "react";
import { connect } from "react-redux";
import * as FlexWebChat from "@twilio/flex-webchat-ui";

const center = {
  textAlign: 'center',
  position: 'absolute',
  paddingTop: '50%',
  top: '0px',
  bottom: '0px',
  left: '0px',
  right: '0px',
  background: 'rgba(255, 255, 255, 0.9)',
  color: '#1C488E',
  fontWeight: '650'
};

const message = {
  color: '#1C488E',
  fontWeight: '600',
  fontSize: '1.21em'
};

const messageWithPadding = {
  paddingTop: '15px',
  color: '#1C488E',
  fontWeight: '600',
  fontSize: '1.21em'
};

class FindAgent extends React.Component {
  constructor(props) {
    super();
    this.props = props;
  }

  render() {
    return this.props.showFindingAgent ? (
      <div style={center}>
        <FlexWebChat.CircularProgress
          size={80}
          borderWidth={2}
          animating
          className="Twilio-PendingEngagementProgress"
        />
        <p>Finding you the perfect agent....</p>
        <p></p>
        <p style={messageWithPadding}>Our agents are currently assisting other members.</p>
        <p style={message}>Please continue to hold. Your chat will be answered in the order it was received.</p>
      </div>
    ) : null;
  }
}

function mapStateToProps(state) {
  return { showFindingAgent: state.rbfcu.showFindingAgent };
}

export default connect(mapStateToProps)(FindAgent);
