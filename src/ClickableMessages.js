import React from 'react';
import { connect } from 'react-redux';

const wrapper = {
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    justifyContent: 'flex-start',
    maxWidth: '95%',
    maxHeight: '250px',
    border: '1px solid #E3E2E2',
    borderRadius: '6.68px',
    marginTop: '10px',
    position: 'relative',
    top: '0',
    right: '0',
    right: '0',
}

const frequentlyAskedQuestionHeader = {
    hieght:'20px',
    maxWidth: '100%',
    color: '#23488E',
    fontFamily: 'Roboto',
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '0',
    whiteSpace: 'nowrap',
    textAlign: 'left',
    alignItems: 'center',
    lineHeight: '16px',
    Letter:'normal',
    padding: '.5em',
  }

const questionRow = {
    cursor: 'pointer',
    flex: '1 0 auto',
    fontSize: '14px',
    fontFamily: 'Roboto',
    fontWeight: '300',
    letterSpacing: '0',
    borderTop: '.5px solid #E3E2E2',
    color: '#23488E',
    textAlign: 'center',
    overflow: 'hidden',
    whiteSpace: 'normal',
    maxWidth: '100%',
    alignItems: 'center',
    height: 'auto',
    textAlign: 'left',
    padding: '.5em',
    minHeight: '20px',
    lineHeight: '21px',
    Letter:'normal',
}


class ClickableMessages extends React.Component {
    constructor(props) {
        super();
        this.props = props;
    }

    render() {
        const dispatch = this.props.dispatch;
        const channel = this.props.channel;
        const questionHeaderText = "Related Questions";
        let questionRows ;
        if(this.props && this.props.clickableMessages && (this.props.clickableMessages.length > 0)) {
            questionRows =  this.createQuestionRows(dispatch, channel)
        }
        else {
            questionRows = null;
        }

        return (
            !!questionRows  && (this.props && this.props.clickableMessages && (this.props.clickableMessages.length > 0))?
                <div style={wrapper}>
                    <span style={frequentlyAskedQuestionHeader}>
                        {this.props.clickableMessages[0].message}
                    </span> {
                        <div>
                            {questionRows}
                    </div> 
                } 
            </div> : null
        )
    }

    createQuestionRows(dispatch, channel) {
        return this.props.clickableMessages.slice(1).map(function (m) {
            return (
                <div style={questionRow} onClick={(e) => {
                    // this removes all the clickable messages
                    dispatch({
                        type: 'SET_RBFCU_SHOW_CLICKABLE_MESSAGES',
                        payload: { clickableMessages: [] }
                    });
                    channel.sendMessage(m.message);
                } } key={m.key}>
                    {m.message}
                </div>
            );

        });
    }
}

function mapStateToProps(state) {
    return {
        clickableMessages: state.rbfcu.clickableMessages,
        channel: state.rbfcu.channel
    }
}

export default connect(mapStateToProps)(ClickableMessages);